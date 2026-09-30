/** Äänestyksen tarkistus ja siivous. Palvelin validoi aina — selaimen tarkistus on vain käyttömukavuutta. */
import { detectImageType, MAX_IMAGE_BYTES } from './image.js';

export const LIMITS = { title: 120, description: 4000, option: 100, alt: 120 };
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

// Ohjausmerkit ja tekstin suuntaa kääntävät merkit.
const BAD_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const len = (s) => [...s].length;

const oneLine = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
// Kuvaus on monirivistä Markdownia: rivinvaihdot säilyvät, muu tyhjä siistitään.
const multiLine = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').trim() : '');

function validTime(s) {
  if (typeof s !== 'string') return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Purkaa data:-URL:n kuvaksi. Tyyppi tunnistetaan alkutavuista, ei ilmoitetusta MIME-tyypistä. */
export function decodeImageDataUrl(dataUrl) {
  const m = DATA_URL_RE.exec(typeof dataUrl === 'string' ? dataUrl : '');
  if (!m) return { error: 'Tiedosto ei ole tunnistettu kuva (JPEG, PNG tai WebP).' };
  let bytes;
  try {
    const bin = atob(m[2]);
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return { error: 'Kuvan tiedot ovat vialliset.' };
  }
  if (bytes.length > MAX_IMAGE_BYTES) return { error: 'Kuva on liian suuri.' };
  const detected = detectImageType(bytes);
  if (!detected) return { error: 'Tiedosto ei ole tunnistettu kuva (JPEG, PNG tai WebP).' };
  return { bytes, detected };
}

function validateOptions(raw, errors) {
  if (!Array.isArray(raw)) {
    errors.options = `Tarvitaan vähintään ${MIN_OPTIONS} vaihtoehtoa.`;
    return [];
  }
  const out = [];
  for (const o of raw) {
    const text = oneLine(o && o.text);
    if (!text) continue; // tyhjät rivit ohitetaan
    if (len(text) > LIMITS.option || BAD_CHARS.test(text)) {
      errors.options = `Vaihtoehto on liian pitkä (enintään ${LIMITS.option} merkkiä).`;
      return [];
    }
    const color = o.color && COLOR_RE.test(o.color) ? o.color.toLowerCase() : undefined;
    const id = typeof o.id === 'string' && /^[\w-]{1,80}$/.test(o.id) ? o.id : undefined;
    out.push({ id, text, color });
  }
  if (out.length < MIN_OPTIONS) errors.options = `Tarvitaan vähintään ${MIN_OPTIONS} vaihtoehtoa.`;
  else if (out.length > MAX_OPTIONS) errors.options = `Enintään ${MAX_OPTIONS} vaihtoehtoa.`;
  else if (new Set(out.map((o) => o.text.toLowerCase())).size !== out.length) errors.options = 'Vaihtoehdot eivät saa olla samoja.';
  return out;
}

/**
 * Yhteinen tarkistus luonnille ja muokkaukselle.
 * media: undefined = ei muutosta (vain PATCH), null = poista, olio = uusi kuva.
 */
function validateCommon(input, { now, requireFuture }) {
  const errors = {};
  const src = input || {};

  const title = oneLine(src.title);
  if (!title) errors.title = 'Otsikko on pakollinen.';
  else if (len(title) > LIMITS.title || BAD_CHARS.test(title)) errors.title = `Otsikko on liian pitkä (enintään ${LIMITS.title} merkkiä).`;

  const description = multiLine(src.description);
  if (len(description) > LIMITS.description || BAD_CHARS.test(description)) errors.description = `Kuvaus on liian pitkä (enintään ${LIMITS.description} merkkiä).`;

  const options = validateOptions(src.options, errors);

  const closes = validTime(src.closesAt);
  if (closes === null) errors.closesAt = 'Sulkeutumisaika on pakollinen.';
  else if (requireFuture && closes <= now) errors.closesAt = 'Sulkeutumisajan pitää olla tulevaisuudessa.';

  let media;
  if (src.media === null) media = null;
  else if (src.media !== undefined) {
    const decoded = decodeImageDataUrl(src.media && src.media.dataUrl);
    if (decoded.error) errors.media = decoded.error;
    else {
      const kind = src.media.kind === 'drawing' ? 'drawing' : 'image';
      const alt = oneLine(src.media.alt).slice(0, LIMITS.alt) || (kind === 'drawing' ? 'Piirros' : 'Kuva');
      media = { kind, alt, bytes: decoded.bytes, detected: decoded.detected };
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { title, description, options, closesAt: new Date(closes).toISOString(), media } };
}

export const validateCreate = (input, now = Date.now()) => validateCommon(input, { now, requireFuture: true });
export const validatePatch = (input, now = Date.now()) => validateCommon(input, { now, requireFuture: false });

export function validateBallot(input) {
  const voterId = input && input.voterId;
  const optionId = input && input.optionId;
  if (typeof voterId !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(voterId)) return { ok: false };
  if (typeof optionId !== 'string' || !optionId) return { ok: false };
  return { ok: true, voterId, optionId };
}
