const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const bcryptjs = require("bcryptjs");

const getAdminLogin = async (req,res) => {
    res.render("admin-view/admin.login.ejs")
}

const adminLogin = async (req,res) => {

}

module.exports = {
    getAdminLogin
}
