const mongoose = require("mongoose")

const connectDb = async()=>{
  try {
    await mongoose.connect(process.env.DATABASE_URL)
    console.log("Databae Connected Successfully");
    
  } catch (error) {
    console.log("database could not connect" ,error);
    
  }
}

module.exports = connectDb