const mongoose = require("mongoose")
const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const stripe = require("../../config/stripeConfig.js")
const Wallet = require("../../models/wallet.model.js");
const Payment = require("../../models/payment.model.js");
require("dotenv").config()

const getWallet = async (req,res) => {
    let message = req.session.message || null 
    delete req.session.message
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const user = req.session.user || req.user
    const cartItems = await Cart.find({userId : user._id}).populate("productId").populate("productOfferId").populate("categoryOfferId")
    const cartItemsCount = await Cart.aggregate([{$match : {userId : new mongoose.Types.ObjectId(user._id)}},{$group : {_id : "$userId", totalQuantity : {$sum : "$quantity"}}}])
    let wallet = await Wallet.find({userId : user._id})
    if(wallet[0].transactions.length > 0){
      wallet = await Wallet.aggregate([{
        $match : {
          userId : user._id
        }
      },{
        $unwind : "$transactions"
      },{
        $lookup : {
          from : "payments",
         localField :"transactions.paymentId",
         foreignField : "_id",
         as : "transactions.paymentId"
        }
      },{
        $unwind : "$transactions.paymentId"
      },{
        $lookup : {
        from : "orders",
       localField :"transactions.paymentId.orderId",
       foreignField : "_id",
       as : "transactions.paymentId.orderId"
      }                 
    },{
     $unwind : {
       path : "$transactions.paymentId.orderId",
      preserveNullAndEmptyArrays: true}
    }])
    }
     console.log(wallet)
    res.render("user-view/user.wallet.ejs",{message,user,cartItems,cartItemsCount,productsFullList,wallet})
  }

  const walletTopUp = async (req,res) => {
          let user = req.session.user || req.user
        let payment = new Payment({
          userId : user._id,
          amountToBePaid : req.body.amount,
          paymentMethod : "Pay with Stripe",
          status : "Pending",
          relatedTo : "Wallet"
        })
        payment = await payment.save()
        const session = await stripe.checkout.sessions.create({
          mode : "payment",
          line_items : [
            {
              price_data : {
                currency : "usd",
                product_data : {name : "Wallet Top-up"},
                unit_amount : req.body.amount * 100,
              },
              quantity : 1
            }
          ] ,
          success_url : `http://localhost:1348/payment-processing/${payment._id}`,
          cancel_url : `http://localhost:1348/payment-failed/${payment._id}`,
          customer_email : user.email,
          metadata : {
              payment : payment._id.toString(),
              for : "Wallet"
          },
          payment_intent_data : {
              metadata : {
                  payment : payment._id.toString(),
                  for : "Wallet"
              }
          }
      })
      return res.redirect(session.url)
  }
const getPaymentStatus = async(req,res) => {
  const {id} = req.params
  const payment  = await Payment.findById(id)

  return res.json({
    message : payment.status
  })
}
const getPaymentProcessingPage = async(req,res) => {
  const {id} = req.params
  const orderId = null
  res.render("user-view/payment-processing.ejs",{paymentId : id ,orderId})

}
const getPaymentSuccesful = async(req,res) => {
  res.render("user-view/payment-successful.ejs")
}

const getPaymentFailed = async(req,res) => {
  const {id} = req.params
  const payment = await Payment.findById(id)
  if(payment.status !== "Payment Failed"){
    payment.status = "Payment Failed"
    await payment.save()
  }
  res.render("user-view/payment-failed.ejs")
}
module.exports = {
    getWallet,
    walletTopUp,
    getPaymentStatus,
    getPaymentSuccesful,
    getPaymentFailed,
    getPaymentProcessingPage
}