const passport = require("passport")
const GoogleStrategy = require("passport-google-oidc")
const User = require("../models/user.model")
require("dotenv").config()

passport.use( new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENTID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "/oauth/redirect/google"
},
async function(){

}))