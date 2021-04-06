var express = require("express")
var router = express.Router({ mergeParams: true })

router
  .use("/accountlist", require("./pri/accountlist"))
  .use("/checkWorker", require("./pri/checkWorker"))

module.exports = router
