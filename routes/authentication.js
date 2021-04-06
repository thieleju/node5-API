var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/login", require("./authentication/login"))
  .use("/registration", require("./authentication/registration"))
  .use("/checkauth", require("./authentication/checkauth"))

module.exports = router
