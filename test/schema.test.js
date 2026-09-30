import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCreate, validatePatch, validateBallot, decodeImageDataUrl } from '../worker/src/schema.js';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const future = '2026-10-30T12:00:00Z';
const base = () => ({ title: ' Teseus ', description: 'rivi 1\r\nrivi 2', options: [{ text: 'Kyllä' }, { text: 'Ei', color: '#AABBCC' }], closesAt: future });

// 1x1 PNG
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('luonti: siivoaa ja hyväksyy kelvollisen', () => {
  const r = validateCreate(base(), NOW);
  assert.ok(r.ok);
  assert.equal(r.value.title, 'Teseus');
  assert.equal(r.value.description, 'rivi 1\nrivi 2');
  assert.equal(r.value.options[1].color, '#aabbcc');
});

test('luonti: hylkää tyhjän otsikon, yhden vaihtoehdon ja menneen ajan', () => {
  const r = validateCreate({ ...base(), title: ' ', options: [{ text: 'vain' }, { text: '  ' }], closesAt: '2026-01-01T00:00:00Z' }, NOW);
  assert.ok(!r.ok);
  assert.ok(r.errors.title && r.errors.options && r.errors.closesAt);
});

test('vaihtoehdot: duplikaatit ja liikaa hylätään', () => {
  assert.ok(validateCreate({ ...base(), options: [{ text: 'A' }, { text: 'a' }] }, NOW).errors.options);
  const seven = Array.from({ length: 7 }, (_, i) => ({ text: `v${i}` }));
  assert.ok(validateCreate({ ...base(), options: seven }, NOW).errors.options);
});

test('vaihtoehdot: virheellinen väri pudotetaan, ohjausmerkit hylätään', () => {
  const r = validateCreate({ ...base(), options: [{ text: 'A', color: 'red' }, { text: 'B' }] }, NOW);
  assert.equal(r.value.options[0].color, undefined);
  assert.ok(validateCreate({ ...base(), title: 'a‮b' }, NOW).errors.title);
});

test('muokkaus: mennyt sulkeutumisaika sallitaan, media undefined/null erotetaan', () => {
  const past = validatePatch({ ...base(), closesAt: '2020-01-01T00:00:00Z' }, NOW);
  assert.ok(past.ok);
  assert.equal(past.value.media, undefined);
  assert.equal(validatePatch({ ...base(), media: null }, NOW).value.media, null);
});

test('kuva: tyyppi tunnistetaan alkutavuista, ei ilmoitetusta MIME:stä', () => {
  assert.ok(decodeImageDataUrl(PNG).detected.ext === 'png');
  const fake = 'data:image/jpeg;base64,' + btoa('<html><script>alert(1)</script></html>');
  assert.ok(decodeImageDataUrl(fake).error);
  assert.ok(decodeImageDataUrl('data:text/html;base64,AAAA').error);
  const r = validateCreate({ ...base(), media: { kind: 'drawing', dataUrl: PNG, alt: '' } }, NOW);
  assert.ok(r.ok);
  assert.equal(r.value.media.alt, 'Piirros');
});

test('ääni: tunniste ja vaihtoehto vaaditaan', () => {
  assert.ok(validateBallot({ voterId: 'a'.repeat(20), optionId: 'x' }).ok);
  assert.ok(!validateBallot({ voterId: 'lyhyt', optionId: 'x' }).ok);
  assert.ok(!validateBallot({ voterId: 'a'.repeat(20) }).ok);
});

test('vaihtoehdon id säilyy, myös pitkänä (vanhat id:t sisältävät otsikon slugin)', () => {
  const id = 'kumpi-on-parempi-kissa-vai-koira-8dyk-abc123';
  const r = validatePatch({ ...base(), options: [{ id, text: 'A' }, { text: 'B' }] }, NOW);
  assert.equal(r.value.options[0].id, id);
});
