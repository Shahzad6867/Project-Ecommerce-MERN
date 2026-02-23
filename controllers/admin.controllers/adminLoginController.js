const adminService = require("../../services/admin-services/adminLoginService");
const ERROR_MESSAGES = require("../../constants/errorMessages.js");

const getAdminLogin = async (req, res) => {
  const message = req.session.message || null;
  delete req.session.message;
  res.render("admin-view/admin.login.ejs", { message });
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isAdmin = await adminService.validateAdminEmail(email);
    if (!isAdmin) {
      return res.render("admin-view/admin.login.ejs", {
        message: "401 Unauthorized User, Access Denied! ",
      });
    }
    const isPassMatch = await adminService.validateAdminPassword(
      password,
      isAdmin.password
    );
    if (isAdmin && !isPassMatch) {
      return res.render("admin-view/admin.login.ejs", {
        message: "Incorrect Password",
      });
    }
    req.session.admin = isAdmin;
    req.session.message = `Welcome ${isAdmin.firstName}`;
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    return res.render("admin-view/admin.login.ejs", {
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

const logoutAdmin = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
    req.session.message = ERROR_MESSAGES.SERVER_ERROR;
    res.redirect("/admin/dashboard");
  }
};

module.exports = {
  getAdminLogin,
  adminLogin,
  logoutAdmin,
};
