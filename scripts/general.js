const moment = require("moment")
const mysql = require("mysql")
const jwt = require("jsonwebtoken")

const products = require("../sources/productTypes")

const mySQLauth = {
  host: process.env.VUE_APP_HOST,
  user: process.env.VUE_APP_USER,
  password: process.env.VUE_APP_PASSWORD,
  database: process.env.VUE_APP_DATABASE,
  port: "3306"
}

function verifyToken(req, res, next) {
  try {
    const bearerHeader = req.headers["authorization"]

    if (typeof bearerHeader !== "undefined") {
      const bearer = bearerHeader.split(" ")
      const bearerToken = bearer[1]
      req.token = bearerToken
      // verify jwt and set decoded
      const decoded = jwt.verify(bearerToken, process.env.VUE_APP_SECRET_KEY)
      req.decoded = decoded
      // forward
      next()
    } else throw "Invalid authorization header"
  } catch (error) {
    addLogEntry("[SYSTEM]", "Invalid token provided from | " + req.ip)
    res.status(401).json({ status: "error", error })
  }
}

function addLogEntry(user, message) {
  let log = module.exports.getTimestamp() + " | " + user + " > " + message
  console.log(log)
}

function getTimestamp() {
  return moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
}

function generateID(length) {
  let result = ""
  let characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function generateSalt() {
  let result = ""
  let characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function executeSQLQuery(username, query, params) {
  return new Promise((resolve, reject) => {
    // create new connection
    let con = mysql.createConnection(mySQLauth)
    // start handshake sequence
    con.connect(err => {
      if (err) reject(err)
      // execute query
      con.query(query, params, (err, rows) => {
        if (err) reject(err)
        else {
          // close connection when query is done
          con.end(err => reject(err))
          // log query and resolve promise
          module.exports.addLogEntry(username, "[QUERY] " + query)
          resolve(rows)
        }
      })
    })
  })
}

function checkIfProductExists(product) {
  if (products.find(element => element.name === product)) return true
  else return false
}

module.exports = {
  verifyToken,
  addLogEntry,
  getTimestamp,
  generateID,
  generateSalt,
  executeSQLQuery,
  checkIfProductExists
}
