const User = require("../models/user.model")

const getUserLogin = async (req,res) => {
    res.render("user-view/user.login.ejs")
}

const getUserRegister = async (req,res) => {
    res.render("user-view/user.register.ejs")
}

const userRegister = async (req,res) => {
    res.redirect("/login")
}

module.exports = {
    getUserLogin,
    userRegister,
    getUserRegister
}