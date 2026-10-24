import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY, STORAGE_VERSION } from '../src/store.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('learning progress persists with its schema version and reloads', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.setLastLesson('adas-intro');
  store.toggleComplete('adas-intro');
  store.toggleBookmark('perception');
  store.setGoal(45);
  store.addStudyMinutes(8);
  store.addStudyMinutes(12);

  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, STORAGE_VERSION);
  assert.deepEqual(createStore(storage).getState(), store.getState());
  assert.equal(store.getState().studyByDate[today()], 20);
  assert.deepEqual(store.getState().activity, [today()]);
});

test('completion and bookmark toggles remove the same lesson without duplicates', () => {
  const store = createStore(memoryStorage());
  assert.equal(store.toggleComplete('a'), true);
  assert.equal(store.toggleComplete('b'), true);
  assert.equal(store.toggleComplete('a'), false);
  assert.deepEqual(store.getState().completed, ['b']);
  assert.deepEqual(store.getState().activity, [today()]);
  assert.equal(store.toggleBookmark('a'), true);
  assert.equal(store.toggleBookmark('a'), false);
  assert.deepEqual(store.getState().bookmarks, []);
});

test('malformed JSON, unknown versions, and invalid persisted fields recover safely', () => {
  const initial = createStore(memoryStorage()).getState();
  assert.deepEqual(createStore(memoryStorage({ [STORAGE_KEY]: '{broken' })).getState(), initial);
  assert.deepEqual(createStore(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 99, state: { goal: 90 } }) })).getState(), initial);

  const saved = {
    version: STORAGE_VERSION,
    state: {
      completed: ['a', 'a', null, 4],
      bookmarks: 'a',
      goal: -5,
      notes: { a: 'Keep this note', b: 4 },
      studyByDate: { '2026-10-24': 12, '2026-02-30': 8, yesterday: 5 },
      activity: ['2026-10-24', '2026-10-24', '2026-02-30'],
      quizAttempts: [{ questionId: 'q', correct: true, answeredAt: 'invalid' }],
    },
  };
  const state = createStore(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })).getState();
  assert.deepEqual(state.completed, ['a']);
  assert.deepEqual(state.bookmarks, []);
  assert.equal(state.goal, 30);
  assert.deepEqual(state.notes, { a: 'Keep this note' });
  assert.deepEqual(state.studyByDate, { '2026-10-24': 12 });
  assert.deepEqual(state.activity, ['2026-10-24']);
  assert.deepEqual(state.quizAttempts, []);
});

test('unavailable or full storage keeps progress and subscriptions working in memory', () => {
  for (const storage of [null, {
    getItem() { throw new Error('Storage access denied'); },
    setItem() { throw new Error('Quota exceeded'); },
  }]) {
    const store = createStore(storage);
    let updates = 0;
    const unsubscribe = store.subscribe((state) => {
      updates += 1;
      assert.deepEqual(state.completed, ['a']);
    });
    assert.doesNotThrow(() => store.toggleComplete('a'));
    assert.deepEqual(store.getState().completed, ['a']);
    assert.equal(updates, 1);
    unsubscribe();
    store.toggleBookmark('b');
    assert.equal(updates, 1);
  }
});

test('notes preserve user text across reloads and snapshots cannot mutate internal state', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  const text = 'Camera + radar\nCần kiểm tra lại sensor fusion.';
  store.saveNote('fusion', text);
  store.saveNote('__proto__', 'Safe object key');
  store.recordQuiz({ questionId: 'q1', correct: true });
  const snapshot = store.getState();
  snapshot.notes.fusion = 'Changed externally';
  snapshot.completed.push('fake');
  snapshot.quizAttempts[0].correct = false;
  assert.equal(store.getState().notes.fusion, text);
  assert.deepEqual(store.getState().completed, []);
  assert.equal(store.getState().quizAttempts[0].correct, true);
  assert.equal(createStore(storage).getState().notes.fusion, text);
  assert.equal(createStore(storage).getState().notes.__proto__, 'Safe object key');
});

test('quiz attempts retain each answer and register a unique local activity date', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.recordQuiz({ questionId: 'q1', correct: false });
  store.recordQuiz({ questionId: 'q1', correct: true });
  const state = createStore(storage).getState();
  assert.deepEqual(state.quizAttempts.map(({ questionId, correct }) => ({ questionId, correct })), [
    { questionId: 'q1', correct: false },
    { questionId: 'q1', correct: true },
  ]);
  assert.ok(state.quizAttempts.every(({ answeredAt }) => Number.isFinite(Date.parse(answeredAt))));
  assert.deepEqual(state.activity, [today()]);
});

