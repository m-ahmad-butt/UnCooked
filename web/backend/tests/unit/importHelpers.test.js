const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  keyOf,
  cellText,
  pick,
  makePassword,
  difficultyOf,
  statusOf,
  previewRow,
} = require('../../src/services/importHelpers');

describe('unit: import helpers', () => {
  it('keyOf strips non-alphanumeric', () => {
    assert.equal(keyOf('Course Code'), 'coursecode');
    assert.equal(keyOf(null), '');
  });

  it('cellText normalizes excel cell shapes', () => {
    assert.equal(cellText(null), '');
    assert.equal(cellText('  hi '), 'hi');
    assert.equal(cellText({ text: ' labeled ' }), 'labeled');
    assert.equal(cellText(new Date('2026-01-02T00:00:00.000Z')), '2026-01-02T00:00:00.000Z');
  });

  it('pick finds columns by alias', () => {
    const row = { 'Course Code': 'CS101', Title: 'Algo' };
    assert.equal(pick(row, ['coursecode', 'code']), 'CS101');
    assert.equal(pick(row, ['missing']), '');
  });

  it('makePassword returns Vu + 6 chars', () => {
    const password = makePassword();
    assert.match(password, /^Vu[A-Za-z0-9]{6}$/);
  });

  it('difficultyOf and statusOf normalize values', () => {
    assert.equal(difficultyOf('HARD'), 'hard');
    assert.equal(difficultyOf('nope'), 'medium');
    assert.equal(statusOf('disabled'), 'inactive');
    assert.equal(statusOf('enabled'), 'active');
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
    const badCredits = previewRow('courses', {
      coursecode: 'CS201',
      title: 'OOP',
      credithours: 'x',
    });
    assert.equal(badCredits.ok, false);
  });

  it('previewRow validates student rows', () => {
    const bad = previewRow('students', { name: 'Ali' });
    assert.equal(bad.ok, false);
    const good = previewRow('students', {
      name: 'Ali',
      email: 'ali@vu.edu',
      roll: 'BC123',
      password: 'secret1',
    });
    assert.equal(good.ok, true);
    assert.equal(good.password, 'secret1');
  });

  it('previewRow validates registration rows', () => {
    const bad = previewRow('registrations', { coursecode: 'CS101' });
    assert.equal(bad.ok, false);
    const good = previewRow('registrations', {
      email: 'ali@vu.edu',
      coursecode: 'CS101',
    });
    assert.equal(good.ok, true);
  });

  it('previewRow validates slot rows', () => {
    const bad = previewRow('slots', { coursecode: 'CS101', date: 'nope' });
    assert.equal(bad.ok, false);
    const good = previewRow('slots', {
      coursecode: 'CS101',
      date: '2026-06-01',
      starttime: '09:00',
      endtime: '11:00',
      capacity: '40',
    });
    assert.equal(good.ok, true);
    const badEnd = previewRow('slots', {
      coursecode: 'CS101',
      date: '2026-06-01',
      starttime: '11:00',
      endtime: '09:00',
      capacity: '40',
    });
    assert.equal(badEnd.ok, false);
  });
});
