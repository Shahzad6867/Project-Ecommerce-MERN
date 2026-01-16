const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user.model")
const Wallet = require("../models/wallet.model")
const cloudinary = require("./cloudinaryConfig.js")
const crypto = require("crypto")
require("dotenv").config()

function generateReferralCode(userId) {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase(); 
    const userPart = userId.toString().slice(-4).toUpperCase(); 

    return `REF-${userPart}-${randomPart}`;
}

passport.use( new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENTID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "/auth/google/callback"
},
 async function(accessToken,refreshToken,profile,done){
    try {
        let user = await User.findOne({googleId : profile.id})
        if(user){
            return done(null,user)
        }else{
            const result = await cloudinary.uploader.upload(profile.photos[0].value,{
                folder : "user-profile-images"
            })
             user = new User({
                firstName : profile.name.givenName,
                lastName : profile.name.familyName,
                email : profile.emails[0].value,
                profileImage : result.secure_url ,
                isVerified : true,
                googleId : profile.id
            })

            let savedUser = await user.save()
            savedUser.referralCode = generateReferralCode(savedUser._id)

            wallet = new Wallet({
                userId : savedUser._id,
                balanceAmount : 0,
                transactions : []
            })
            await wallet.save()
            await savedUser.save()
            return done(null,user)
        }
    } catch (error) {
        return done(error,null)
    }
}))

passport.serializeUser((user,done) => {
    return done(null,user.id)
})

passport.deserializeUser((id,done) => {
    User.findById(id)
    .then((user) => {
        return done(null,user)
    })
    .catch((err) => {
        return done(err,null)
    })
})

module.exports = passport