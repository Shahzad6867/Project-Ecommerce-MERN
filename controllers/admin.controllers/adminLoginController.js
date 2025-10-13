const Admin = require("../../models/admin.model.js");
const User = require("../../models/user.model.js");
const bcryptjs = require("bcryptjs");

const getAdminLogin = async (req,res) => {
    const message = req.session.message || null
    delete req.session.message 
    res.render("admin-view/admin.login.ejs",{message})
}

const adminLogin = async (req,res) => {
    try {
        console.log(req.body)
    const {email,password} = req.body
    const isAdmin = await Admin.findOne({email})
    if(!isAdmin){
    return res.render("admin-view/admin.login.ejs",{message : "403 Unauthorized User, Access Denied! "})
    }
    const isPassMatch = await bcryptjs.compare(password,isAdmin.password)
    if(isAdmin && !isPassMatch){
    return  res.render("admin-view/admin.login.ejs",{message : "Incorrect Password"})
    }
    req.session.admin = isAdmin
    req.session.message = `Welcome ${isAdmin.firstName}`
    return res.redirect("/admin/users")
    } catch (error) {
        console.error(error)
    }
}


const searchUser = async (req, res) => {
    try {
      const { search } = req.body;
      console.log(search)
      const query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
      const users = await User.find(query);
      if (!users) {
        req.session.message = "Enter an Eixsting User's Name or Email";
        return res.redirect("/admin/users");
      }
      res.render("admin-view/admin.searched-user-managment.ejs", { users });
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/users");
    }
  };





module.exports = {
    getAdminLogin,
    adminLogin,
    searchUser
}
