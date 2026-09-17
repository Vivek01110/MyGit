import mongoose from "mongoose";
import dns from "dns";
import { MONGODB_URI } from "./env.js";

// Ensure Atlas SRV records resolve smoothly on all network environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if custom DNS not allowed
}

export const connectDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log(
            "MongoDB connected successfully."
        );

    } catch (error) {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
};