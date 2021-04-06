var express = require("express")
var router = express.Router({ mergeParams: true })

router.use("/apps", require("./data/apps"))

module.exports = router
