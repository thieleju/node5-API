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
    // check request body
    if (!req.body.pair) throw "Invalid request body!"

    // check if product exists
    if (!checkIfProductExists(req.body.pair))
      throw "Pair " + req.body.pair + " not found!"

    // get candles with public client
    let candles = await clientPublic.rest.product.getCandles(req.body.pair, {
      granularity: CandleGranularity.ONE_MINUTE
    })

    addLogEntry(
      req.decoded.username,
      "Received marketprice of " + req.body.pair + " | " + req.ip
    )
    res.json({
      status: "success",
      message: "Received marketprice successfully!",
      candle: candles[candles.length - 1]
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
