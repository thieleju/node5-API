const express = require("express")
const router = express.Router({ mergeParams: true })

const wp = require("../../../worker/mainWorkerPool")

const { verifyToken, addLogEntry } = require("../../../scripts/general")

router.get("/", verifyToken, async (req, res) => {
  try {
    // check worker
    let status = await wp.checkWorker(req.decoded.username)

    addLogEntry(
      req.decoded.username,
      "Checked worker: " + status.status + " | " + req.ip
    )
    res.json({
      status: "success",
      message: "Checked worker successfully!",
      worker: status
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
