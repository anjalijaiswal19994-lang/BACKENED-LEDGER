const express = require("express");
const cookieParser = require("cookie-parser")

/**
 * - Routes required
 */
const authRoutes = require("./routes/auth.routes")
const accountRoute = require('./routes/account.route');
const transactionRoutes = require("./routes/transaction.routes")

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

/**
 * - Use Routes
 */
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/auth/accounts", accountRoute)
app.use("/api/transaction", transactionRoutes)

module.exports = app;