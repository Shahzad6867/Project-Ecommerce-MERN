const Order = require("../../models/order.model")
const Payment = require("../../models/payment.model")
const Product = require("../../models/product.model")
const Cart = require("../../models/cart.model")
const mongoose = require("mongoose")
require("dotenv").config()
 
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const endPointSecret = process.env.STRIPE_WEBHOOK_SECRET

const webhookHandler = async (req,res) => {
    
    let event;

    try{
        let sig = req.headers['stripe-signature']
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endPointSecret
        )
        res.status(200).json({ received: true });
    }catch(error){
        console.log("Webhook signature verification failed", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    
    
    const session = event.data.object
    console.log(session)
    if (event.type === "checkout.session.completed") {
        let user = req.session.user || req.user
        console.log(user)
        const payment = await Payment.findOne({_id : new mongoose.Types.ObjectId(session.metadata.payment)})
        const order = await Order.findOne({_id : payment.orderId })
        let items = order.items
        for(let j = 0 ; j < items.length ; j++){
            let product = await Product.findById(items[j].productId)
                product.variants[items[j].variant].stockQuantity -=  items[j].quantity
                await product.save()
                await Cart.findOneAndDelete({userId : new mongoose.Types.ObjectId(session.metadata.user), productId : items[j].productId,variant : items[j].variant})
        }
       
        payment.status = "Paid Successfully"
        payment.amountPaid = payment.amountToBePaid
        payment.paymentDate = new Date()
        await Order.findOneAndUpdate({_id : payment.orderId},{$set : {willBeCancelledAt : null}})
        await payment.save()
    }else if (event.type ===  "payment_intent.payment_failed") {
       
        const payment = await Payment.findOne({_id : new mongoose.Types.ObjectId(session.metadata.payment)})
        payment.status = "Payment Failed"
        await payment.save()
    }else if (event.type ===  "checkout.session.expired") {
        
        const payment = await Payment.findOne({_id : new mongoose.Types.ObjectId(session.metadata.payment)})
        payment.status = "Payment Failed"
        await payment.save()
    }
      
}

module.exports = webhookHandler