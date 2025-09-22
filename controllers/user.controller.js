const User = require("../models/user.model")

const getUserLogin = async (req,res) => {
    res.render("user-view/user.login.ejs")
}

const getUserRegister = async (req,res) => {
    res.render("user-view/user.register.ejs")
}

module.exports = {
    getUserLogin,
    getUserRegister
}