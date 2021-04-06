var express = require("express")
var router = express.Router({ mergeParams: true })

var { verifyToken } = require("../../scripts/general")

router.get("/", verifyToken, (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      message: "You are currently logged in",
      jwt: req.decoded
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
