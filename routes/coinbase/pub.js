var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/candles", require("./pub/candles"))
  .use("/marketPrice", require("./pub/marketPrice"))
  .use("/productTypes", require("./pub/productTypes"))

module.exports = router
