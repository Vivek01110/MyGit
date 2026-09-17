import app from "./app.js";
import dns from "node:dns";
import { PORT } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
// MongoDB connection failed: querySrv ECONNREFUSED _mongodb._tcp.cluster0.yvy7mo0.mongodb.net
const startServer = async () => {

    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`MyGit server running on port ${PORT}`);
    });
};

startServer();