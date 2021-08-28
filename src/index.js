require("dotenv").config();
const express = require('express');
require('express-group-routes');



const app = express();
const cors = require('cors')
app.use(express.json())
app.use(cors({ origin: '*' }));
const port = process.env.PORT || 3000;

console.log(`⏱  Initializing binance...`);
const binance = require("./binance");
const exchangeRate = require("./exchange-rate");

console.log(`⏱  Initializing rates auto-update...`);
require("./jobs");


const { catchAsync } = require("./util")

app.group("/api/v1", (router) => {
    router.get("/", (req, res) => {
        res.send("Trading API");
    });
    router.get("/account", catchAsync(async (req, res) => {
        let info = await binance.getAccount()
        res.send(info)
    }));
    router.get("/exchange", catchAsync(async (req, res) => {
        let info = binance.getExchange()
        res.send(info)
    }));
    router.get("/exchange/symbols", catchAsync(async (req, res) => {
        let info = await binance.getSymbols()
        res.send(info)
    }));

    router.get("/wallet/:symbol", async (req, res) => {
        let info = await binance.getWallet(req.params.symbol)
        res.send(info)
    });
    router.get("/swap/list", async (req, res) => {
        let info = await binance.getSwapPool()
        res.send(info)
    });
    router.get("/permissions", async (req, res) => {
        let info = await binance.getPermissions()
        res.send(info)
    });
    router.get("/pairs", async (req, res) => {
        let info = await exchangeRate.getPairs()
        res.send(info)
    });
    router.get("/pair/:from", async (req, res) => {
        let info = await exchangeRate.getPairs(req.params.from)
        res.json(info)
    });
    router.get("/pair/:from/:to", async (req, res) => {
        let info = await exchangeRate.getRateForPair(req.params.from, req.params.to)
        res.json(info)
    });
    router.post("/pair/:from/:to/calculate", (req, res) => {
        if (!req.body.amount) {
            res.status(400).send("Missing amount")
            return
        }
        let amount = exchangeRate.calculateAmount(req.params.from, req.params.to, req.body.amount)
        res.json(amount)
    });
    router.post("/order/send", async (req, res) => {
        if (!req.body.from || !req.body.to || !req.body.amount) {
            res.status(400).send("Missing parameters")
            return
        }
        let info = await binance.newOrder(req.body.from, req.body.to, req.body.amount)
        res.json(info)
    });
    router.get("/orders", catchAsync(async (req, res) => {
        let info = await binance.getAllOrders()
        res.json(info)
    }));
    router.get("/orders/check/:id", (req, res) => {
        let info = binance.checkOrder(req.params.id)
        res.json(info)
    });

})

app.listen(port, () => {
    console.log(`📀 API listening at http://localhost:${port}/api/v1/`);
});