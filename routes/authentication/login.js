const crypto = require("crypto-js")
const jwt = require("jsonwebtoken")
const moment = require("moment")

var express = require("express")
var router = express.Router({ mergeParams: true })

var { executeSQLQuery, addLogEntry } = require("../../scripts/general")

const token_expire = "1d"

router.post("/", async (req, res) => {
  try {
    if (!req.body || !req.body.password || !req.body.username)
      throw "Missing password or username"

    let data = await executeSQLQuery(
      req.body.username,
      "select username, salt from users where username = ?;",
      [req.body.username]
    )

    if (data.length == 0) throw "User could not be found!"
    if (data.length > 1) throw "Multiple users found!"
    if (!data[0].salt) throw "Salt could not be found!"

    // generate password hash => sha256(password + salt)
    const hash = crypto.enc.Base64.stringify(
      crypto.SHA256(req.body.password + data[0].salt)
    )

    // check if user is valid
    data = await executeSQLQuery(
      req.body.username,
      "select activated, username, password from users where username = ? and password = ?;",
      [req.body.username, hash]
    )

    if (data.length == 0) throw "Invalid password!"
    if (data.length > 1) throw "Identical users found!"
    if (data[0].activated == 0) throw "Account deactivated!"

    // set users last login date
    await executeSQLQuery(
      req.body.username,
      "update users set lastLogin = ? where username = ?;",
      [moment(new Date()).format("YYYY-MM-DD HH:mm:ss"), req.body.username]
    )

    // generate jwt token
    const token = jwt.sign(
      { username: req.body.username },
      process.env.VUE_APP_SECRET_KEY,
      { expiresIn: token_expire }
    )
    addLogEntry(req.body.username, "Signed in successfully! | " + req.ip)
    // return jwt token
    res.status(200).json({
      status: "success",
      message: "Signed in as user " + req.body.username,
      username: req.body.username,
      token
    })
  } catch (error) {
    addLogEntry(req.body.username, error + " | " + req.ip)
    res.status(200).json({ status: "error", message: error })
  }
})

module.exports = router
