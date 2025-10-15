const User = require("../../models/user.model.js");
const Product = require("../../models/product.model.js");

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

  const searchProducts = async (req, res) => {
    try {
      const { search } = req.body;
      console.log(search)
      const query = { productName: { $regex: search, $options: "i" } };
      const products = await Product.find(query);
      if (!products) {
        req.session.message = "Enter an Eixsting Product's Name";
        return res.redirect("/admin/products");
      }
      return res.render("admin-view/admin.searched-product-managment.ejs", { products });
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/products");
    }
  };



  module.exports = {
    searchUser,searchProducts
  }