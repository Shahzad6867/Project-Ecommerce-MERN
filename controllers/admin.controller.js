const Admin = require("../models/admin.model");
const User = require("../models/user.model");

const bcryptjs = require("bcryptjs");

const getAdminLogin = async (req,res) => {
    const message = req.session.message || null
    delete req.session.message 
    res.render("admin-view/admin.login.ejs",{message})
}

const adminLogin = async (req,res) => {
    try {
        console.log(req.body)
    const {email,password} = req.body
    const isAdmin = await Admin.findOne({email})
    if(!isAdmin){
    return res.render("admin-view/admin.login.ejs",{message : "403 Unauthorized User, Access Denied! "})
    }
    const isPassMatch = await bcryptjs.compare(password,isAdmin.password)
    if(isAdmin && !isPassMatch){
    return  res.render("admin-view/admin.login.ejs",{message : "Incorrect Password"})
    }
    req.session.message = `Welcome ${isAdmin.firstName}`
    return res.redirect("/admin-dashboard")
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    getAdminLogin,
    adminLogin
}
