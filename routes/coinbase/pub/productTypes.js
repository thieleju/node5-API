const express = require("express")
const router = express.Router({ mergeParams: true })

const products = require("../../../sources/productTypes")

const {
  verifyToken,
  addLogEntry,
} = require("../../../scripts/general")

router.get("/", verifyToken, async (req, res) => {
  try {
    addLogEntry(
      req.decoded.username,
      "Received productTypes | " + req.ip
    )
    res.json({
      status: "success",
      message: "Received productTypes successfully!",
      products
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router