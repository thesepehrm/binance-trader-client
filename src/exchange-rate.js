
const axios = require("axios").default;
const Decimal = require("decimal.js").Decimal
Decimal.set({ precision: 5 })

rates = {
    LANUSDT: "10",
}

const updateRates = async () => {
    try {
        let request = await axios.get(process.env.TESTNET ? "https://testnet.binance.vision/api/v3/ticker/price" : "https://api.binance.com/api/v3/ticker/price")
        for (row of request.data) {
            rates[row.symbol] = row.price
        }
    } catch (error) {
        console.error("❌ error while updating rates")
    }
}


const getPairs = (from) => {
    if (!from) {
        return rates
    }

    let pairs = [];
    for (const rate in rates) {
        if (Object.hasOwnProperty.call(rates, rate)) {
            if (rate.startsWith(from.toUpperCase())) {
                pairs.push(rate.substr(from.length));
            }
            if (rate.endsWith(from.toUpperCase())) {
                pairs.push(rate.substr(0, rate.length - from.length));
            }
        }
    }
    return pairs
}


const getRateForPair = (from, to) => {
    if (from === to) {
        return "1"
    }
    let p = from.toUpperCase() + to.toUpperCase()
    if (rates[p]) {
        return rates[p]
    }
    let inverse = rates[to.toUpperCase() + from.toUpperCase()]
    if (inverse) {
        return new Decimal(1).div(inverse).toString()
    }
    return "0"
}

const getTickerRateForPair = (from, to) => {
    if (from === to) {
        return "1"
    }
    let p = from.toUpperCase() + to.toUpperCase()
    if (rates[p]) {
        return rates[p]
    }
    let inverse = to.toUpperCase() + from.toUpperCase()
    if (rates[inverse]) {
        return rates[inverse]
    }
    throw "Invalid pair"
}

// for inverse pairs
const getTargetQuantity = (from, to, amount) => {
    let rate = getTickerRateForPair(from, to)
    let quantity = new Decimal(amount).div(rate).toFixed(5)
    return quantity.toString()
}


const calculateAmount = (from, to, amount) => {
    let value = new Decimal(amount)
    let rate = new Decimal(getRateForPair(from, to))

    return value.times(rate).toString()
}



updateRates().then(() => {
    console.log("💰 Rates auto-update enabled!\t Pairs=" + Object.keys(rates).length)
})





module.exports = {
    updateRates,
    getPairs,
    calculateAmount,
    getRateForPair,
    getTickerRateForPair,
    getTargetQuantity
}
