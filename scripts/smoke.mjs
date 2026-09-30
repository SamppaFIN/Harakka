// Savutesti koko API-kierrolle käynnissä olevaa Workeria vasten.
//   npm run dev:api   (Windowsissa pitkä polku rikkoo R2-emulaation: lisää -- --persist-to C:/hk-state)
//   node scripts/smoke.mjs [http://127.0.0.1:8787]
const BASE = process.argv[2] || 'http://127.0.0.1:8787'
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
let failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`)
  if (!ok) failed++
}
const call = async (method, path, body, headers = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  return { status: res.status, body: json }
}
const future = new Date(Date.now() + 864e5).toISOString()
const voterA = 'a'.repeat(24)
const voterB = 'b'.repeat(24)

let r = await call('POST', '/api/votes', {
  title: 'Smoke ä ö — pitkä otsikko joka tekee pitkän tunnuksen ja testaa id:n säilymisen',
  description: '**lihava**',
  options: [{ text: 'Yksi', color: '#ff0000' }, { text: 'Kaksi' }],
  closesAt: future,
  media: { kind: 'image', dataUrl: PNG, alt: 'x' },
})
check('luonti 201 + koodi', r.status === 201 && /^[A-Z2-9]{5}$/.test(r.body.code), JSON.stringify(r.body))
const { id, code } = r.body

r = await call('GET', `/api/votes/${id}`)
check('haku: ei codeHash/ballots', r.status === 200 && !('codeHash' in r.body) && !('ballots' in r.body), JSON.stringify(r.body).slice(0, 200))
check('kuva tallennettu /img/-polkuun', r.body.media?.src?.startsWith(`/img/${id}/`), JSON.stringify(r.body.media))
const imgRes = await fetch(BASE + r.body.media.src)
check('kuva tarjoillaan image/png', imgRes.status === 200 && imgRes.headers.get('content-type') === 'image/png')
const [o1, o2] = r.body.options

r = await call('POST', `/api/votes/${id}/vote`, { voterId: voterA, optionId: o1.id })
check('ääni A→1', r.status === 200 && r.body.options[0].votes === 1 && r.body.myVote === o1.id, JSON.stringify(r.body))
r = await call('POST', `/api/votes/${id}/vote`, { voterId: voterA, optionId: o1.id })
check('sama ääni uudelleen ei kasvata', r.body.options[0].votes === 1)
r = await call('POST', `/api/votes/${id}/vote`, { voterId: voterA, optionId: o2.id })
check('vaihto 1→2 siirtää äänen', r.body.options[0].votes === 0 && r.body.options[1].votes === 1)
await call('POST', `/api/votes/${id}/vote`, { voterId: voterB, optionId: o2.id })
r = await call('GET', `/api/votes/${id}`, null, { 'x-voter': voterA })
check('myVote näkyy oikealle äänestäjälle', r.body.myVote === o2.id && r.body.options[1].votes === 2)
r = await call('GET', `/api/votes/${id}`)
check('myVote ei näy ilman tunnistetta', !r.body.myVote)

// Yhtäaikaiset äänet eivät saa hukata toisiaan (etag-uudelleenyritys)
const many = await Promise.all(
  Array.from({ length: 12 }, (_, i) =>
    call('POST', `/api/votes/${id}/vote`, { voterId: String(i).padStart(2, '0').repeat(10), optionId: o1.id }),
  ),
)
r = await call('GET', `/api/votes/${id}`)
check(
  '12 rinnakkaista ääntä → kaikki lasketaan',
  r.body.options[0].votes === 12 && r.body.options[1].votes === 2,
  `${many.map((m) => m.status)} ${JSON.stringify(r.body.options.map((o) => o.votes))}`,
)

r = await call('POST', `/api/votes/${id}/vote`, { voterId: voterA, optionId: 'olematon' })
check('tuntematon vaihtoehto 400', r.status === 400)

r = await call('PATCH', `/api/votes/${id}`, { code: 'WRONG', title: 'X', options: [{ text: 'a' }, { text: 'b' }], closesAt: future })
check('väärä koodi 403', r.status === 403)
r = await call('PATCH', `/api/votes/${id}`, { code, title: '', options: [{ text: 'a' }], closesAt: future })
check('virheellinen muokkaus 400 + kentät', r.status === 400 && r.body.fields.title && r.body.fields.options, JSON.stringify(r.body))

r = await call('PATCH', `/api/votes/${id}`, {
  code: code.toLowerCase(),
  title: 'Muokattu',
  description: 'uusi',
  options: [{ id: o1.id, text: 'Yksi (muok.)' }, { id: o2.id, text: 'Kaksi' }, { text: 'Kolme' }],
  closesAt: future,
  media: null,
})
check('muokkaus koodilla 200', r.status === 200, JSON.stringify(r.body))
r = await call('GET', `/api/votes/${id}`, null, { 'x-voter': voterA })
check(
  'äänet säilyvät id:llä, uusi vaihtoehto 0',
  r.body.options[0].votes === 12 && r.body.options[1].votes === 2 && r.body.options[2].votes === 0 && r.body.options[0].text === 'Yksi (muok.)',
  JSON.stringify(r.body.options),
)
check('kuva poistettu', !r.body.media)
check('kuvatiedosto poistettu R2:sta', (await fetch(BASE + imgRes.url.replace(BASE, ''))).status === 404)

await call('PATCH', `/api/votes/${id}`, {
  code,
  title: 'Muokattu',
  options: [{ id: o1.id, text: 'Yksi (muok.)' }, { text: 'Kolme' }],
  closesAt: future,
})
check('vaihtoehdon poisto poistaa sen äänet', (await call('GET', `/api/votes/${id}`, null, { 'x-voter': voterA })).body.myVote === undefined)

r = await call('POST', `/api/votes/${id}/report`)
check('ilmoita asiaton 200', r.status === 200)

r = await call('GET', '/api/votes')
check('lista sisältää äänestyksen', r.body.votes.some((v) => v.id === id) && r.body.votes.every((v) => !('codeHash' in v) && !('ballots' in v)))

r = await call('GET', '/api/admin/votes')
check('admin ilman avainta 401', r.status === 401)
const admin = { 'x-admin-key': process.env.ADMIN_SECRET || 'local-admin' }
r = await call('GET', '/api/admin/votes', null, admin)
check('admin lista', r.status === 200 && r.body.votes.find((v) => v.id === id)?.reports === 1, JSON.stringify(r.body).slice(0, 200))
await call('POST', `/api/admin/votes/${id}/status`, { status: 'hidden' }, admin)
check(
  'piilotettu → 404 + pois listasta',
  (await call('GET', `/api/votes/${id}`)).status === 404 && !(await call('GET', '/api/votes')).body.votes.some((v) => v.id === id),
)
await call('POST', `/api/admin/votes/${id}/status`, { status: 'visible' }, admin)

r = await call('POST', '/api/votes', { title: 'Mennyt', options: [{ text: 'a' }, { text: 'b' }], closesAt: '2020-01-01T00:00:00Z' })
check('menneen ajan luonti 400', r.status === 400 && r.body.fields.closesAt)
await call('PATCH', `/api/votes/${id}`, {
  code,
  title: 'Suljettu',
  options: [{ id: o1.id, text: 'Yksi' }, { text: 'Kolme' }],
  closesAt: '2020-01-01T00:00:00Z',
})
r = await call('POST', `/api/votes/${id}/vote`, { voterId: voterB, optionId: o1.id })
check('suljettuun ei voi äänestää (409)', r.status === 409)

r = await call('DELETE', `/api/votes/${id}`, { code: 'WRONG' })
check('poisto väärällä koodilla 403', r.status === 403)
r = await call('DELETE', `/api/votes/${id}`, { code })
check('poisto koodilla 200', r.status === 200)
check('poistettu → 404', (await call('GET', `/api/votes/${id}`)).status === 404)

console.log(failed ? `\n${failed} TARKISTUSTA EPÄONNISTUI` : '\nKaikki OK')
process.exit(failed ? 1 : 0)
