const User = require("../../models/user.model.js");
const Product = require("../../models/product.model.js");
const Order = require("../../models/order.model.js");

const searchUser = async (req, res) => {
    try {
      const { search } = req.body;
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
     const usersFullList =  await User.find({})
      res.render("admin-view/admin.searched-user-managment.ejs", { users, search,usersFullList});
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/users");
    }
  };

  const searchProducts = async (req, res) => {
    try {
      const { search } = req.body;
      const query = { productName: { $regex: search, $options: "i" } };
      const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
      const products = await Product.find(query).populate("categoryId").populate("brandId");
      if (!products) {
        req.session.message = "Enter an Eixsting Product's Name";
        return res.redirect("/admin/products");
      }
      let message = null
      return res.render("admin-view/admin.searched-product-managment.ejs", { products,search,productsFullList,message});
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/products");
    }
  };

  const searchOrders = async (req, res) => {
    try {
      const { search } = req.body;
      const ordersFullList = await Order.find({},{orderId : 1,_id : 0})
      const orders = await Order.aggregate([{
        $match : {orderId : { $regex : search}}
      },{
        $unwind : "$items"
       },{
        $lookup : {
            from : "users",
            localField : "userId",
            foreignField : "_id",
            as : "userId"
        }
    },{
        $unwind : "$userId"
    },{
        $lookup : {
            from : "payments",
            localField : "paymentId",
            foreignField : "_id",
            as : "paymentId"
        }
    },{
        $unwind : "$paymentId"
    }])
      if (!orders) {
        req.session.message = "There is no existing Order based on the given Order ID";
        return res.redirect("/admin/orders");
      }
      let message = null
      return res.render("admin-view/admin.searched-order-management.ejs", { orders,search,ordersFullList,message});
    } catch (error) {
      console.error(error);
      req.session.message = "Something Went Wrong";
      res.redirect("/admin/products");
    }
  };



  module.exports = {
    searchUser,searchProducts,searchOrders
  }