const cron = require("node-cron");
const { checkOrders } = require("./binance");
const { updateRates } = require("./exchange-rate");
cron.schedule("*/3 * * * * *", async () => { await updateRates() });
cron.schedule("*/3 * * * * *", async () => { await checkOrders() });