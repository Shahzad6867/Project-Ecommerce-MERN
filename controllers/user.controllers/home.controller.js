const User = require("../../models/user.model.js");
require("dotenv").config()


const getHomepage = async(req,res) => {
    let message = req.session.message || null 
    delete req.session.message

    res.send("<h1>Homepage</h1>")
}

module.exports = {
    getHomepage
}