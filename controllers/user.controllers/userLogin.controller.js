const User = require("../../models/user.model.js");
const bcryptjs = require("bcryptjs");
const HTTP_STATUS = require("../../constants/httpStatus.js");
require("dotenv").config();

const getUserLogin = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("user-view/user.login.ejs", { message: message });
};

const userLogin = async (req, res, next) => {
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
   next(error)
  }
};
const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      req.logout((err, next) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/login");
      });
    } else if (req.session.user) {
      req.session.user = null;
      return res.redirect("/login");
    }
  } catch (error) {
    next(error)
  }
};
module.exports = {
  getUserLogin,
  userLogin,
  logoutUser,
};
