const crypto = require("crypto-js")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const moment = require("moment")

// get secret information from .env
const { config } = require("dotenv")
config({ path: __dirname + "/.env" })

var workerHelper = require("./workerHelper")

module.exports = {
  doRegister(req, res) {
    return new Promise((resolve, reject) => {
      if (!req.body) {
        reject({ status: "error", message: "Failed to receive data" })
        return
      }
      // user array
      const obj = crypto.SHA256(req.body.password)
      const pwd = crypto.enc.Base64.stringify(obj)
      const user = {
        username: req.body.username,
        email: req.body.email,
        password: pwd,
        activated: false,
        workerData: {
          workerID: module.exports.generateID(workerHelper.getWorkerIDLength()),
          status: "offline",
          timeBetweenChecksInS: 30
        },
        coinbaseconfig: {
          useSandbox: false,
          sandbox: {
            apikey: "",
            passphrase: "",
            secret: ""
          },
          production: {
            apikey: "",
            passphrase: "",
            secret: ""
          }
        }
      }
      let userAlreadyExists = false

      // read users data
      var userArray = JSON.parse(fs.readFileSync("./db/user.json"))
      // reject promise if user already exists
      userArray.forEach(el => {
        if (el.username == user.username || el.email == user.email) {
          userAlreadyExists = true
          reject({ status: "error", message: "User already exits!" })
          return
        }
      })
      // add to array
      userArray.push(user)
      // convert to string
      var data = JSON.stringify(userArray, null, 2)
      // write to file
      if (!userAlreadyExists) {
        fs.writeFile("db/user.json", data, err => {
          if (err) {
            reject({ status: "error", message: "Failed to write to file" })
            return
          }
          // resolve promise
          resolve({
            status: "success",
            message: "Account " + user.username + " requested"
          })
        })
      }
    })
  },
  doLogin(req, res) {
    return new Promise((resolve, reject) => {
      if (!req.body) {
        reject({ status: "error", message: "Failed to receive data" })
        return
      }
      // user array
      const obj = crypto.SHA256(req.body.password)
      const pwd = crypto.enc.Base64.stringify(obj)
      const user = {
        username: req.body.username,
        password: pwd
      }
      // read users data
      var userArray = JSON.parse(fs.readFileSync("./db/user.json"))
      // loop through users
      userArray.forEach(el => {
        if (el.username === user.username && el.password === user.password) {
          if (el.activated) {
            const token = jwt.sign(
              { username: el.username },
              process.env.VUE_APP_SECRET_KEY
            )
            resolve({
              status: "success",
              message: "Signing in as user " + user.username + " ...",
              token
            })
          } else {
            reject({ status: "error", message: "Account not activated" })
            return
          }
        }
      })
      reject({
        status: "error",
        message: "User not found or wrong credentials"
      })
    })
  },
  verifyToken(req, res, next) {
    const bearerHeader = req.headers["authorization"]

    if (typeof bearerHeader !== "undefined") {
      const bearer = bearerHeader.split(" ")
      const bearerToken = bearer[1]
      req.token = bearerToken
      next()
    } else {
      res.sendStatus(401)
    }
  },
  getUserConfig(configName, username) {
    // read user data
    var users = JSON.parse(fs.readFileSync("./db/user.json"))
    // loop through users to check if current signed in user matches
    var userData = null
    users.forEach(user => {
      if (username == user.username) {
        userData = user[configName]
      }
    })

    if (userData) {
      return userData
    } else {
      return null
    }
  },
  doSaveConfig(req, res, username, configname) {
    return new Promise((resolve, reject) => {
      if (!req.body || !req.body.coinbaseconfig) {
        reject({ status: "error", message: "Failed to receive data" })
        return
      }
      let oldConfig = module.exports.getUserConfig(configname, username)
      let data = req.body.coinbaseconfig

      if (!oldConfig) {
        reject({
          status: "error",
          message: "Could not get old config"
        })
        return
      }

      if (JSON.stringify(oldConfig) == JSON.stringify(data)) {
        reject({ status: "error", message: "No changes found" })
        return
      }

      // read users data
      var userArray = JSON.parse(fs.readFileSync("./db/user.json"))

      //TODO find a way to do this recursively for every config
      if (configname == "coinbaseconfig") {
        for (let i = 0; i < userArray.length; i++) {
          if (userArray[i].username == username) {
            userArray[i].coinbaseconfig.useSandbox = data.useSandbox
            userArray[i].coinbaseconfig.sandbox.apikey = data.sandbox.apikey
            userArray[i].coinbaseconfig.sandbox.passphrase =
              data.sandbox.passphrase
            userArray[i].coinbaseconfig.sandbox.secret = data.sandbox.secret
            userArray[i].coinbaseconfig.production.apikey =
              data.production.apikey
            userArray[i].coinbaseconfig.production.passphrase =
              data.production.passphrase
            userArray[i].coinbaseconfig.production.secret =
              data.production.secret

            // lets pretend you didn't see that
          }
        }
      } else if (configname == "workerData") {
        // make workerData changes
        for (let i = 0; i < userArray.length; i++) {
          if (userArray[i].username == username) {
            userArray[i].workerData.status = data.status
          }
        }
      } else {
        reject({
          status: "error",
          messag: "Awesome code is yet to be written, sorry (config not found)"
        })
      }
      // write changes to file
      fs.writeFile("db/user.json", JSON.stringify(userArray, null, 2), err => {
        if (err) {
          reject({
            status: "error",
            message: "Failed to write to file"
          })
        }
        resolve({
          status: "success",
          message: "Updated config successfully"
        })
      })
    })
  },
  saveConfig(username, configname, data) {
    // read old data from users json
    let oldConfig = module.exports.getUserConfig(configname, username)

    if (!oldConfig)
      return { status: "error", message: "Could not get old config" }

    if (JSON.stringify(oldConfig) == JSON.stringify(data))
      return { status: "error", message: "No changes found" }

    // read users data
    var userArray = JSON.parse(fs.readFileSync("./db/user.json"))

    //TODO find a way to do this recursively for every config
    if (configname == "coinbaseconfig") {
      for (let i = 0; i < userArray.length; i++) {
        if (userArray[i].username == username) {
          userArray[i].coinbaseconfig.useSandbox = data.useSandbox
          userArray[i].coinbaseconfig.sandbox.apikey = data.sandbox.apikey
          userArray[i].coinbaseconfig.sandbox.passphrase =
            data.sandbox.passphrase
          userArray[i].coinbaseconfig.sandbox.secret = data.sandbox.secret
          userArray[i].coinbaseconfig.production.apikey = data.production.apikey
          userArray[i].coinbaseconfig.production.passphrase =
            data.production.passphrase
          userArray[i].coinbaseconfig.production.secret = data.production.secret

          // lets pretend you didn't see that
        }
      }
    } else if (configname == "workerData") {
      // make workerData changes
      for (let i = 0; i < userArray.length; i++) {
        if (userArray[i].username == username) {
          userArray[i].workerData.status = data.status
        }
      }
    } else {
      return {
        status: "error",
        messag: "Awesome code is yet to be written, sorry (config not found)"
      }
    }
    // write changes to file
    fs.writeFile("db/user.json", JSON.stringify(userArray, null, 2), err => {
      if (err) {
        return {
          status: "error",
          message: "Failed to write to file"
        }
      }
      return {
        status: "success",
        message: "Updated config successfully"
      }
    })
  },
  addLogEntry(user, message) {
    var log = module.exports.getTimestamp() + " | " + user + " > " + message
    console.log(log)
  },
  getTimestamp() {
    return moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
  },
  generateID(length) {
    var result = ""
    var characters =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}
