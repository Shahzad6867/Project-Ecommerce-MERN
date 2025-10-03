const checkSession = (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  };
  
  const isLogged = (req, res, next) => {
    if (req.session.admin) {
      res.redirect("/admin/users");
    } else {
      next();
    }
  };
  module.exports = {
    checkSession,
    isLogged,
  };
  