const fs = require("fs")

var express = require("express")
var router = express.Router({ mergeParams: true })

router.get("/", (req, res) => {
  try {
    var ico = fs.readFileSync("assets/dsgvo.html")
    res.send(ico)
  } catch (error) {
    res.status(400).json(error)
  }
})

module.exports = router
