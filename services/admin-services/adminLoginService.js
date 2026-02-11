const Admin = require("../../models/admin.model.js");
const bcryptjs = require("bcryptjs");

const validateAdminEmail = async (email) => {
    let admin = await Admin.findOne({email})
    return admin
}
const validateAdminPassword = async (password,adminPassword) => {
    let isTrue = await bcryptjs.compare(password,adminPassword) 
    return isTrue
}

module.exports = {
    validateAdminEmail,
    validateAdminPassword
}