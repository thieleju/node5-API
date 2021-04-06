const axios = require("axios")

const {
  CoinbasePro,
  CandleGranularity,
  FeeUtil,
  OrderSide,
  OrderType
} = require("coinbase-pro-node")

var serverHelper = require("./serverHelper")
var workerHelper = require("./workerHelper")

// fixed variables
const candleGran = CandleGranularity.ONE_MINUTE

module.exports = {
  /**
   * Initialize client with userspecific config
   * @param {String} username decoded jwt token with username and token property
   * @return {CoinbasePro} client
   */
  initClient(username, logs) {
    var serverHelper = require("./serverHelper")
    var config = serverHelper.getUserConfig("coinbaseconfig", username)

    if (!config) {
      return null
    }

    if (config.useSandbox === true) {
      if (logs)
        serverHelper.addLogEntry(username, "Initialized Coinbase Pro SANDBOX")

      return new CoinbasePro({
        apiKey: config.sandbox.apikey,
        apiSecret: config.sandbox.secret,
        passphrase: config.sandbox.passphrase,
        useSandbox: true
      })
    } else if (config.useSandbox === false) {
      if (logs)
        serverHelper.addLogEntry(
          username,
          "Initialized Coinbase Pro LIVE TRADING"
        )
      return new CoinbasePro({
        apiKey: config.production.apikey,
        apiSecret: config.production.secret,
        passphrase: config.production.passphrase,
        useSandbox: false
      })
    } else {
      return null
    }
  },
  getMarketPrice(client, product_id) {
    // return lastClosingPrice
    return client.rest.product
      .getCandles(product_id, {
        granularity: candleGran
      })
      .then(candles => {
        return candles[candles.length - 1].close
      })
  },
  doGetMarketPrice(req, res, client) {
    return new Promise((resolve, reject) => {
      if (!req.body) {
        reject({ status: "error", message: "Failed to receive data" })
        return
      }
      // get candles
      client.rest.product
        .getCandles(req.params.product, {
          granularity: candleGran
        })
        .then(candles => {
          resolve({
            status: "success",
            product: req.params.product,
            candleGran,
            lastClosingPrice: candles[candles.length - 1].close
          })
        })
        .catch(error =>
          reject({
            status: "error",
            message: "Could not get candle last closing price",
            error
          })
        )
    })
  },
  getAccount(client) {
    return Promise.all([client.rest.account.listAccounts()]).then(data => {
      return data
    })
  }
}
