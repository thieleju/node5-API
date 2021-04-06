const { default: CoinbasePro } = require("coinbase-pro-node")

module.exports = new CoinbasePro({
  apiKey: process.env.CBP_API_PUBLIC_KEY,
  apiSecret: process.env.CBP_API_PUBLIC_SECRET,
  passphrase: process.env.CBP_API_PUBLIC_PASSPHRASE,
  useSandbox: false
})
