import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEgPhone } from '../src/lib/phone.ts';

test('egyptian phone normalization', () => {
  assert.equal(normalizeEgPhone('10 1234 5678'), '01012345678');
  assert.equal(normalizeEgPhone('01112345678'), '01112345678');
  assert.equal(normalizeEgPhone('+20 155 123 4567'), '01551234567');
  assert.equal(normalizeEgPhone('0131234567'), null);
  assert.equal(normalizeEgPhone('123'), null);
});
