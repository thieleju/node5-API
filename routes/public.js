var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/dsgvo", require("./public/dsgvo"))
  .use("/favicon.ico", require("./public/favicon"))

module.exports = router
