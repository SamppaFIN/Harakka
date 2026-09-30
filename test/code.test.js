import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCode, hashCode, verifyCode, voterKey, slugify, verifyAdmin } from '../worker/src/code.js';

test('koodi: 5 merkkiä ilman sekoitettavia', () => {
  for (let i = 0; i < 50; i++) assert.match(generateCode(), /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/);
});

test('koodi: tiiviste vertautuu, isot/pienet kirjaimet samat, väärä hylätään', async () => {
  const h = await hashCode('ABCDE', 's');
  assert.ok(await verifyCode('abcde', h, 's'));
  assert.ok(!(await verifyCode('ABCDF', h, 's')));
  assert.ok(!(await verifyCode('ABCDE', h, 'toinen')));
  assert.ok(!(await verifyCode('', h, 's')));
});

test('äänestäjätiiviste: eri äänestyksissä eri, ei paljasta tunnistetta', async () => {
  const a = await voterKey('v'.repeat(20), 'p1', 's');
  const b = await voterKey('v'.repeat(20), 'p2', 's');
  assert.notEqual(a, b);
  assert.ok(!a.includes('vvvv'));
});

test('slugify ja admin', () => {
  assert.equal(slugify('Kuinka monta reikää?'), 'kuinka-monta-reikaa');
  assert.ok(verifyAdmin('x', 'x'));
  assert.ok(!verifyAdmin('x', ''));
});
