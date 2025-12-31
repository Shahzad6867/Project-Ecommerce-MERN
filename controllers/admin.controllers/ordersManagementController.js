const cloudinary = require("../../config/cloudinaryConfig.js")
const puppeteer = require("puppeteer")
const Product = require("../../models/product.model.js");
const Order = require("../../models/order.model.js")
const Payment = require("../../models/payment.model.js")

const getOrders = async(req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
     const orders = await Order.find({}).populate("userId").populate("paymentId").sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Order.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    console.log(orders)
    res.render("admin-view/admin.orders.ejs",{message,orders,page,pages,count,productsFullList})
}
const getOrderDetailPage = async (req,res) => {
    let user = req.session.user || req.user
    let message = req.session.message || null
    delete req.session.message
    const productsFullList = await Product.find({}, { productName: 1, variants: 1, categoryId: 1 }).populate("categoryId", "categoryName");
    const order = await Order.findOne({_id : req.params.id}).populate("userId").populate("addressId").populate("paymentId")
    console.log(order)
    res.render("admin-view/admin.order-details-page.ejs",{message,user,productsFullList,order})
}



async function generateInvoicePDF(htmlContent) {
    const browser = await puppeteer.launch({
        headless: "new"
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
        waitUntil: "networkidle0"
    });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }
      });
      

    await browser.close();
    return pdfBuffer;
}


function createInvoice(order){
    let tableRow = ``;
    for(let i = 0 ; i < order.items.length; i++){
        tableRow += `<tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <p style="font-weight: bold; margin: 0;">${ order.items[i].productName }</p>
                                    <p style="margin: 5px 0 0; color: #666;">Color: ${ order.items[i].color }</p>
                                    <p style="margin: 5px 0 0; color: #666;">Size: ${ order.items[i].size }</p>
                                </td>
                                <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${ order.items[i].price }</td>
                                <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${order.items[i].quantity}</td>
                                <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${ (order.items[i].price * order.items[i].quantity).toFixed(2) }</td>
                            </tr>`
    }
    return ` <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Invoice</title>
            </head>
            <body>
                <div style="background-color: white;min-width: 210mm; max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div>
                    <h1 style="font-size: 32px; color: #414141; margin: 0; font-family: Batangas;">NovaMart</h1>
                    <p style="margin: 5px 0 0; color: #666;">St44 Abi Aseed Bin Malik, <br> Sharjah, <br> United Arab Emirates <br>+971561134003<br> www.novamart.com</p>
                </div>
                <div style="text-align: right; ">
                    <h2 style="font-size: 30px; font-weight: bold; margin: 0; color: #333;">INVOICE</h2>
                    <p style="margin: 5px 0 0; color: #404040;">${order.orderId}</p>
                    <p style="margin: 5px 0 0; color:#404040;">Date:  ${new Date(order.statusTimeline.orderedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="width: 48%;">
                    <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Bill To</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${order.addressId.firstName} ${order.addressId.lastName}</p>
                    <p style="margin: 5px 0;">${order.addressId.address}</p>
                    <p style="margin: 5px 0;">${order.addressId.state} ${(order.addressId.pincode !== "Not Applicable") ? order.addressId.pincode : ""}</p>
                    <p style="margin: 5px 0;">${order.addressId.country}</p>
                    <p style="margin: 5px 0;">${order.addressId.mobileNo}</p>
                </div>
                <div style="width: 48%;">
                    <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Payment Method</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${ order.paymentId.paymentMethod }</p>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
                        <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
                        <th style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
                        <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                     ${tableRow}
                </tbody>
            </table>
            
            <div style="margin-left: auto; width: 300px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Subtotal:</span>
                    <span>$${ order.subTotal }</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Shipping:</span>
                    <span>Free</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                    <span>Tax:</span>
                    <span>$${ order.tax }</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ddd; font-weight: bold; font-size: 18px;">
                    <span>Total:</span>
                    <span>$${ order.grandTotal }</span>
                </div>
            </div>
            
            <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
                <p>Thank you for shopping with NovaMart!</p>
                <p>If you have any questions about this invoice, please contact support@novamart.com</p>
            </div>
        </div>
        </body>
        </html>`
}

function uploadPDFToCloudinary(pdfBuffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "invoices/2026",
                type : "upload"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(pdfBuffer);
    });
}



const updateStatus = async (req,res) => {
    const {id} = req.params
    let order = await Order.findById(id).populate("paymentId").populate("addressId")
    
    let {status} = req.query

    if(status === "Processed"){
        order.status.push(status)
        order.statusTimeline.processedAt = new Date()
        await order.save()
    }else if(status === "Shipped"){
        order.status.push(status)
        let html = createInvoice(order)
        let pdfBuffer = await generateInvoicePDF(html)
        const uploadResult = await uploadPDFToCloudinary(pdfBuffer)
        order.invoiceUrl = uploadResult.secure_url
        order.invoiceCreatedAt = new Date()
        order.statusTimeline.shippedAt = new Date()
        await order.save()
    }else if(status === "Out for Delivery"){
        order.status.push(status)
        order.statusTimeline.outForDeliveryAt = new Date()
        await order.save()
    }else if(status === "Delivered"){
        let payment = await Payment.findById(order.paymentId)
        order.status.push(status)
        payment.amountPaid = order.paymentId.amountToBePaid
        payment.status = "Paid Successfully"
        payment.paymentDate = new Date()
        order.statusTimeline.deliveredAt = new Date()
        await order.save()
        await payment.save()
        
    }
    req.session.message = "Status Updated Successfully"
    return res.status(200).json({
        success : true
    })
}



module.exports = {
    getOrders,
    getOrderDetailPage,
    updateStatus
}