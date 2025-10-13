
 
const logoutAdmin = async (req,res) => {
    try {
      req.session.admin = null
    res.redirect("/admin/login")
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/dashboard");
    }
  }
    


module.exports = {
    logoutAdmin
}
