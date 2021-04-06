const express = require("express")
const router = express.Router({ mergeParams: true })

const { CandleGranularity } = require("coinbase-pro-node")
const clientPublic = require("../../../scripts/coinbaseClientPublic")
const wp = require("../../../worker/mainWorkerPool")

const { verifyToken, addLogEntry } = require("../../../scripts/general")

router.get("/", verifyToken, async (req, res) => {
  try {
    // check worker => start if not running
    await wp.checkWorker(req.decoded.username)
    // get client
    var client = wp.getWorkerByUsername(req.decoded.username).getClient()

    // get accountlist
    let accounts = await client.rest.account.listAccounts()

    addLogEntry(req.decoded.username, "Received accountlist | " + req.ip)
    res.json({
      status: "success",
      message: "Received accountlist successfully!",
      accounts
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
