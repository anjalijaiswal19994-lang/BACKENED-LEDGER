const express = require("express")
const authController = require("../controllers/auth.controller")

const router = express.Router()


/* POST /api/auth/register*/

router.post("/login", authController.userLoginController)


router.post("/register", (req, res, next) => {
    console.log("REGISTER ROUTE HIT");
    next();
}, authController.userRegisterController)

router.post("/logout", authController.userLogoutController)

module.exports = router