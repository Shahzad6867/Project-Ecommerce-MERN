const User = require("../../models/user.model.js");

const getUsers = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
     const users = await User.find({}).sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await User.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.user-managment.ejs",{message,users,page,pages,count})
}

const blockUser = async (req,res) => {
    try {
        const {id} = req.query
     await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : true}})
    req.session.message = "User Blocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}
const unblockUser = async (req,res) => {
    try {
        const {id} = req.query
     await User.findByIdAndUpdate({_id : id},{$set : {isBlocked : false}})
    req.session.message = "User Unblocked"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}

const deleteUser = async (req,res) => {
    try {
    const {id} = req.query
     await User.findByIdAndDelete({_id : id})
    req.session.message = "User Deleted"
    res.redirect("/admin/users")
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getUsers,
    blockUser,
    unblockUser,
    deleteUser
}