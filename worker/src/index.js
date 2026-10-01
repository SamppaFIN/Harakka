/**
 * Harakan Worker: äänestysten API, tallennus R2:ssa (ei tietokantaa). Sivu on GitHub Pagesissa.
 *
 *   GET    /api/votes                 lista (vain näkyvät); x-voter → mukana myVote
 *   GET    /api/votes/:id             yksi äänestys (codeHash ja äänet eivät koskaan mukana)
 *   POST   /api/votes                 uusi äänestys; palauttaa muokkauskoodin KERRAN
 *   PATCH  /api/votes/:id             muokkaus koodilla (otsikko/kuvaus/kuva/vaihtoehdot/sulkeutuminen)
 *   DELETE /api/votes/:id             poisto koodilla
 *   POST   /api/votes/:id/vote        ääni { voterId, optionId } — yksi per selain, vaihto sallittu
 *   POST   /api/votes/:id/report      "ilmoita asiaton" — anonyymi, nostaa laskuria
 *   GET    /img/<id>/<tiedosto>       ladattu kuva
 *   GET    /admin                     ylläpitosivu (kysyy ADMIN_SECRETin selaimessa)
 *   GET    /api/admin/votes           kaikki piilotetut mukaan lukien (x-admin-key)
 *   POST   /api/admin/votes/:id/status  piilota/näytä (x-admin-key)
 *   DELETE /api/admin/votes/:id       poisto ilman koodia (x-admin-key)
 *
 * Äänestäjästä ei tallenneta mitään tunnistettavaa: selain arpoo satunnaisen tunnisteen,
 * josta tallennetaan vain äänestyskohtainen HMAC-tiiviste. IP:tä käytetään vain ohimenevästi
 * nopeusrajoittimen avaimena.
 *
 * Kirjoitukset ovat optimistisia: luetaan etag, kirjoitetaan onlyIf-ehdolla ja yritetään uudelleen
 * jos joku ehti väliin — yhtäaikaiset äänet eivät hävitä toisiaan.
 */
import { validateCreate, validatePatch, validateBallot } from './schema.js';
import { generateCode, hashCode, verifyCode, verifyAdmin, voterKey, slugify, isMasterEditCode } from './code.js';

const MAX_BODY = 4_500_000; // kuva base64:nä + teksti
const MAX_BALLOTS = 20000; // ~1 Mt per äänestys, pitää R2-objektin kohtuullisena
const WRITE_RETRIES = 12;
const VOTER_RE = /^[A-Za-z0-9_-]{16,64}$/;

const json = (body, status = 200, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

// Poistaa aina koodin, tiivisteen ja äänestäjätiivisteet vastauksesta.
function publicView(poll, voterHash) {
  const { codeHash, ballots, ...pub } = poll;
  if (voterHash && ballots && ballots[voterHash]) pub.myVote = ballots[voterHash];
  return pub;
}

async function rateLimited(env, key) {
  if (!env.RATE_LIMITER) return false; // paikallinen kehitys ilman sidontaa
  try {
    const { success } = await env.RATE_LIMITER.limit({ key });
    return !success;
  } catch {
    return false; // rajoitin ei saatavilla — ei estetä käyttöä sen takia
  }
}

async function readBody(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return { error: json({ error: 'too_large' }, 413) };
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return { error: json({ error: 'bad_json' }, 400) };
  }
}

const keyOf = (id) => `votes/${id}.json`;
const isHidden = (p) => p.status === 'hidden';

function customMetaFor(poll) {
  return { id: poll.id, title: poll.title.slice(0, 120), status: poll.status };
}

function putPoll(env, poll, options) {
  return env.BUCKET.put(keyOf(poll.id), JSON.stringify(poll), { customMetadata: customMetaFor(poll), ...options });
}

/**
 * Lukee, muokkaa fn:llä ja kirjoittaa takaisin etag-ehdolla. fn palauttaa
 * { poll, result, skipWrite? } tai { error: Response }.
 */
