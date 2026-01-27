const Order = require("../../models/order.model")
const Payment = require("../../models/payment.model")
const Product = require("../../models/product.model")
const Wallet = require("../../models/wallet.model")
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

    if(session.metadata?.for === "Wallet"){
        if (event.type === "checkout.session.completed") {
            let user = req.session.user || req.user
           
            const payment = await Payment.findOne({_id : new mongoose.Types.ObjectId(session.metadata.payment)})
            const wallet = await Wallet.findOne({userId : payment.userId})
            wallet.walletBalance += payment.amountToBePaid
            wallet.transactions.push({
                paymentId : payment._id,
                transactionType : "Credit",
                transactionReason : "Wallet Top-up",
                transactionAmount : payment.amountToBePaid
            })
            await wallet.save()
            payment.status = "Paid Successfully"
            payment.amountPaid = payment.amountToBePaid
            payment.amountToBePaid = 0
            payment.paymentDate = new Date()
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
      }else if(session.metadata?.for === "Order"){
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
            payment.amountToBePaid = 0
            payment.paymentDate = new Date()
            payment.paymentIntentId = event.data.object.payment_intent
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

    if(event.type === "refund.updated" && event.data.object.status === "succeeded"){
        let payment = await Payment.findOne({paymentIntentId : event.data.object.payment_intent})
        let order = await Order.findById(payment.orderId)

        for(let i = 0 ; i < order.items.length ; i++){
            if(order.items[i].isCancelled && (order.items[i].refundOnCancelled.refundId === event.data.object.id)){
                order.items[i].refundOnCancelled.status = "Refunded"
                order.items[i].refundOnCancelled.refundedAt = new Date()
                payment.amountRefunded += order.items[i].refundOnCancelled.amount
                payment.amountToBeRefunded -= order.items[i].refundOnCancelled.amount
            }
        }
        await payment.save()
        await order.save()
    }
    
    
      
}

module.exports = webhookHandler