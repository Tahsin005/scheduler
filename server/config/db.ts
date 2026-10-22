import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", async () => {
            console.log("MongoDB is connected");
        })

        mongoose.connection.on("disconnected", async () => {
            console.log("MongoDB is disconnected");
        })

        await mongoose.connect(process.env.MONGODB_URI as string);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;