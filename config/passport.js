const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user.model")
require("dotenv").config()

passport.use( new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENTID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "/auth/google/callback"
},
 async function(accessToken,refreshToken,profile,callback){
    try {
        let user = await User.findOne({googleId : profile.id})
        if(user){
            return callback(null,user)
        }else{
             user = new User({
                firstName : profile.name.givenName,
                lastName : profile.name.familyName,
                email : profile.emails[0].value,
                profileImage : profile.photos[0].value,
                isVerified : true,
                googleId : profile.id
            })

            await user.save()
            return callback(null,user)
        }
    } catch (error) {
        return callback(error,null)
    }
}))

passport.serializeUser((user,callback) => {
    return callback(null,user.id)
})

passport.deserializeUser((id,callback) => {
    User.findById(id)
    .then((user) => {
        return callback(null,user)
    })
    .catch((err) => {
        return callback(err,null)
    })
})

module.exports = passport