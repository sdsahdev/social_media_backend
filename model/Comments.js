const mongoose = require("mongoose")

const CommectSchema =new  mongoose.Schema({
    comment:{
        type:String,
        max:200
    },
    userId:{
        type:String,
        require:true,
    },
    username:{
        type:String,
        required:true
    },
    postId:{
        type:String,
        required:true
    },
   
}, {timestamps:true})

module.exports = mongoose.model("Comment", CommectSchema)