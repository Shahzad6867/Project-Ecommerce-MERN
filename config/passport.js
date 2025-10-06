const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user.model")
const { deleteOne } = require("../models/user-otp.model")
require("dotenv").config()

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
             user = new User({
                firstName : profile.name.givenName,
                lastName : profile.name.familyName,
                email : profile.emails[0].value,
                profileImage : profile.photos[0].value,
                isVerified : true,
                googleId : profile.id
            })

            await user.save()
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