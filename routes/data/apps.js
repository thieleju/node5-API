var express = require("express")
var router = express.Router({ mergeParams: true })

const {
  verifyToken,
  addLogEntry,
  executeSQLQuery
} = require("../../scripts/general")

const defaultApps = require("../../sources/defaultApps")

router.get("/", verifyToken, async (req, res) => {
  try {
    async function getAppsByAppString(str) {
      // string of component names of apps
      let appNames = str.replace(/\s+/g, "").split(",")
      // generate promises and put all in array
      let promises = []
      appNames.forEach(async comp => {
        promises.push(
          executeSQLQuery(
            req.decoded.username,
            "select seq, title, component, icon from apps as a where a.component = ?;",
            [comp]
          )
        )
      })
      // build apps object
      let apps = []
      data = await Promise.all(promises)
      data.forEach(app => {
        apps.push(app[0])
      })
      return apps
    }

    // get apps from database
    let data = await executeSQLQuery(
      req.decoded.username,
      "select iduser, keyname, keyvalue from users As u, settings as s where u.idusers = s.iduser and u.username = ? and s.keyname = ?;",
      [req.decoded.username, "apps"]
    )

    // apps which get sent back to client
    let apps
    // check if apps setting exists
    if (data.length > 0) {
      // find app settings and send to client
      apps = await getAppsByAppString(data[0].keyvalue)
    } else {
      // create app settings
      // get user id
      data = await executeSQLQuery(
        req.decoded.username,
        "select idusers from users where username = ?;",
        [req.decoded.username]
      )
      if (data.length == 0) throw "User could not be found!"

      // create new apps key/value pair in settings table
      data = await executeSQLQuery(
        req.decoded.username,
        "insert into settings (iduser, keyname, keyvalue) values (?,?,?);",
        [data[0].idusers, "apps", defaultApps]
      )

      // get standard apps
      apps = await getAppsByAppString(defaultApps)
    }
    addLogEntry(req.decoded.username, "Received apps | " + req.ip)
    // send apps
    res.status(200).json({
      status: "success",
      message: "Received apps successfully",
      data: apps
    })
  } catch (error) {
    addLogEntry(req.decoded.username, error)
    res.status(400).json({ status: "error", message: error })
  }
})

module.exports = router
