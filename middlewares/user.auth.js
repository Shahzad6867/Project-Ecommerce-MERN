const checkSession = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  };
  
  const isLogged = (req, res, next) => {
    if (req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
  };

  const otpSession = (req, res, next) => {
    if (req.session.otpUser) {
      next()
    } else {
      res.redirect("/login")
    }
  };
  module.exports = {
    checkSession,
    isLogged,
    otpSession
  };