test('invalid inputs leave progress intact and reset is persisted', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.setGoal(40);
  store.addStudyMinutes(10);
  const before = store.getState();
  store.setGoal(0);
  store.setGoal(Infinity);
  store.addStudyMinutes(-10);
  store.recordQuiz({ questionId: 'q1', correct: 'true' });
  store.saveNote('', 'orphan');
  assert.equal(store.toggleComplete(''), false);
  assert.deepEqual(store.getState(), before);

  store.resetProgress();
  assert.deepEqual(createStore(storage).getState(), createStore(memoryStorage()).getState());
});

test('subscribers receive isolated snapshots and one failing view does not block another', () => {
  const store = createStore(memoryStorage());
  store.subscribe((state) => { state.bookmarks.push('injected'); });
  store.subscribe(() => { throw new Error('A view failed'); });
  let received;
  store.subscribe((state) => { received = state; });
  store.toggleBookmark('a');
  assert.deepEqual(received.bookmarks, ['a']);
  assert.deepEqual(store.getState().bookmarks, ['a']);
});

test('stale stores preserve notes, completion, and bookmarks written by another tab', () => {
  const storage = memoryStorage();
  const firstTab = createStore(storage);
  const secondTab = createStore(storage);

  firstTab.saveNote('camera', 'Camera notes');
  secondTab.toggleBookmark('radar');
  firstTab.toggleComplete('fusion');
  secondTab.saveNote('radar', 'Radar notes');
  firstTab.saveNote('camera', 'Camera notes, updated');

  const saved = createStore(storage).getState();
  assert.deepEqual(saved.notes, { camera: 'Camera notes, updated', radar: 'Radar notes' });
  assert.deepEqual(saved.completed, ['fusion']);
  assert.deepEqual(saved.bookmarks, ['radar']);

  // Toggle decisions also use the latest save rather than the stale tab snapshot.
  assert.equal(secondTab.toggleComplete('fusion'), false);
  assert.equal(firstTab.toggleBookmark('radar'), false);
  assert.deepEqual(createStore(storage).getState().completed, []);
  assert.deepEqual(createStore(storage).getState().bookmarks, []);
  assert.deepEqual(createStore(storage).getState().notes, saved.notes);
});

test('every mutation uses the latest save, including accumulated study minutes and quizzes', () => {
  const storage = memoryStorage();
  const firstTab = createStore(storage);
  const secondTab = createStore(storage);
  firstTab.saveNote('fusion', 'Do not lose this note');
  secondTab.setGoal(60);
  firstTab.setLastLesson('radar');
  secondTab.recordQuiz({ questionId: 'q1', correct: false });
  firstTab.recordQuiz({ questionId: 'q2', correct: true });
  secondTab.addStudyMinutes(10);
  firstTab.addStudyMinutes(5);

  const saved = createStore(storage).getState();
  assert.equal(saved.notes.fusion, 'Do not lose this note');
  assert.equal(saved.goal, 60);
  assert.equal(saved.lastLesson, 'radar');
  assert.deepEqual(saved.quizAttempts.map((attempt) => attempt.questionId), ['q1', 'q2']);
  assert.equal(saved.studyByDate[today()], 15);

  secondTab.resetProgress();
  firstTab.toggleBookmark('new-start');
  assert.deepEqual(createStore(storage).getState(), {
    ...createStore(memoryStorage()).getState(),
    bookmarks: ['new-start'],
  });
});

test('a readable but full storage does not erase newer in-memory changes on the next mutation', () => {
  const serialized = JSON.stringify({ version: STORAGE_VERSION, state: { goal: 45 } });
  const storage = {
    getItem: () => serialized,
    setItem() { throw new Error('Quota exceeded'); },
  };
  const store = createStore(storage);
  store.saveNote('fusion', 'Retain this session');
  store.toggleBookmark('camera');
  store.toggleComplete('radar');
  assert.equal(store.getState().notes.fusion, 'Retain this session');
  assert.deepEqual(store.getState().bookmarks, ['camera']);
  assert.deepEqual(store.getState().completed, ['radar']);
  assert.equal(store.getState().goal, 45);
});
