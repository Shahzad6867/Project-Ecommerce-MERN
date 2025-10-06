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
    console.log(email);
    console.log(password);
    const userExist = await User.findOne({ email });
    console.log(userExist);
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


module.exports = {
  getUserLogin,
  userLogin
};
