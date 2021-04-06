var express = require("express")
var router = express.Router({ mergeParams: true })

router.use("/apps", require("./navigation/apps"))

module.exports = router
