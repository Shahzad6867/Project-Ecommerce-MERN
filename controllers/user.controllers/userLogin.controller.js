const User = require("../../models/user.model.js");
const bcryptjs = require("bcryptjs");
require("dotenv").config();


const getUserLogin = async (req, res) => {
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.login.ejs", { message: message });
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (!userExist) {
      req.session.message = "User does not Exist - Please Create Account";
      return res.redirect("/login");
    }
    if (userExist.isBlocked) {
      req.session.message =
        "You have been Blocked by the Admin, Contact the Administration";
      return res.redirect("/login");
    }

    const isPassMatch = await bcryptjs.compare(password, userExist.password);
    if (!isPassMatch) {
      req.session.message = "Incorrect Password";
      return res.redirect("/login");
    }

    req.session.user = userExist;
    req.session.message = `👋 Hi, ${userExist.firstName} ${userExist.lastName}`;
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};
const logoutUser = async (req,res) => {
  try {
      if(req.session.user){
          req.session.user = null
      }else if(req.user){
          req.user = null
      }
    res.redirect("/login")
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/dashboard");
    }
}
module.exports = {
  getUserLogin,
  userLogin,
  logoutUser
};
