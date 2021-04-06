const express = require("express")
const app = express()

// get secret information from .env
const dotenv = require("dotenv")
dotenv.config()

const { addLogEntry } = require("./scripts/general")

app
  // middleware able to get requestors ip by req.ip
  .set("trust proxy", true)
  // use cors
  .use(require("cors")())
  .use(express.json())
  .use(
    express.urlencoded({
      extended: true
    })
  )
  // check if provided data is a valid json to catch unhandled errors
  .use((err, req, res, next) => {
    if (err) {
      res.status(400).json({ status: "error", message: "Invalid request!" })
    }
  })

  // import parent routes
  .use("/auth", require("./routes/authentication"))
  .use("/coinbase", require("./routes/coinbase"))
  .use("/public", require("./routes/public"))
  .use("/data", require("./routes/data"))
  .use("/coinbase", require("./routes/coinbase"))

  // catch every other route
  .get("*", (req, res) => {
    res.status(404).json({ message: "Not found!" })
  })

  // start server
  .listen(process.env.VUE_APP_SERVERPORT, () => {
    addLogEntry(
      "[SYSTEM]",
      "Server started on port " + process.env.VUE_APP_SERVERPORT
    )

    // initialize worker pool
    var wp = require("./worker/mainWorkerPool")
    addLogEntry("[SYSTEM]", "Initialized Worker Pool: " + wp.getName())
  })
