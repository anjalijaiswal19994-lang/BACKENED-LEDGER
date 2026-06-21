require("dotenv").config({ path: "./src/.env" });
const app = require('./app');
const connectToDB = require('./config/db');
connectToDB()



app.listen(3000, () => {
    console.log("server is running on port 3000")
})

