const jwt = require("jsonwebtoken")
const cors = require("cors")
const bodyParser = require("body-parser")
const fs = require("fs")
const express = require("express")
const app = express()
const emitter = require("events").EventEmitter

// get secret information from .env
const { config } = require("dotenv")
config({ path: __dirname + "../../../.env" })

// helper functions
var serverHelper = require("./serverHelper")
var workerHelper = require("./workerHelper")
var coinbaseHelper = require("./coinbaseHelper")

// event emitter
var eventemitter = new emitter()

module.exports = {
  getEventEmitter() {
    return eventemitter
  }
}

app.use(cors())
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.json({
    message: "Hello from the node5 API!"
  })
})

app.get("/apps", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, err => {
    if (err) {
      res.json(err)
    } else {
      let apps = JSON.parse(fs.readFileSync("./db/apps.json"))
      res.json(apps)
    }
  })
})

app.get("/config/:configname", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.json(err)
    } else {
      const config = serverHelper.getUserConfig(
        req.params.configname,
        decoded.username
      )
      if (config) {
        res.json(config)
      } else {
        res.sendStatus(401)
      }
    }
  })
})

app.get("/checkauth", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.sendStatus(401)
    } else {
      res.json({
        message: "You are currently logged in as " + decoded.username
      })
    }
  })
})

app.get("/dsgvo", (req, res) => {
  try {
    var dsgvo = fs.readFileSync("./src/assets/dsgvo.html")
    res.send(dsgvo)
  } catch (error) {
    res.status(400).json(error)
  }
})

app.get("/favicon.ico", (req, res) => {
  try {
    var ico = fs.readFileSync("./public/favicon.ico")
    res.send(ico)
  } catch (error) {
    res.status(400).json(error)
  }
})

app.post("/saveSettings", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.sendStatus(401)
    } else {
      serverHelper
        .doSaveConfig(req, res, decoded.username, "coinbaseconfig")
        .then(data => {
          res.status(200).json({
            status: data.status,
            message: data.message
          })
        })
        .catch(error => {
          res.status(200).json({
            status: error.status,
            message: error.message
          })
        })
    }
  })
})

app.post("/register", (req, res) => {
  serverHelper
    .doRegister(req, res)
    .then(data => {
      res.status(200).json({
        status: data.status,
        message: data.message
      })
    })
    .catch(error => {
      res.status(200).json({
        status: error.status,
        message: error.message
      })
    })
})

app.post("/login", (req, res) => {
  serverHelper
    .doLogin(req, res)
    .then(data => {
      res.status(200).json({
        token: data.token,
        email: req.body.email,
        username: req.body.username,
        message: data.message,
        status: data.status
      })
    })
    .catch(error => {
      res.status(200).json({
        status: error.status,
        message: error.message
      })
    })
})

app.get("/checkWorker", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.sendStatus(401)
    } else {
      workerHelper
        .checkWorker(decoded.username)
        .then(data => {
          res.status(200).json({
            status: data.status,
            message: data.message,
            workerData: data.workerData
          })
        })
        .catch(error => {
          res.status(200).json({
            status: error.status,
            message: error.message
          })
        })
    }
  })
})

app.get("/getAccountList", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.sendStatus(401)
    } else {
      let command = "getAccountList"
      let id = serverHelper.generateID(6)
      // create new event + once listener
      eventemitter.once(decoded.username + ":" + command + ":" + id, data => {
        if (data.status != 200) {
          res.json({
            status: "error",
            message:
              "Could not get get " +
              command +
              " Data! Please check your coinbase api settings!",
            error: data.message
          })
        } else {
          res.json({
            status: "success",
            message: "Received " + command,
            accounts: data.data
          })
        }
      })
      // send request to worker
      workerHelper.sendMessageToWorker({
        username: decoded.username,
        id,
        cmd: command,
        data: null
      })
    }
  })
})

app.get("/getMarketPrice/:product", serverHelper.verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
    if (err) {
      res.sendStatus(401)
    } else {
      let command = "getMarketPrice"
      let id = serverHelper.generateID(6)
      // create new event + once listener
      eventemitter.once(decoded.username + ":" + command + ":" + id, data => {
        if (data == "shutdown") {
          res.json({
            status: "error",
            message:
              "Could not get get " +
              command +
              " Data! Please check your coinbase api settings!"
          })
        } else {
          res.json({
            status: "success",
            message: "Received " + command,
            data
          })
        }
      })
      // send request to worker
      workerHelper.sendMessageToWorker({
        username: decoded.username,
        id,
        cmd: command,
        product: req.params.product
      })
    }
  })
})

app.get(
  "/getCandles/:pair/:gran/:count",
  serverHelper.verifyToken,
  (req, res) => {
    jwt.verify(req.token, process.env.VUE_APP_SECRET_KEY, (err, decoded) => {
      if (err) {
        res.sendStatus(401)
      } else {
        let command = "getCandles"
        let id = serverHelper.generateID(6)
        // create new event + once listener
        eventemitter.once(decoded.username + ":" + command + ":" + id, data => {
          if (data == "shutdown") {
            res.json({
              status: "error",
              message:
                "Could not get get " +
                command +
                " Data! Please check your coinbase api settings!"
            })
          } else {
            res.json({
              status: "success",
              message: "Received " + command,
              data
            })
          }
        })
        // send request to worker
        workerHelper.sendMessageToWorker({
          username: decoded.username,
          id,
          cmd: command,
          params: req.params
        })
      }
    })
  }
)

// start server
app.listen(process.env.VUE_APP_SERVERPORT, () => {
  console.log("HTTP Server started on Port " + process.env.VUE_APP_SERVERPORT)
})
