const express = require("express")
const router = express.Router({ mergeParams: true })

const { CandleGranularity } = require("coinbase-pro-node")
const clientPublic = require("../../../scripts/coinbaseClientPublic")

const {
  verifyToken,
  addLogEntry,
  checkIfProductExists
} = require("../../../scripts/general")

router.post("/", verifyToken, async (req, res) => {
  try {
    const amount = req.body.amount
    const end = new Date()
    var start = new Date()

    // check request body
    if (!req.body.pair || !req.body.granularity || !req.body.amount)
      throw "Invalid request body!"

    // check if product exists
    if (!checkIfProductExists(req.body.pair))
      throw "Pair " + req.body.pair + " not found!"

    // set max amount
    if (amount > 5000) throw "Amount too high! Maximum is 5000"

    // get new start date for time interval
    switch (req.body.granularity) {
      case "ONE_DAY":
        start = new Date(new Date().setDate(end.getDate() - amount))
        break
      case "SIX_HOURS":
        start = new Date(
          new Date().setTime(end.getTime() - amount * 6 * 60 * 60 * 1000)
        )
        break
      case "ONE_HOUR":
        start = new Date(
          new Date().setTime(end.getTime() - amount * 1 * 60 * 60 * 1000)
        )
        break
      case "FIFTEEN_MINUTES":
        start = new Date(
          new Date().setTime(end.getTime() - amount * 15 * 60 * 1000)
        )
        break
      case "FIVE_MINUTES":
        start = new Date(
          new Date().setTime(end.getTime() - amount * 5 * 60 * 1000)
        )
        break
      case "ONE_MINUTE":
        start = new Date(
          new Date().setTime(end.getTime() - amount * 1 * 60 * 1000)
        )
        break
      default:
        throw "Invalid granularity!"
    }
    // get candles with public client
    let candles = await clientPublic.rest.product.getCandles(req.body.pair, {
      granularity: CandleGranularity[req.body.granularity],
      start,
      end
    })

    addLogEntry(req.decoded.username, "Received candles | " + req.ip)
    res.json({
      status: "success",
      message: "Received candles successfully!",
      candles
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
