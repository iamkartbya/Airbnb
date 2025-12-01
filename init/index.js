const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

main().then(() => {
    console.log("Connected to DB");
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        initData.data= initData.data.map((obj)=>({...obj,owner: "692382a926f86b6725ff255b"}));
        await Listing.insertMany(initData.data);
        console.log("Database initialized with sample listings");
    } catch (err) {
        console.error("Error inserting data:", err);
    } finally {
        mongoose.connection.close();
    }
};

initDB();
