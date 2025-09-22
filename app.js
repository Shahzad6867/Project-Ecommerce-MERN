const express = require("express")
const session = require("express-session")
const { connectDatabase } = require("./config/dbConnect")
const adminRoute = require("./routes/admin.route")
const userRoute = require("./routes/user.route")
const path = require("path")
require("dotenv").config()
const app = express()

app.set("view-engine","ejs")
app.set("views",path.join(__dirname,"/views"))

//Middlewares
app.use(session({
    secret : "novamartSecretKey",
    resave : false,
    saveUninitialized : false,
    cookie : {
        maxAge : 5 * 60 * 1000
    }
}))

app.use((req,res,next) => {
    res.set("Cache-Control","no-store,no-cache,must-revalidate,private"),
    res.set("Pragma","no-cache"),
    res.set("Expires","0"),
    next()
})

app.use(express.urlencoded({extended : true}))
app.use(express.json())
app.use(express.static("public"))
app.use("/admin",adminRoute)
app.use("/",userRoute)
app.use((req,res,next) => {
    res.send("<h1>404 Page is being Built</h1>")
})

connectDatabase()
const PORT = process.env.PORT || 1349
app.listen(PORT,(error) => {
    try {
        console.log(`Server connected @ ${PORT}`)
    } catch (error) {
        console.log(error)
    }
})