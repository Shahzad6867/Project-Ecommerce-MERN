const User = require("../../models/user.model.js");
const userService = require("../../services/admin-services/userService.js");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getUsers = async (req, res, next) => {
  const perPage = Number( Number(req.session.itemsPerPage)) || 5;
  const page = req.query.page || 1;
  const search = req.query.search || null
  const minOrders = req.query.minOrders || null
  const maxOrders = req.query.maxOrders || null
  const minSpent = req.query.minSpent || null
  const maxSpent = req.query.maxSpent || null
  const usersFullList = await User.find({});
  let sortBy = req.query.sortBy || null
 
  const users = await userService.getUsers(perPage,page,sortBy,search,minOrders,minSpent,maxOrders,maxSpent)
  const count = await userService.getUsersCount(search,minOrders,minSpent,maxOrders,maxSpent)
  const pages = Math.ceil(count / perPage);
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.user-managment.ejs", {
    message,
    users,
    page,
    pages,
    perPage,
    count,
    search,
    sortBy : req.query.sortBy || null,
    minSpent,
    maxSpent,
    minOrders,
    maxOrders,
    usersFullList,
  });
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: true } });
    req.session.message = "User has been successfully Blocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    next(error)
  }
};
const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: false } });
    req.session.message = "User has been successfully Unblocked";
    return res.status(HTTP_STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getUsers,
  blockUser,
  unblockUser,
};
