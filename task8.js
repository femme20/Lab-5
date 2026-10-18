import { analyzeResults, results } from './task2.js';
export class HTTPError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HTTPError';
    this.status = status;
  }
}
export class TimeoutError extends Error {
  constructor(milliseconds) {
    super(`Request timed out after ${milliseconds} ms`);
    this.name = 'TimeoutError';
  }
}
const apiData = {
  '/users': results.map(({ id, name, department }) => ({ id, name, department })),
  '/courses': [{ code: 'FSWD' }], '/results': results
};
// Supported URLs: /users, /courses, /results, /404, /500, /network,
// /invalid-json and /slow. No live server or network is needed.
export async function fakeFetch(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (url === '/network') { reject(new TypeError('Simulated network failure')); return; }
      const status = url === '/500' ? 500 :
        (Object.hasOwn(apiData, url) || url === '/slow' || url === '/invalid-json' ? 200 : 404);
      resolve({ ok: status >= 200 && status < 300, status,
        async json() {
          if (signal?.aborted) throw signal.reason;
          if (url === '/invalid-json') throw new SyntaxError('Invalid JSON response');
          return structuredClone(url === '/slow' ? { message: 'Slow response' } : apiData[url] ?? null);
        }
      });
    }, url === '/slow' ? 80 : 5);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
export async function getJSON(url, fetchImplementation) {
  if (typeof fetchImplementation !== 'function') throw new TypeError('Fetch implementation required');
  const response = await fetchImplementation(url);
  if (!response.ok) throw new HTTPError(response.status, url);
  return await response.json(); // Network and parse errors propagate unchanged.
}
export async function fetchWithTimeout(url, milliseconds, fetchImplementation = fakeFetch) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new RangeError('Timeout must be nonnegative');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new TimeoutError(milliseconds)), milliseconds);
  try {
    const response = await fetchImplementation(url, { signal: controller.signal });
    if (!response.ok) throw new HTTPError(response.status, url);
    return await response.json();
  } finally {
    clearTimeout(timer); // Runs on success, HTTP/network/parse failure and timeout.
  }
}
export function classifyError(error) {
  if (error instanceof TimeoutError) return 'TIMEOUT';
  if (error.name === 'AbortError') return 'ABORT';
  if (error instanceof HTTPError) return 'HTTP';
  if (error instanceof SyntaxError) return 'INVALID JSON';
  if (error instanceof TypeError) return 'NETWORK OR TYPE ERROR';
  return 'UNKNOWN';
}
export async function loadDashboard(fetchImplementation = fakeFetch) {
  // Calls start before Promise.all waits. All three datasets are required.
  const [users, courses, rows] = await Promise.all([
    getJSON('/users', fetchImplementation), getJSON('/courses', fetchImplementation),
    getJSON('/results', fetchImplementation)
  ]);
  if (![users, courses, rows].every(Array.isArray)) throw new TypeError('API datasets must be arrays');
  const ids = new Set();
  users.forEach(user => {
    if (!user || !Number.isInteger(user.id) || ids.has(user.id) ||
        typeof user.name !== 'string' || typeof user.department !== 'string') throw new TypeError('Invalid user');
    ids.add(user.id);
  });
  const codes = new Set();
  courses.forEach(course => {
    if (!course || typeof course.code !== 'string' || !course.code.trim() || codes.has(course.code)) {
      throw new TypeError('Invalid course');
    }
    codes.add(course.code);
  });
  const seenResults = new Set();
  const joined = rows.map(row => {
    if (!row || !ids.has(row.id) || !codes.has(row.course)) throw new Error('Result has unknown user or course');
    const key = JSON.stringify([row.id, row.course]);
    if (seenResults.has(key)) throw new Error('Duplicate student/course result');
    seenResults.add(key);
    const user = users.find(item => item.id === row.id);
    return { ...row, name: user.name, department: user.department };
  });
  const analytics = analyzeResults(joined);
  if (analytics.rejected.length) throw new TypeError('Invalid result data');
  // For multiple courses, rank students by their own average, not a single result.
  const studentAverages = users.map(user => {
    const marks = joined.filter(row => row.id === user.id).map(row => row.marks);
    return { ...user, average: marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : null };
  }).filter(user => user.average !== null)
    .sort((a, b) => b.average - a.average || a.name.localeCompare(b.name));
  return { totalStudents: users.length, totalCourses: courses.length, overallAverageMarks: analytics.average,
    highestPerformingStudent: studentAverages[0] ?? null,
    failedStudents: new Set(joined.filter(row => row.marks < 50).map(row => row.id)).size,
    // Department student counts are unique; average is across recorded course results.
    departments: Object.fromEntries(Object.entries(analytics.departments).map(([dept, stats]) => {
      const deptRows = joined.filter(row => row.department === dept);
      const deptIds = new Set(deptRows.map(row => row.id));
      const failedIds = new Set(deptRows.filter(row => row.marks < 50).map(row => row.id));
      return [dept, { students: deptIds.size, average: stats.average, highest: stats.highest,
        passed: deptIds.size - failedIds.size }];
    })) };
}
