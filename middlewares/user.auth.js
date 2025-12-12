const User = require("../models/user.model.js");

const checkSession = async (req, res, next) => {
   
      try {
        if(req.user){
          let isUserBlocked = await User.find({_id : req.user._id},{isBlocked : 1})
          if(!isUserBlocked[0].isBlocked){
            next()
          }else{
            req.logout((err) => {
              if(err){
                next(err)
              }
               req.session.message = "You have been Blocked by the Admin, Contact the Administration"
              return res.redirect("/login")
            })
             
            }
            
        }else if(req.session.user) {
          let isUserBlocked = await User.find({_id : req.session.user._id},{isBlocked : 1})
          if(!isUserBlocked[0].isBlocked){
            next()
          }else{
            req.session.user = null
            req.session.message = "You have been Blocked by the Admin, Contact the Administration"
            return  res.redirect("/login");
            }
        } else {
          return res.redirect("/login");
        }
      } catch (error) {
        console.log(error)
      }
  };
  
  const isLogged = (req, res, next) => {
    if (req.user||req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
  };

  const otpSession = (req, res, next) => {
    if (req.session.otpUser) {
      next()
    } else {
      res.redirect("/login")
    }
  };
  module.exports = {
    checkSession,
    isLogged,
    otpSession
  };