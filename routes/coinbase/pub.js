var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/candles", require("./pub/candles"))
  .use("/marketPrice", require("./pub/marketPrice"))

module.exports = router
