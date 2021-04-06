class WorkerPool {
  #poolName = ""
  #workers = []

  constructor(name) {
    this.#poolName = name
  }

  checkWorker(username) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if worker is running
        // get worker pool
        var wp = require("./mainWorkerPool")
        let worker = wp.getWorkerByUsername(username)
        if (worker) {
          // worker exists
          resolve({ status: "running" })
        } else {
          await this.startWorker(username)
          // start worker
          resolve({ status: "started" })
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  startWorker(username) {
    return new Promise(async (resolve, reject) => {
      try {
        // create new worker instance
        const Worker = require("./worker")
        let newWorker = new Worker(username)
        // initialize instance
        await newWorker.initCoinbaseAccount()
        // add to pool
        this.addWorkerToPool(username, newWorker)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  addWorkerToPool(username, newWorker) {
    this.#workers.push({
      worker: newWorker,
      username
    })
  }

  getName() {
    return this.#poolName
  }

  getWorkerByUsername(username) {
    let found = null
    this.#workers.forEach(w => {
      if (w.username === username) {
        found = w.worker
      }
    })
    return found
  }

  getWorkers() {
    return this.#workers
  }
}

module.exports = WorkerPool
