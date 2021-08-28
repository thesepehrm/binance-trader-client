

const { Spot } = require('@binance/connector')
const { getTickerRateForPair, getTargetQuantity } = require('./exchange-rate')

const apiKey = process.env.BINANCE_API_KEY
const apiSecret = process.env.BINANCE_API_SECRET

// provide the testnet base url

let client
if (process.env.TESTNET) {
    client = new Spot(apiKey, apiSecret, { baseURL: 'https://testnet.binance.vision' })
} else {
    client = new Spot(apiKey, apiSecret)
}

let exchangeInfo = {}
let symbols = []
let openOrders = {
    "denxa_order_0": {
        "symbol": "BTCUSDT",
        "orderId": 7771904,
        "orderListId": -1,
        "clientOrderId": "denxa_order_0",
        "transactTime": 1629889377239,
        "price": "47527.24000000",
        "origQty": "0.00300000",
        "executedQty": "0.00000000",
        "cummulativeQuoteQty": "0.00000000",
        "status": "NEW",
        "timeInForce": "GTC",
        "type": "LIMIT",
        "side": "SELL",
        "fills": []
    },
    "denxa_order_1": {
        "symbol": "BTCUSDT",
        "orderId": 7774763,
        "orderListId": -1,
        "clientOrderId": "denxa_order_1",
        "transactTime": 1629890615639,
        "price": "47447.53000000",
        "origQty": "0.00100000",
        "executedQty": "0.00000000",
        "cummulativeQuoteQty": "0.00000000",
        "status": "NEW",
        "timeInForce": "GTC",
        "type": "LIMIT",
        "side": "SELL",
        "fills": []
    }

}

let finalOrders = {}

let index = 2;

client.exchangeInfo().then(resp => {
    exchangeInfo = resp.data
    let temp = {}
    exchangeInfo.symbols.map(s => {
        temp[s.baseAsset] = true
        temp[s.quoteAsset] = true
    })
    symbols = Object.keys(temp)
    console.log("✅ Successfully initialized Binance!")
})


const getAccount = async () => {
    const response = await client.account()
    return response.data
}

const getExchange = () => exchangeInfo
const getSymbols = () => symbols

/**
 * This method just works on the mainnet.
 * @param {string} symbol
 * @returns {Promise<{string}>}
 * the deposit address for the given symbol
 */
const getWallet = async (symbol) => {
    const response = await client.depositAddress(symbol)
    return response.data
}

const withdraw = async (symbol, address, quantity, network) => {
    const response = await client.withdraw(symbol, address, quantity, { network })
    return response.data
}

const getPermissions = async () => {
    const resp = await client.apiPermissions()
    return resp.data
}

const getSwapPool = async () => {
    const resp = await client.bswapPools()
    return resp.data
}

const swap = async (from, to, quantity) => {
    const resp = await client.bswapSwap(from, to, quantity)
    return resp.data
}

const getOrder = async (orderId) => {
    if (!openOrders[orderId]) {
        console.log("HOY")
        return null
    }
    let symbol = openOrders[orderId].symbol
    const resp = await client.getOrder(symbol, {
        origClientOrderId: orderId
    })
    return resp.data
}

const newOrder = async (from = "", to = "", quantity) => {
    let pair = (from + to).toUpperCase()
    let inversePair = (to + from).toUpperCase()

    let side = "BUY"
    let symbol = ""
    let found = exchangeInfo.symbols.reduce((acc, s) => { if (s.symbol === pair) acc = true; return acc }, false)
    if (found) {
        side = "SELL"
        symbol = pair
    } else {
        symbol = inversePair
        quantity = getTargetQuantity(from, to, quantity)
    }

    let price = getTickerRateForPair(from, to)
    // use STOP_LOSS_LIMIT to avoid loss
    try {
        const response = await client.newOrder(symbol, side, "LIMIT", { quantity, price: price, timeInForce: 'GTC', newClientOrderId: `denxa_order_${index}` })
        openOrders[`denxa_order_${index}`] = response.data
        index++
        return response.data
    } catch (error) {
        return error.response.data.msg
    }


}

const checkOrders = async () => {
    let orderIds = Object.keys(openOrders)
    let promises = orderIds.map(async (orderId) => {
        let order = await getOrder(orderId)

        if (order.status == "FILLED") {
            finalOrders[orderId] = order
            delete openOrders[orderId]
        } else {
            console.log(order.status)
        }
        console.log(`🎉 Filled Order: ${orderId}`);
    })
    await Promise.all(promises)
}

const getAllOrders = async () => {
    const resp = await client.openOrders();
    return resp.data
}

const checkOrder = (orderId) => {
    // is inside final orders
    if (finalOrders[orderId]) {
        return finalOrders[orderId]
    }
    return false
}

module.exports = {
    getAccount,
    getPermissions,
    getSymbols,
    getExchange,
    getWallet,
    withdraw,
    newOrder,
    getSwapPool,
    checkOrders,
    swap,
    getAllOrders,
    checkOrder
}