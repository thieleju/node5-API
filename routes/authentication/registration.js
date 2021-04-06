const crypto = require("crypto-js")
const moment = require("moment")

var express = require("express")
var router = express.Router({ mergeParams: true })

var {
  executeSQLQuery,
  addLogEntry,
  generateSalt
} = require("../../scripts/general")

router.post("/", async (req, res) => {
  try {
    if (!req.body || !req.body.password || !req.body.username)
      throw "Missing password or username!"

    if (req.body.username.length <= 4)
      throw "Username must be at least 5 characters long!"

    if (req.body.password.length <= 7)
      throw "Password must be at least 8 characters long!"

    // check if user already exists
    let data = await executeSQLQuery(
      req.body.username,
      "select username from users where username = ?",
      [req.body.username]
    )

    if (data.length != 0) throw "Username already taken!"

    let email = ""
    if (req.body.email) email = req.body.email
    else email = ""

    // generate password hash => sha256(password + salt)
    const salt = generateSalt()
    const hash = crypto.enc.Base64.stringify(
      crypto.SHA256(req.body.password + salt)
    )

    // create new deactivated user
    data = await executeSQLQuery(
      req.body.username,
      "insert into users ( activated, username, email, password, salt, lastLogin) values (?,?,?,?,?,?);",
      [
        "0",
        req.body.username,
        email,
        hash,
        salt,
        moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
      ]
    )
    addLogEntry(
      req.body.username,
      "Registered new account successfully! | " + req.ip
    )
    // respond with success
    res.status(200).json({
      status: "success",
      message: "Requested account " + req.body.username
    })
  } catch (error) {
    addLogEntry(req.body.username, error + " | " + req.ip)
    res.status(200).json({ status: "error", message: error })
  }
})

module.exports = router
