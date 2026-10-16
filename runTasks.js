async function runTasks(tasks, options = {}) {
  const concurrency = options.concurrency == null ? Infinity : options.concurrency;

  const taskById = new Map();
  for (const task of tasks) {
    if (taskById.has(task.id)) {
      throw new Error(`duplicate task id: ${task.id}`);
    }
    taskById.set(task.id, task);
  }

  const dependentsById = new Map();
  const initialPendingDeps = new Map();

  for (const task of tasks) {
    initialPendingDeps.set(task.id, task.deps.length);

    for (const depId of task.deps) {
      if (!taskById.has(depId)) {
        throw new Error(`unknown dependency: ${depId}`);
      }

      if (!dependentsById.has(depId)) {
        dependentsById.set(depId, []);
      }
      dependentsById.get(depId).push(task.id);
    }
  }

  const queue = [];
  const pendingForCycleCheck = new Map(initialPendingDeps);

  for (const [taskId, pending] of pendingForCycleCheck) {
    if (pending === 0) {
      queue.push(taskId);
    }
  }

  let processed = 0;
  while (queue.length > 0) {
    const taskId = queue.shift();
    processed += 1;

    const dependents = dependentsById.get(taskId) || [];
    for (const dependentId of dependents) {
      const nextPending = pendingForCycleCheck.get(dependentId) - 1;
      pendingForCycleCheck.set(dependentId, nextPending);
      if (nextPending === 0) {
        queue.push(dependentId);
      }
    }
  }

  if (processed !== tasks.length) {
    throw new Error('cycle detected');
  }

  if (tasks.length === 0) {
    return {};
  }

  const results = {};
  const pendingDeps = new Map(initialPendingDeps);
  const readyQueue = [];

  for (const task of tasks) {
    if (pendingDeps.get(task.id) === 0) {
      readyQueue.push(task.id);
    }
  }

  return new Promise((resolve, reject) => {
    let running = 0;
    let completed = 0;
    let failed = false;

    const schedule = () => {
      if (failed) {
        return;
      }

      while (running < concurrency && readyQueue.length > 0) {
        const taskId = readyQueue.shift();
        const task = taskById.get(taskId);

        const depResults = {};
        for (const depId of task.deps) {
          depResults[depId] = results[depId];
        }

        running += 1;

        Promise.resolve()
          .then(() => task.run(depResults))
          .then((result) => {
            if (failed) {
              return;
            }

            results[taskId] = result;
            completed += 1;
            running -= 1;

            const dependents = dependentsById.get(taskId) || [];
            for (const dependentId of dependents) {
              const nextPending = pendingDeps.get(dependentId) - 1;
              pendingDeps.set(dependentId, nextPending);
              if (nextPending === 0) {
                readyQueue.push(dependentId);
              }
            }

            if (completed === tasks.length) {
              resolve(results);
              return;
            }

            schedule();
          })
          .catch((error) => {
            if (failed) {
              return;
            }
            failed = true;
            reject(error);
          });
      }
    };

    schedule();
  });
}

module.exports = runTasks;
