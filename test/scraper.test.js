const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parsePage } = require('../scripts/fetch-blood-stocks')
const { isFresh } = require('../scripts/check-freshness')
const types = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const card = (type, status = 'healthy') => `<div class="blood-level-card" blood-type="${type}" blood-level="${status}"></div>`
const page = (cards = types.map(t => card(t)).join(''), date = '13 Nov 2026') => `${cards}<p class="blood-stock-last-update-text">Last blood stock update: ${date}</p>`

test('valid cards normalize categories and preserve source date without inventing levels', () => {
  const result = parsePage(page(types.map(t => card(t, t === 'A-' ? 'moderate' : 'Healthy')).join('')))
  assert.equal(result.sourceUpdatedAt, '2026-11-13')
  assert.equal(result.stocks.length, 8)
  assert.deepEqual(result.stocks[1], { bloodType: 'A-', status: 'Moderate' })
})
test('reject missing, extra, duplicate, unknown and malformed records', () => {
  for (const cards of [types.slice(1).map(t => card(t)).join(''), types.map(t => card(t)).join('') + card('A+'), types.map((t, i) => card(i === 0 ? 'A-' : t)).join(''), types.map((t, i) => card(i === 0 ? 'X+' : t)).join(''), types.map((t, i) => card(t, i === 0 ? '' : 'healthy')).join(''), types.map((t, i) => card(t, i === 0 ? 'unknown' : 'healthy')).join('')]) assert.throws(() => parsePage(page(cards)))
})
test('reject missing and invalid source date', () => {
  assert.throws(() => parsePage(page(undefined, '31 Feb 2026')))
  assert.throws(() => parsePage(page().replace('blood-stock-last-update-text', 'missing')))
})
test('freshness requires a recent valid success marker, regardless of unchanged stocks', () => {
  const now = Date.parse('2026-11-15T12:00:00Z')
  assert.equal(isFresh({ fetchedAt: '2026-11-15T11:00:00Z', recordCount: 8 }, now), true)
  for (const marker of [null, {}, {fetchedAt: 'bad', recordCount: 8}, {fetchedAt: '2026-11-14T12:00:00Z', recordCount: 8}, {fetchedAt: '2026-11-15T13:00:00Z', recordCount: 8}, {fetchedAt: '2026-11-15T11:00:00Z', recordCount: 7}]) assert.equal(isFresh(marker, now), false)
})
