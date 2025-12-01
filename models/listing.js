const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review=require("./review.js");
const { required } = require("joi");
const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: {
        type: String,
    },
    filename: { type: String },   
},
    price: Number,
    location: String,
    country: String,
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    geometry: {
    type: {
        type: String,
        enum: ['Point'],
        required:true
    },
    coordinates: {
        type: [Number],
        required: true
    },
  },
  category:{
    type:String,
    enum:["mountains","Room","Iconic Cities","Castle","Arctic","Camping","Farms","desert"]
  }
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
      await Review.deleteMany({_id: {$in: listing.reviews}});
    }
   
});
module.exports = mongoose.model("Listing", listingSchema);
