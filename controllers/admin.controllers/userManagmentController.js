const User = require("../../models/user.model.js");
const ERROR_MESSAGES = require("../../constants/errorMessages.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getUsers = async (req, res) => {
  const perPage = req.session.itemsPerPage || 5;
  const page = req.query.page || 1;
  const usersFullList = await User.find({});
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .skip(perPage * page - perPage)
    .limit(perPage);
  const count = await User.countDocuments({});
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.render("admin-view/admin.user-managment.ejs", {
    message,
    users,
    page,
    pages,
    count,
    usersFullList,
  });
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.query;
    await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: true } });
    req.session.message = "User has been successfully Blocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/users");
  }
};
const unblockUser = async (req, res) => {
  try {
    const { id } = req.query;
    await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: false } });
    req.session.message = "User has been successfully Unblocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    return res.redirect("/admin/users");
  }
};

module.exports = {
  getUsers,
  blockUser,
  unblockUser,
};
