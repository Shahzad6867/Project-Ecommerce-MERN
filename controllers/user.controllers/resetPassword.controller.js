const User = require("../../models/user.model.js");
const bcryptjs = require("bcryptjs");
require("dotenv").config();



const getResetPassword = async (req,res) => {
    let message = req.session.message || null;
    delete req.session.message;
  
    res.render("user-view/user.reset-password.ejs", { message: message });
  }
  
const resetPassword = async (req,res) => {
try {
    const userId = req.session.otpUser._id
    const {newPassword} = req.body
    const hashedPassword = await bcryptjs.hash(newPassword,12)
    const updatedPassword = await User.findByIdAndUpdate(userId,{password : hashedPassword})
    req.session.message = "Password Updated Successfully"
    delete req.session.otpUser
    res.redirect("/profile")
    } catch (error) {
    console.log(error)
}

}


module.exports = {
    getResetPassword,
    resetPassword
}