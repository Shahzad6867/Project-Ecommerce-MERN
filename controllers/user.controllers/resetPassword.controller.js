const User = require("../../models/user.model.js");
const bcryptjs = require("bcryptjs");
const HTTP_STATUS = require("../../constants/httpStatus.js");
require("dotenv").config();

const getResetPassword = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.status(HTTP_STATUS.OK).render("user-view/user.reset-password.ejs", { message: message });
};

const resetPassword = async (req, res, next) => {
  try {
    const userId = req.session.otpUser._id;
    const { newPassword } = req.body;
    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
    req.session.message = "Password Updated Successfully";
    delete req.session.otpUser;
    res.redirect("/profile");
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getResetPassword,
  resetPassword,
};
