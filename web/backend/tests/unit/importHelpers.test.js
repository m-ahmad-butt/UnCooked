const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  keyOf,
  cellText,
  pick,
  difficultyOf,
  statusOf,
  previewRow,
} = require('../../src/services/import.service');

describe('unit: import helpers', () => {
  it('keyOf strips non-alphanumeric', () => {
    assert.equal(keyOf('Course Code'), 'coursecode');
    assert.equal(keyOf(null), '');
  });

  it('cellText normalizes excel cell shapes', () => {
    assert.equal(cellText(null), '');
    assert.equal(cellText('  hi '), 'hi');
    assert.equal(cellText({ text: ' labeled ' }), 'labeled');
  });

  it('pick finds columns by alias', () => {
    const row = { 'Course Code': 'CS101', Title: 'Algo' };
    assert.equal(pick(row, ['coursecode', 'code']), 'CS101');
    assert.equal(pick(row, ['missing']), '');
  });

  it('difficultyOf and statusOf normalize values', () => {
    assert.equal(difficultyOf('HARD'), 'hard');
    assert.equal(difficultyOf('nope'), 'medium');
    assert.equal(statusOf('disabled'), 'inactive');
    assert.equal(statusOf(''), 'active');
  });

  it('previewRow validates branch rows', () => {
    const bad = previewRow('branches', {});
    assert.equal(bad.ok, false);
    const good = previewRow('branches', { name: 'Lahore', code: 'LHR' });
    assert.equal(good.ok, true);
    assert.equal(good.code, 'LHR');
  });

  it('previewRow validates course rows', () => {
    const good = previewRow('courses', {
      coursecode: 'CS201',
      title: 'OOP',
      credithours: '3',
    });
    assert.equal(good.ok, true);
    assert.equal(good.courseCode, 'CS201');
  });
});
