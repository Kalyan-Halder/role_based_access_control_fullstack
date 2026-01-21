import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const URL = process.env.DB as string;

async function connectDB() {
  try {
    await mongoose.connect(URL);
    console.log("MongoDB Connected with Mongoose!");
  } catch (err: any) {
    console.log("Server Unable to connect:", err.message);
    process.exit(1);
  }
}

connectDB();
