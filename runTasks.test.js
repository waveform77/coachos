const test = require('node:test');
const assert = require('node:assert/strict');

const runTasks = require('./runTasks');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('returns empty object for empty task list', async () => {
  const result = await runTasks([]);
  assert.deepEqual(result, {});
});

test('runs DAG and passes only direct dependency results', async () => {
  const seenDeps = {};

  const tasks = [
    {
      id: 'a',
      deps: [],
      run: async (deps) => {
        seenDeps.a = deps;
        return 'A';
      },
    },
    {
      id: 'b',
      deps: ['a'],
      run: async (deps) => {
        seenDeps.b = deps;
        return deps.a + 'B';
      },
    },
    {
      id: 'c',
      deps: ['a'],
      run: async (deps) => {
        seenDeps.c = deps;
        return deps.a + 'C';
      },
    },
    {
      id: 'd',
      deps: ['b', 'c'],
      run: async (deps) => {
        seenDeps.d = deps;
        return `${deps.b}-${deps.c}`;
      },
    },
  ];

  const snapshot = tasks.map((task) => ({
    id: task.id,
    deps: [...task.deps],
    run: task.run,
  }));

  const result = await runTasks(tasks);

  assert.deepEqual(result, {
    a: 'A',
    b: 'AB',
    c: 'AC',
    d: 'AB-AC',
  });

  assert.deepEqual(seenDeps, {
    a: {},
    b: { a: 'A' },
    c: { a: 'A' },
    d: { b: 'AB', c: 'AC' },
  });

  assert.deepEqual(
    tasks.map((task) => ({ id: task.id, deps: [...task.deps], run: task.run })),
    snapshot
  );
});

test('throws validation errors for duplicate id, unknown dependency, and cycle', async () => {
  await assert.rejects(
    () =>
      runTasks([
        { id: 'x', deps: [], run: async () => 1 },
        { id: 'x', deps: [], run: async () => 2 },
      ]),
    new Error('duplicate task id: x')
  );

  await assert.rejects(
    () => runTasks([{ id: 'x', deps: ['y'], run: async () => 1 }]),
    new Error('unknown dependency: y')
  );

  await assert.rejects(
    () =>
      runTasks([
        { id: 'a', deps: ['b'], run: async () => 1 },
        { id: 'b', deps: ['a'], run: async () => 2 },
      ]),
    new Error('cycle detected')
  );
});

test('rejects with same error and does not run dependent tasks of failed task', async () => {
  const boom = new Error('boom');
  let dependentStarted = false;

  const tasks = [
    {
      id: 'a',
      deps: [],
      run: async () => {
        await sleep(5);
        throw boom;
      },
    },
    {
      id: 'b',
      deps: ['a'],
      run: async () => {
        dependentStarted = true;
        return 'never';
      },
    },
    {
      id: 'c',
      deps: [],
      run: async () => {
        await sleep(10);
        return 'ok';
      },
    },
  ];

  await assert.rejects(runTasks(tasks), (error) => error === boom);
  assert.equal(dependentStarted, false);
});

test('respects concurrency=1', async () => {
  let active = 0;
  let maxActive = 0;

  const tasks = ['a', 'b', 'c'].map((id) => ({
    id,
    deps: [],
    run: async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(10);
      active -= 1;
      return id;
    },
  }));

  await runTasks(tasks, { concurrency: 1 });
  assert.equal(maxActive, 1);
});

test('respects bounded parallelism', async () => {
  let active = 0;
  let maxActive = 0;

  const tasks = Array.from({ length: 6 }, (_, index) => ({
    id: `t${index + 1}`,
    deps: [],
    run: async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(15);
      active -= 1;
      return index;
    },
  }));

  const result = await runTasks(tasks, { concurrency: 2 });

  assert.equal(Object.keys(result).length, 6);
  assert.ok(maxActive <= 2);
});
