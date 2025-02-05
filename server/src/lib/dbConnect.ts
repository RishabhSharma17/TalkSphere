import mongoose from "mongoose";

const mongourl:string = "mongodb://localhost:27017/mymongodb"; 

export const dbConnect = async () => {
    try {
        await mongoose.connect(mongourl)
        .then(()=>{
            console.log("✅ MongoDB Connected");
        })
    } catch (error) {
        console.log(error);
    }
};