async function mutate(env, id, fn) {
  for (let i = 0; i < WRITE_RETRIES; i++) {
    const obj = await env.BUCKET.get(keyOf(id));
    if (!obj) return { error: json({ error: 'not_found' }, 404) };
    const poll = await obj.json();
    const out = await fn(poll);
    if (out.error || out.skipWrite) return out;
    const written = await putPoll(env, out.poll, { onlyIf: { etagMatches: obj.etag } });
    if (written) return out;
    // Joku ehti väliin: satunnainen, kasvava viive hajottaa kilpailevat yritykset.
    await new Promise((r) => setTimeout(r, Math.random() * 15 * (i + 1)));
  }
  return { error: json({ error: 'busy' }, 409) };
}

async function uniqueId(env, title) {
  const base = slugify(title);
  for (let i = 0; i < 5; i++) {
    const id = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await env.BUCKET.head(keyOf(id)))) return id;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

// Vaihtoehdon id on lyhyt ja vain äänestyksen sisällä yksilöllinen (ei riipu otsikon pituudesta).
const newOptionId = () => `o${Math.random().toString(36).slice(2, 8)}`;

async function storeImage(env, pollId, media) {
  const key = `img/${pollId}/${Date.now()}.${media.detected.ext}`;
  await env.BUCKET.put(key, media.bytes, { httpMetadata: { contentType: media.detected.type } });
  return { kind: media.kind, src: `/${key}`, alt: media.alt };
}

async function deleteImage(env, pollId, media) {
  const key = media && typeof media.src === 'string' ? media.src.replace(/^\/+/, '') : '';
  if (key.startsWith(`img/${pollId}/`)) await env.BUCKET.delete(key).catch(() => {});
}

