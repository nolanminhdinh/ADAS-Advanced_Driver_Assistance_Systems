export const STORAGE_KEY = 'adas-academy:learning:v1';
export const STORAGE_VERSION = 1;

const createInitialState = () => ({
  completed: [],
  bookmarks: [],
  notes: {},
  lastLesson: null,
  goal: 30,
  studyByDate: {},
  quizAttempts: [],
  activity: [],
});

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = (value) => typeof value === 'string' && value.trim().length > 0;
const uniqueIds = (value) => Array.isArray(value) ? [...new Set(value.filter(isId))] : [];
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function localDateKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function sanitizeState(value) {
  const initial = createInitialState();
  if (!isObject(value)) return initial;

  return {
    completed: uniqueIds(value.completed),
    bookmarks: uniqueIds(value.bookmarks),
    notes: isObject(value.notes)
      ? Object.fromEntries(Object.entries(value.notes).filter(([id, note]) => isId(id) && typeof note === 'string'))
      : {},
    lastLesson: isId(value.lastLesson) ? value.lastLesson : null,
    goal: isPositiveNumber(value.goal) ? value.goal : initial.goal,
    studyByDate: isObject(value.studyByDate)
      ? Object.fromEntries(Object.entries(value.studyByDate).filter(([date, minutes]) => isDateKey(date) && isPositiveNumber(minutes)))
      : {},
    quizAttempts: Array.isArray(value.quizAttempts)
      ? value.quizAttempts.filter((attempt) => isObject(attempt) && isId(attempt.questionId) && typeof attempt.correct === 'boolean' && typeof attempt.answeredAt === 'string' && Number.isFinite(Date.parse(attempt.answeredAt)))
        .map(({ questionId, correct, answeredAt }) => ({ questionId, correct, answeredAt }))
      : [],
    activity: Array.isArray(value.activity) ? [...new Set(value.activity.filter(isDateKey))].sort() : [],
  };
}

function resolveDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** Browser-local learning progress. Storage failures never interrupt a study session. */
export function createStore(storage = resolveDefaultStorage()) {
  let state = createInitialState();
  let lastSerialized;
  const listeners = new Set();

  function refreshFromStorage() {
    try {
      const serialized = storage?.getItem(STORAGE_KEY);
      // An unchanged save must not replace newer in-memory work after a failed write.
      if (serialized === undefined || serialized === lastSerialized) return;
      lastSerialized = serialized;
      if (serialized === null) {
        state = createInitialState();
        return;
      }
      const saved = JSON.parse(serialized);
      if (saved?.version === STORAGE_VERSION) state = sanitizeState(saved.state);
    } catch {
      // Private browsing, unavailable storage, and corrupt saves keep this session usable.
    }
  }

  refreshFromStorage();

  const getState = () => ({
    ...state,
    completed: [...state.completed],
    bookmarks: [...state.bookmarks],
    notes: { ...state.notes },
    studyByDate: { ...state.studyByDate },
    quizAttempts: state.quizAttempts.map((attempt) => ({ ...attempt })),
    activity: [...state.activity],
  });

  function commit(nextState) {
    state = nextState;
    try {
      const serialized = JSON.stringify({ version: STORAGE_VERSION, state });
      storage?.setItem(STORAGE_KEY, serialized);
      lastSerialized = serialized;
    } catch {
      // Keep the current session usable when the browser cannot persist data.
    }
    for (const listener of [...listeners]) {
      try {
        listener(getState());
      } catch {
        // A view failing to render must not prevent other views from updating.
      }
    }
    return getState();
  }

  const withActivity = () => [...new Set([...state.activity, localDateKey()])].sort();

  return {
    getState,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setLastLesson(id) {
      if (id !== null && !isId(id)) return getState();
      refreshFromStorage();
      return commit({ ...state, lastLesson: id });
    },
    toggleComplete(id) {
      if (!isId(id)) return false;
      refreshFromStorage();
      const completed = !state.completed.includes(id);
      commit({
        ...state,
        completed: completed ? [...state.completed, id] : state.completed.filter((item) => item !== id),
        activity: completed ? withActivity() : state.activity,
      });
      return completed;
    },
    toggleBookmark(id) {
      if (!isId(id)) return false;
      refreshFromStorage();
      const bookmarked = !state.bookmarks.includes(id);
      commit({ ...state, bookmarks: bookmarked ? [...state.bookmarks, id] : state.bookmarks.filter((item) => item !== id) });
      return bookmarked;
    },
    saveNote(lessonId, text) {
      if (!isId(lessonId) || typeof text !== 'string') return getState();
      refreshFromStorage();
      return commit({ ...state, notes: { ...state.notes, [lessonId]: text } });
    },
    recordQuiz(attempt = {}) {
      if (!isObject(attempt) || !isId(attempt.questionId) || typeof attempt.correct !== 'boolean') return getState();
      refreshFromStorage();
      const entry = { questionId: attempt.questionId, correct: attempt.correct, answeredAt: new Date().toISOString() };
      return commit({ ...state, quizAttempts: [...state.quizAttempts, entry], activity: withActivity() });
    },
    setGoal(minutes) {
      if (!isPositiveNumber(minutes)) return getState();
      refreshFromStorage();
      return commit({ ...state, goal: minutes });
    },
    addStudyMinutes(minutes) {
      if (!isPositiveNumber(minutes)) return getState();
      refreshFromStorage();
      const date = localDateKey();
      const total = (state.studyByDate[date] || 0) + minutes;
      if (!Number.isFinite(total)) return getState();
      return commit({ ...state, studyByDate: { ...state.studyByDate, [date]: total }, activity: withActivity() });
    },
    resetProgress() {
      refreshFromStorage();
      return commit(createInitialState());
    },
  };
}
