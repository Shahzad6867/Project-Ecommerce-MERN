const adminService = require("../../services/admin-services/adminLoginService");
const HTTP_STATUS = require("../../constants/httpStatus.js");

const getAdminLogin = async (req, res, next) => {
  const message = req.session.message || null;
  delete req.session.message;
  res.status(HTTP_STATUS.OK).render("admin-view/admin.login.ejs", { message });
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const isAdmin = await adminService.validateAdminEmail(email);
    if (!isAdmin) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).render("admin-view/admin.login.ejs", {
        message: "401 Unauthorized User, Access Denied! ",
      });
    }
    const isPassMatch = await adminService.validateAdminPassword(
      password,
      isAdmin.password
    );
    if (isAdmin && !isPassMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).render("admin-view/admin.login.ejs", {
        message: "Incorrect Password",
      });
    }
    req.session.admin = isAdmin;
    req.session.message = `Welcome ${isAdmin.firstName}`;
    return res.redirect("/admin/dashboard");
  } catch (error) {
    next(error)
  }
};

const logoutAdmin = async (req, res, next) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
   next(error)
  }
};

module.exports = {
  getAdminLogin,
  adminLogin,
  logoutAdmin,
};