async function deleteAllImages(env, pollId) {
  let cursor;
  do {
    const page = await env.BUCKET.list({ prefix: `img/${pollId}/`, cursor });
    if (page.objects.length) await env.BUCKET.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

async function voterHashOf(request, env, pollId) {
  const v = request.headers.get('x-voter') || '';
  return VOTER_RE.test(v) ? voterKey(v, pollId, env.CODE_SECRET) : null;
}

async function listVotes(request, env) {
  const votes = [];
  const voter = request.headers.get('x-voter') || '';
  const validVoter = VOTER_RE.test(voter) ? voter : null;
  let cursor;
  do {
    const page = await env.BUCKET.list({ prefix: 'votes/', cursor, include: ['customMetadata'] });
    const batch = await Promise.all(
      page.objects
        .filter((o) => !(o.customMetadata && o.customMetadata.status === 'hidden'))
        .map(async (o) => {
          try {
            const body = await env.BUCKET.get(o.key);
            return body ? await body.json() : null;
          } catch {
            return null;
          }
        }),
    );
    for (const p of batch) {
      if (!p || isHidden(p)) continue;
      votes.push(publicView(p, validVoter ? await voterKey(validVoter, p.id, env.CODE_SECRET) : null));
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return json({ votes });
}

async function getVote(request, env, id) {
  const obj = await env.BUCKET.get(keyOf(id));
  if (!obj) return json({ error: 'not_found' }, 404);
  const poll = await obj.json();
  if (isHidden(poll)) return json({ error: 'not_found' }, 404);
  return json(publicView(poll, await voterHashOf(request, env, id)));
}

async function createVote(request, env) {
  const { value: input, error } = await readBody(request);
  if (error) return error;

  // Piilokenttä: ihminen ei näe eikä täytä sitä. Botille vastataan kuin onnistuisi.
  if (input && input.website) return json({ ok: true, id: 'ok', code: '-----' }, 201);

  if (await rateLimited(env, 'create')) return json({ error: 'busy' }, 429);

  const result = validateCreate(input);
  if (!result.ok) return json({ error: 'invalid', fields: result.errors }, 400);
  const v = result.value;

  const id = await uniqueId(env, v.title);
  const code = generateCode();
  const now = Date.now();
  const poll = {
    id,
    title: v.title,
    description: v.description,
    options: v.options.map((o) => ({ id: newOptionId(), text: o.text, ...(o.color ? { color: o.color } : {}), votes: 0 })),
    closesAt: v.closesAt,
    createdAt: new Date(now).toISOString(),
    updated: now,
    status: 'visible',
    reports: 0,
    ballots: {},
    codeHash: await hashCode(code, env.CODE_SECRET),
  };
  if (v.media) poll.media = await storeImage(env, id, v.media);

  await putPoll(env, poll);
  return json({ ok: true, id, code }, 201);
}

async function patchVote(request, env, id) {
  const { value: input, error } = await readBody(request);
  if (error) return error;
  if (await rateLimited(env, `edit:${id}`)) return json({ error: 'busy' }, 429);

  const result = validatePatch(input);
  const code = String((input && input.code) || '');
  let replacedMedia = null;
  let newMedia = null;

  const out = await mutate(env, id, async (poll) => {
    // Koodi tarkistetaan ennen validointivirheiden paljastamista.
    // Yleisavain (env.MASTER_EDIT_CODE) toimii vain muokkaukseen, ei poistoon.
    const authorized = isMasterEditCode(code, env.MASTER_EDIT_CODE) || (await verifyCode(code, poll.codeHash, env.CODE_SECRET));
    if (!authorized) return { error: json({ error: 'forbidden' }, 403) };
    if (!result.ok) return { error: json({ error: 'invalid', fields: result.errors }, 400) };
    const v = result.value;

    // Vaihtoehdot yhdistetään id:n perusteella: muokattu teksti/väri säilyttää äänet.
    const existing = new Map(poll.options.map((o) => [o.id, o]));
    const used = new Set();
    const options = v.options.map((o) => {
      const old = o.id && existing.has(o.id) && !used.has(o.id) ? existing.get(o.id) : null;
      if (old) used.add(old.id);
      return { id: old ? old.id : newOptionId(), text: o.text, ...(o.color ? { color: o.color } : {}), votes: old ? old.votes : 0 };
    });
    // Poistettujen vaihtoehtojen äänet poistuvat myös äänestäjäkirjanpidosta.
    const keep = new Set(options.map((o) => o.id));
    const ballots = Object.fromEntries(Object.entries(poll.ballots || {}).filter(([, optId]) => keep.has(optId)));

    const updated = { ...poll, title: v.title, description: v.description, options, ballots, closesAt: v.closesAt, updated: Date.now() };
    if (v.media === null) {
      replacedMedia = poll.media;
      delete updated.media;
    } else if (v.media) {
      replacedMedia = poll.media;
      if (newMedia) await deleteImage(env, id, newMedia); // uudelleenyritys: edellinen yritys jätti kuvan
      newMedia = updated.media = await storeImage(env, id, v.media);
    }
    return { poll: updated, result: {} };
  });

  if (out.error) {
    if (newMedia) await deleteImage(env, id, newMedia); // tallennus epäonnistui → ei orpoa kuvaa
    return out.error;
  }
  if (replacedMedia) await deleteImage(env, id, replacedMedia);
  return json({ ok: true });
}

async function deleteVote(request, env, id) {
  const { value: input, error } = await readBody(request);
  if (error) return error;
  if (await rateLimited(env, `edit:${id}`)) return json({ error: 'busy' }, 429);

  const obj = await env.BUCKET.get(keyOf(id));
  if (!obj) return json({ error: 'not_found' }, 404);
  const poll = await obj.json();
  if (!(await verifyCode(String((input && input.code) || ''), poll.codeHash, env.CODE_SECRET))) return json({ error: 'forbidden' }, 403);

  await env.BUCKET.delete(keyOf(id));
  await deleteAllImages(env, id);
  return json({ ok: true });
}

async function castVote(request, env, id) {
  const { value: input, error } = await readBody(request);
  if (error) return error;
  const ballot = validateBallot(input);
  if (!ballot.ok) return json({ error: 'invalid' }, 400);

  const key = await voterKey(ballot.voterId, id, env.CODE_SECRET);
  if (await rateLimited(env, `vote:${key}`)) return json({ error: 'busy' }, 429);

  const out = await mutate(env, id, (poll) => {
    if (isHidden(poll)) return { error: json({ error: 'not_found' }, 404) };
    if (new Date(poll.closesAt).getTime() <= Date.now()) return { error: json({ error: 'closed' }, 409) };
    if (!poll.options.some((o) => o.id === ballot.optionId)) return { error: json({ error: 'invalid' }, 400) };

    const ballots = { ...(poll.ballots || {}) };
    const previous = ballots[key];
    if (previous === ballot.optionId) return { poll, result: poll, skipWrite: true }; // ei muutosta
    if (!previous && Object.keys(ballots).length >= MAX_BALLOTS) return { error: json({ error: 'full' }, 409) };

    ballots[key] = ballot.optionId;
    const options = poll.options.map((o) => {
      if (o.id === previous) return { ...o, votes: Math.max(0, o.votes - 1) };
      if (o.id === ballot.optionId) return { ...o, votes: o.votes + 1 };
      return o;
    });
    const updated = { ...poll, options, ballots };
    return { poll: updated, result: updated };
  });
  if (out.error) return out.error;
  return json(publicView(out.result, key));
}

async function reportVote(env, id) {
  if (await rateLimited(env, `report:${id}`)) return json({ error: 'busy' }, 429);
  const out = await mutate(env, id, (poll) => ({ poll: { ...poll, reports: (poll.reports || 0) + 1 }, result: {} }));
  return out.error || json({ ok: true });
}

async function serveImage(env, key) {
  const obj = await env.BUCKET.get(key);
  if (!obj) return json({ error: 'not_found' }, 404);
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable', // avaimessa aikaleima → sisältö ei vaihdu
      'x-content-type-options': 'nosniff',
    },
  });
}

// ── Ylläpito: oma salasana (ADMIN_SECRET), ei omistajan koodi ──
const requireAdmin = (request, env) => verifyAdmin(request.headers.get('x-admin-key') || '', env.ADMIN_SECRET || '');

async function adminList(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.BUCKET.list({ prefix: 'votes/', cursor });
    for (const obj of page.objects) {
      const body = await env.BUCKET.get(obj.key);
      if (!body) continue;
      const p = await body.json();
      const total = p.options.reduce((s, o) => s + o.votes, 0);
      out.push({ id: p.id, title: p.title, status: p.status, reports: p.reports || 0, total, closesAt: p.closesAt, createdAt: p.createdAt });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  out.sort((a, b) => b.reports - a.reports || (a.createdAt < b.createdAt ? 1 : -1));
  return json({ votes: out });
}

async function adminSetStatus(request, env, id) {
  const { value: input, error } = await readBody(request);
  if (error) return error;
  if (!input || (input.status !== 'visible' && input.status !== 'hidden')) return json({ error: 'invalid' }, 400);
  const out = await mutate(env, id, (poll) => ({ poll: { ...poll, status: input.status, updated: Date.now() }, result: {} }));
  return out.error || json({ ok: true });
}

async function adminDelete(env, id) {
  await env.BUCKET.delete(keyOf(id));
  await deleteAllImages(env, id);
  return json({ ok: true });
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Harakka — ylläpito</title>
<style>
  body { margin:0; background:#0b0d1f; color:#eef1ff; font-family:system-ui,sans-serif; }
  .wrap { max-width:900px; margin:0 auto; padding:24px 16px 60px; }
  h1 { font-size:20px; color:#e58fb8; }
  .row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
  input { font:inherit; padding:10px 12px; border-radius:8px; border:1px solid #444; background:#14172e; color:#fff; flex:1; }
  button { font:inherit; padding:10px 16px; border-radius:8px; border:1px solid #e58fb8; background:#e58fb8; color:#0b0d1f; cursor:pointer; min-height:44px; }
  button.ghost { background:none; color:#e58fb8; }
  button.danger { background:#e66; border-color:#e66; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:8px 6px; border-bottom:1px solid #2a2d48; vertical-align:top; }
  .reports { color:#e66; font-weight:bold; }
  .hidden-row { opacity:.5; }
  .msg { color:#e66; }
</style></head>
<body><div class="wrap">
  <h1>Harakka — ylläpito</h1>
  <div class="row">
    <input type="password" id="key" placeholder="Ylläpitosalasana" autocomplete="off">
    <button id="load">Näytä äänestykset</button>
  </div>
  <p class="msg" id="msg" role="status"></p>
  <table id="table" hidden>
    <thead><tr><th>Otsikko</th><th>Ääniä</th><th>Ilmoituksia</th><th>Tila</th><th></th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
</div>
<script>
  var keyEl = document.getElementById('key');
  keyEl.value = sessionStorage.getItem('harakka-admin-key') || '';
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'x-admin-key': keyEl.value }, opts.headers || {});
    return fetch(path, opts).then(function (r) { return r.json().then(function (b) { return { status: r.status, body: b }; }); });
  }
  function load() {
    sessionStorage.setItem('harakka-admin-key', keyEl.value);
    var msg = document.getElementById('msg');
    msg.textContent = 'Ladataan…';
    api('/api/admin/votes').then(function (res) {
      if (res.status !== 200) { msg.textContent = '⚠ Väärä salasana.'; document.getElementById('table').hidden = true; return; }
      msg.textContent = '';
      var rows = document.getElementById('rows');
      rows.replaceChildren();
      res.body.votes.forEach(function (p) {
        var tr = document.createElement('tr');
        if (p.status === 'hidden') tr.className = 'hidden-row';
        [p.title, p.total, p.reports, p.status].forEach(function (v, i) {
          var td = document.createElement('td');
          if (i === 2 && v > 0) td.className = 'reports';
          td.textContent = v;
          tr.appendChild(td);
        });
        var td = document.createElement('td');
        var toggle = document.createElement('button');
        toggle.className = 'ghost';
        toggle.textContent = p.status === 'hidden' ? 'Näytä' : 'Piilota';
        toggle.onclick = function () {
          api('/api/admin/votes/' + encodeURIComponent(p.id) + '/status', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: p.status === 'hidden' ? 'visible' : 'hidden' }) }).then(load);
        };
        var del = document.createElement('button');
        del.className = 'danger';
        del.textContent = 'Poista pysyvästi';
        del.style.marginLeft = '6px';
        del.onclick = function () {
          if (!confirm('Poistetaanko "' + p.title + '" pysyvästi? Ei voi perua.')) return;
          api('/api/admin/votes/' + encodeURIComponent(p.id), { method: 'DELETE' }).then(load);
        };
        td.appendChild(toggle);
        td.appendChild(del);
        tr.appendChild(td);
        rows.appendChild(tr);
      });
      document.getElementById('table').hidden = false;
    });
  }
  document.getElementById('load').addEventListener('click', load);
  if (keyEl.value) load();
</script>
</body></html>`;

// Sivu on GitHub Pagesissa (eri origin) → CORS. x-voter-otsikko laukaisee preflightin; max-age pitää sen harvinaisena.
function corsHeaders(request, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get('origin');
  const headers = {
    vary: 'origin',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, x-voter',
    'access-control-max-age': '86400',
  };
  if (origin && allowed.includes(origin)) headers['access-control-allow-origin'] = origin;
  return headers;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const res = await handle(request, env);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};

async function handle(request, env) {
    try {
      const url = new URL(request.url);
      const parts = url.pathname.split('/').filter(Boolean);
      const m = request.method;

      if (parts[0] === 'img') {
        if (m !== 'GET') return json({ error: 'method_not_allowed' }, 405);
        return await serveImage(env, parts.join('/'));
      }

      if (parts[0] === 'admin' && parts.length === 1) {
        if (m !== 'GET') return json({ error: 'method_not_allowed' }, 405);
        return new Response(ADMIN_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
      }

      if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'votes') {
        if (!requireAdmin(request, env)) return json({ error: 'unauthorized' }, 401);
        const id = parts[3] && decodeURIComponent(parts[3]);
        if (parts.length === 3 && m === 'GET') return await adminList(env);
        if (parts.length === 5 && parts[4] === 'status' && m === 'POST') return await adminSetStatus(request, env, id);
        if (parts.length === 4 && m === 'DELETE') return await adminDelete(env, id);
        return json({ error: 'method_not_allowed' }, 405);
      }

      if (parts[0] !== 'api' || parts[1] !== 'votes') {
        return json({ error: 'not_found' }, 404);
      }

      const id = parts[2] && decodeURIComponent(parts[2]);
      if (parts.length === 2) {
        if (m === 'GET') return await listVotes(request, env);
        if (m === 'POST') return await createVote(request, env);
      } else if (parts.length === 3) {
        if (m === 'GET') return await getVote(request, env, id);
        if (m === 'PATCH') return await patchVote(request, env, id);
        if (m === 'DELETE') return await deleteVote(request, env, id);
      } else if (parts.length === 4 && parts[3] === 'vote' && m === 'POST') {
        return await castVote(request, env, id);
      } else if (parts.length === 4 && parts[3] === 'report' && m === 'POST') {
        return await reportVote(env, id);
      }
      return json({ error: 'method_not_allowed' }, 405);
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error' }, 500);
    }
}
