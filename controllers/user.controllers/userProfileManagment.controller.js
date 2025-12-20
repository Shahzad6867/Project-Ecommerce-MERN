const Product = require("../../models/product.model")
const Address = require("../../models/address.model")
const User = require("../../models/user.model")
const getProfile = async (req,res) => {
    const theUser = req.session.user || req.user 
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    const address = await Address.findOne({userId : theUser._id, isDefault : false})
    const defaultAddress = await Address.findOne({userId : theUser._id,isDefault : true})
    const user = await User.findOne({_id : theUser._id})
    let message = req.session.message || null
    delete req.session.message
    res.render("user-view/user.profile-page.ejs",{message,productsFullList,user,address,defaultAddress})
}

const getAddress = async (req,res) => {
    const productsFullList = await Product.find({},{productName : 1,variants : 1,categoryId : 1}).populate("categoryId","categoryName")
    let id = req.session.user?._id || req.user?._id
    const addressList = await Address.find({userId : id,isDefault : false})
    let defaultAddress = await Address.find({userId : id,isDefault : true})
    if(defaultAddress.length > 0){
        defaultAddress = defaultAddress[0]
    }else{
        defaultAddress = null
    }
   
    const user = req.session.user || req.user

    const message = req.session.message || null
    delete req.session.message
    res.render("user-view/user.address-management.ejs",{productsFullList,user,addressList,defaultAddress,message})
}

const addAddress = async (req,res) => {
 try {
    const {firstName,lastName,country,state,city,pincode,mobileNo,address,isDefault} = req.body
    let isDefaultToSave = null
    if(isDefault === undefined){
        let id = req.session.user?._id || req.user?._id
        let isThereDefaultAddress = await Address.findOne({userId : id,isDefault : true})
       
        if(isThereDefaultAddress === null){
            isDefaultToSave = true
        }else{
            isDefaultToSave = false
        }
    }else{
        isDefaultToSave = true
        let id = req.session.user?._id || req.user?._id
        await Address.findOneAndUpdate({userId : id , isDefault : true},{$set : {isDefault : false}})
    }

    let userId = req.session.user?._id || req.user?._id

    const addressToBeSaved = new Address({
        firstName,
        lastName,
        country,
        state,
        city,
        address,
        pincode,
        mobileNo,
        userId,
        isDefault : isDefaultToSave
    })

    await addressToBeSaved.save()
    req.session.message = "Address added successfully!"
    res.redirect("/address")
 } catch (error) {
    console.log(error)
    req.session.message = "Oops! some error has occured"
    res.redirect("/address")
 }
}

const editAddress = async (req,res) => {
    try {
        const id = req.query.id
        const {firstName,lastName,country,state,city,pincode,mobileNo,address,isDefault} = req.body
        const addressToBeUpdated = await Address.findOne({_id : id})
        await Address.findByIdAndUpdate({_id : id},{$set : {
            firstName,
            lastName,
            country,
            state,
            city,
            address,
            pincode,
            mobileNo,
            userId : addressToBeUpdated.userId,
            isDefault : addressToBeUpdated.isDefault
        }})
        req.session.message = "Address updated Successfully"
        res.redirect("/address")
    } catch (error) {
        console.log(error)
        req.session.message = "Oops! some error has occured"
        res.redirect("/address")
    }
}

const deleteAddress = async (req,res) => {
    const id = req.query.id
    const idOfUser = req.query.userId

    const addressToBeDeleted = await Address.findOneAndDelete({_id : id})
    console.log(addressToBeDeleted)
    if(addressToBeDeleted?.isDefault === true){
        await Address.findOneAndUpdate({userId : idOfUser},{$set : {isDefault : true}})
    }
    req.session.message = "Address deleted Successfully"
    res.redirect("/address")
}

const resetDefaultAddress = async (req,res) => {
    const id = req.query.id
    
    const idOfUser = req.session.user?._id || req.user?._id
     await Address.findOneAndUpdate({userId : idOfUser,isDefault : true},{$set : {isDefault : false}})
     await Address.findByIdAndUpdate({_id : id},{$set : {isDefault : true}})
    req.session.message = "Your Default address has been Updated"
    res.redirect("/address")
}
module.exports = {
    getProfile,
    getAddress,
    addAddress,
    editAddress,
    deleteAddress,
    resetDefaultAddress
}