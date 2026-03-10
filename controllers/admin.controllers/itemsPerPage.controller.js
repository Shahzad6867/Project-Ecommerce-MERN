const selectedOptionToViewTheList = async (req, res, next) => {
  try {
    const redirectTo = req.headers.referer.slice(21);
    const { itemsPerPage } = req.query;
    req.session.itemsPerPage = itemsPerPage;
    if (redirectTo) {
      res.redirect(redirectTo);
    } else {
      res.redirect("/admin/users");
    }
  } catch (error) {
   next(error)
  }
};

module.exports = {
  selectedOptionToViewTheList,
};
