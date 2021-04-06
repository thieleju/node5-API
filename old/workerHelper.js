var moment = require("moment")
var axios = require("axios")

const { Worker } = require("worker_threads")

// get secret information from .env
const { config } = require("dotenv")
config({ path: __dirname + "/.env" })

var allWorkers = []
var workerIDLength = 12

module.exports = {
  /**
   * This function gets only called from the server
   * @param {String} username jwt.verify decoded Token username
   * @return {Promise} returns promise, which resolves/rejects JSON
   */
  checkWorker(username) {
    return new Promise((resolve, reject) => {
      // get workerdata
      let workerData = module.exports.getWorkerDataFromUsername(username)

      if (!workerData)
        throw new Error({
          status: "error",
          message: "Could not get worker Data"
        })

      // check if worker is running => 1 worker per user
      let running = module.exports.checkIfWorkerIsAlreadyRunning(
        username,
        workerData.workerID
      )
      if (running) {
        // worker online
        resolve({
          status: "success",
          message: "Worker is " + workerData.status,
          workerData
        })
      } else {
        // worker offline

        // initialize worker
        module.exports.startWorker(username, workerData)

        // resolve starting message
        resolve({
          status: "success",
          message: "Worker is starting ...",
          workerData
        })
      }
    })
  },
  startWorker(username, workerData) {
    var serverHelper = require("./serverHelper") // why do I need this?
    var server = require("./server")

    // create worker object
    const worker = new Worker("./src/api/coinbaseWorker.js", { workerData })

    // worker listeners
    worker.on("message", data => {
      // worker gives feedback

      switch (data.type) {
        case "startup":
          // change status to online and save
          workerData.status = "online"
          serverHelper.saveConfig(data.username, "workerData", workerData)
          serverHelper.addLogEntry(username, "Started worker " + data.workerID)
          break
        case "shutdown":
          // shuts down worker
          workerData.status = "offline"
          serverHelper.saveConfig(data.username, "workerData", workerData)
          serverHelper.addLogEntry(
            data.username,
            "Stopped worker " + data.workerID
          )
          // receive answer of shutdown and emit event
          server
            .getEventEmitter()
            .emit(data.username + ":" + data.command + ":" + data.id, data.data)
          break
        case "message":
          serverHelper.addLogEntry(
            data.username,
            data.command + " | " + data.message
          )
          // receive answer to request and emit event
          server
            .getEventEmitter()
            .emit(data.username + ":" + data.command + ":" + data.id, data)
      }
    })

    worker.on("error", error => {
      // worker threw an error
      console.log(error)
    })

    worker.on("exit", exitCode => {
      // worker exited
      console.log("Worker exited with code " + exitCode)
    })

    // add workerdata to allWorkers array to keep track of everything
    workerData.worker = worker
    allWorkers.push(workerData)
  },
  getWorkerIDLength() {
    return this.workerIDLength
  },
  checkIfWorkerIsAlreadyRunning(username, workerID) {
    let matchingWorkerFound = false
    if (allWorkers.length >= 1) {
      allWorkers.forEach(el => {
        if (el.username == username && workerID == el.workerID) {
          matchingWorkerFound = true
        }
      })
    }
    return matchingWorkerFound
  },
  getWorkerDataFromUsername(username) {
    var serverHelper = require("./serverHelper") // why do I need this?

    // get worker data
    let workerData = serverHelper.getUserConfig("workerData", username)

    if (!workerData) return null

    // add username to workerData and return
    workerData.username = username
    return workerData
  },
  getWorkerObjectFromAllWorkersArray(username, workerID) {
    let matching = null
    if (allWorkers.length >= 1) {
      allWorkers.forEach(el => {
        if (el.username == username && workerID == el.workerID) {
          matching = el.worker
        }
      })
    }
    return matching
  },
  sendMessageToWorker(data) {
    // get worker ID
    let workerID = module.exports.getWorkerDataFromUsername(data.username)
      .workerID

    if (!workerID)
      throw new Error({
        status: "error",
        message: "Could not find workerID"
      })

    // get worker object
    let worker = module.exports.getWorkerObjectFromAllWorkersArray(
      data.username,
      workerID
    )
    if (worker) {
      // send message
      worker.postMessage(data)
    }
  }
}
