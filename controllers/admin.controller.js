const Admin = require("../models/admin.model");
const User = require("../models/user.model");

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
    req.session.message = `Welcome ${isAdmin.firstName}`
    return res.redirect("/admin-dashboard")
    } catch (error) {
        console.error(error)
    }
}

const getUsers = async (req,res) => {
    const perPage = 5 
    const page = req.query.page || 1
     const users = await User.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await User.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.user-managment.ejs",{message,users,page,pages})
}

const blockUser = async (req,res) => {
    try {
        const {id} = req.query
    const user = await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : true}})
    req.session.message = "User Blocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}
const unblockUser = async (req,res) => {
    try {
        const {id} = req.query
    const user = await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : false}})
    req.session.message = "User Unblocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}

const deleteUser = async (req,res) => {
    try {
    const {id} = req.query
    const user = await User.findByIdAndDelete({_id : id})
    req.session.message = "User Deleted"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
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
    getUsers,
    blockUser,
    unblockUser,
    deleteUser,
    searchUser
}
