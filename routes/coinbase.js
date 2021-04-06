var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/pri", require("./coinbase/pri"))
  .use("/pub", require("./coinbase/pub"))

module.exports = router
