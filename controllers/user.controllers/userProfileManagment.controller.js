const Product = require("../../models/product.model")
const User = require("../../models/user.model")
const getProfile = async (req,res) => {
    const theUser = req.session.user || req.user || "NA"
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = await User.findOne({_id : theUser._id})
    res.render("user-view/user.profile-page.ejs",{productsFullList,user})
}

module.exports = {
    getProfile
}