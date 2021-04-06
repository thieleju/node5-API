const axios = require("axios")
const { workerData, parentPort } = require("worker_threads")

const { CandleGranularity, default: CoinbasePro } = require("coinbase-pro-node")

const { executeSQLQuery, addLogEntry } = require("../scripts/general")

const keynames = [
  "cb_sb_enabled",
  "cb_sb_key",
  "cb_sb_pass",
  "cb_sb_secret",
  "cb_key",
  "cb_pass",
  "cb_secret",
  "w_checks_sec"
]

class Worker {
  constructor(username) {
    this.username = username
  }

  startTimer() {
    setInterval(() => {
      this.update()
    }, this.interval)
  }
  update() {
    console.log("hello from worker " + this.username)
  }

  async getAccountList() {
    let data = await this.client.rest.account.listAccounts()
    console.log(data)
  }

  getWorker() {
    return this.worker
  }

  getClient() {
    return this.client
  }

  setClient(client) {
    this.client = client
  }

  initCoinbaseAccount() {
    return new Promise(async (resolve, reject) => {
      try {
        function findKeyValueByName(name, data) {
          return data.find(el => el[0].keyname === name)[0].keyvalue
        }

        // get coinbase settings from database
        let promises = []
        keynames.forEach(key => {
          promises.push(
            executeSQLQuery(
              this.username,
              "select iduser, keyname, keyvalue from users As u, settings as s where u.idusers = s.iduser and u.username = ? and s.keyname = ?;",
              [this.username, key]
            )
          )
        })
        // resolve all promises/queries
        let promiseData = await Promise.all(promises)
        this.interval = 1000 * findKeyValueByName("w_checks_sec", promiseData)

        var mode = ""
        if (findKeyValueByName("cb_sb_enabled", promiseData) === "1") {
          // sandbox mode
          this.setClient(
            new CoinbasePro({
              apiKey: findKeyValueByName("cb_sb_key", promiseData),
              apiSecret: findKeyValueByName("cb_sb_secret", promiseData),
              passphrase: findKeyValueByName("cb_sb_pass", promiseData),
              useSandbox: true
            })
          )
          mode = "sandbox"
        } else {
          // production mode
          this.setClient(
            new CoinbasePro({
              apiKey: findKeyValueByName("cb_key", promiseData),
              apiSecret: findKeyValueByName("cb_secret", promiseData),
              passphrase: findKeyValueByName("cb_pass", promiseData),
              useSandbox: false
            })
          )
          mode = "production"
        }
        // start worker loop
        this.startTimer()
        // log start
        addLogEntry(
          this.username,
          "[WORKER] Started worker in " +
            mode.toUpperCase() +
            " Mode with " +
            this.interval / 1000 +
            "s interval"
        )
        resolve()
      } catch (error) {
        console.log(error)
        reject(error)
      }
    })
  }
}

module.exports = Worker
