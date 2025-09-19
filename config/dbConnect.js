const mongoose = require("mongoose")

async function connectDatabase(){
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Mongo Database Connected")
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    connectDatabase
}