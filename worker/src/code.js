/**
 * Muokkauskoodi: 5 merkkiä ilman sekoitettavia kirjaimia (ei 0/O, 1/I/L).
 * Koodi ei koskaan kulje R2:een sellaisenaan — vain HMAC-SHA256-tiiviste tallennetaan.
 * Sama malli kuin BandRockissa, mutta ilman yleisavaimia.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

async function hmac(text, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashCode(code, secret) {
  return hmac(code.toUpperCase(), secret);
}

export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyCode(code, storedHash, secret) {
  if (typeof code !== 'string' || !code || typeof storedHash !== 'string') return false;
  const hash = await hashCode(code, secret);
  return timingSafeEqual(hash, storedHash);
}

/** Äänestäjän nimetön tunniste → tiiviste, joka tallennetaan äänestyskohtaisesti (ei yhdistettävissä äänestysten välillä). */
export async function voterKey(voterId, pollId, secret) {
  return (await hmac(`voter:${pollId}:${voterId}`, secret)).slice(0, 24);
}

/** Ylläpitosalasanan vertailu (env.ADMIN_SECRET). */
export function verifyAdmin(given, secret) {
  if (typeof given !== 'string' || !given || typeof secret !== 'string' || !secret) return false;
  return timingSafeEqual(given, secret);
}

/** Otsikosta johdettu, luettava, URL-turvallinen tunnus. */
export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'aanestys';
}

/**
 * Yleisavain muokkaukseen (esim. 00000), asetetaan vars-muuttujalla MASTER_EDIT_CODE; tyhjä/puuttuva = pois käytöstä.
 * Tarkoituksella tunnettu koodi, ei salaisuus: kuka tahansa voi muokata mitä tahansa äänestystä. Ei poista.
 */
export function isMasterEditCode(given, master) {
  if (typeof given !== 'string' || typeof master !== 'string' || !master) return false;
  return timingSafeEqual(given.trim(), master);
}
