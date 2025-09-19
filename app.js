const express = require("express")
const session = require("express-session")
require("dotenv").config()
const app = express()



const PORT = process.env.PORT || 1349
app.listen(PORT,(error) => {
    try {
        console.log(`Server connected @ ${PORT}`)
    } catch (error) {
        console.log(error)
    }
})