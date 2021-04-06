const axios = require("axios")
const { workerData, parentPort } = require("worker_threads")

const { CandleGranularity } = require("coinbase-pro-node")

const serverHelper = require("./serverHelper")
const workerHelper = require("./workerHelper")
const coinbaseHelper = require("./coinbaseHelper")

var counter = 0
var interval = workerData.timeBetweenChecksInS * 1000
var allAccountsArray = []

// initialize
const client = coinbaseHelper.initClient(workerData.username, true)
if (!client) {
  console.log(workerData)
  stopMe("Error could not initialize worker!")
} else {
  // worker started correctly
  sendResponse(200, "startup", "Worker started", "", "")
}

// set interval with updateWorker() callback
const intervalID = setInterval(() => {
  // increase Counter
  counter++
  // update worker
  updateWorker()
}, interval)

// receive message from parent
parentPort.on("message", data => {
  switch (data.cmd) {
    case "exit":
      stopMe("Exit stopping server")
      break
    case "getAccountList":
      getAccountList(data)
      break
    case "getMarketPrice":
      getMarketPrice(data)
      break
    case "getCandles":
      getCandles(data)
      break
  }
})

/**
 *  Makes attempts to trade
 *  This function gets called every workerData.timeBetweenChecksInS seconds
 */
function updateWorker() {
  // sendResponse("message", "Hello!", "", "", "")
}

function getAccountList(reqData) {
  // get Account list
  client.rest.account
    .listAccounts()
    .then(data => {
      allAccountsArray = data
      sendResponse(
        200,
        "message",
        "Account List",
        "getAccountList",
        reqData.id,
        data
      )
    })
    .catch(error => {
      sendResponse(
        error.response.status,
        "message",
        error.response.statusText,
        "getAccountList",
        reqData.id,
        error.data
      )
    })
}

function getMarketPrice(reqData) {
  const candleGran = CandleGranularity.ONE_MINUTE
  // get candles
  client.rest.product
    .getCandles(reqData.product, {
      granularity: candleGran
    })
    .then(candles => {
      sendResponse(
        "message",
        "Latest OneMinute-Gran MarketPrice",
        "getMarketPrice",
        reqData.id,
        {
          candle: candles[candles.length - 1]
        }
      )
    })
    .catch(error => stopMe("ERROR get MarketPrice failed"))
}

function getCandles(data) {
  const pair = data.params.pair
  const count = data.params.count
  const gran = CandleGranularity[data.params.gran]
  const end = new Date()
  var start = new Date()

  switch (data.params.gran) {
    case "ONE_DAY":
      start = new Date(new Date().setDate(end.getDate() - count))
      break
    case "SIX_HOURS":
      start = new Date(
        new Date().setTime(end.getTime() - count * 6 * 60 * 60 * 1000)
      )
      break
    case "ONE_HOUR":
      start = new Date(
        new Date().setTime(end.getTime() - count * 1 * 60 * 60 * 1000)
      )
      break
    case "FIFTEEN_MINUTES":
      start = new Date(
        new Date().setTime(end.getTime() - count * 15 * 60 * 1000)
      )
      break
    case "FIVE_MINUTES":
      start = new Date(
        new Date().setTime(end.getTime() - count * 5 * 60 * 1000)
      )
      break
    case "ONE_MINUTE":
      start = new Date(
        new Date().setTime(end.getTime() - count * 1 * 60 * 1000)
      )
      break
  }

  client.rest.product
    .getCandles(pair, {
      granularity: gran,
      start,
      end
    })
    .then(candles => {
      sendResponse("message", "Candle data", "getCandles", data.id, {
        candles,
        start,
        end
      })
    })
    .catch(error => stopMe("ERROR get Candles failed! " + error))
}

/**
 * This function stops the worker
 */
function stopMe(error) {
  sendResponse("shutdown", "Stopped worker", "", error)
  clearInterval(intervalID)
  parentPort.close()
}
/**
 * Sends a response to the listener in workerlpers
 * @param {*} status 200 or 401 ...
 * @param {*} type   message, shutdown, startup error
 * @param {*} msg    Message shown
 * @param {*} cmd    getAccountList
 * @param {*} id     event id
 * @param {*} data   actual data
 */
function sendResponse(status, type, msg, cmd, id, data) {
  workerData.status = status
  workerData.type = type
  workerData.counter = counter
  workerData.message = msg
  workerData.command = cmd
  workerData.data = data
  workerData.id = id

  parentPort.postMessage(workerData)
}

module.exports = {
  getClientObject() {
    return client
  }
}
