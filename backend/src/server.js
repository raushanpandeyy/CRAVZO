import 'dotenv/config';
import http from "http";

import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { attachChatSocket } from "./socket/chatSocket.js";


const PORT = env.PORT || process.env.PORT || 8080;

await connectRedis();

const { app } = await import("./app.js");
const server = http.createServer(app);

// Fix #5: attachChatSocket is now async (sets up Redis pub/sub adapter)
await attachChatSocket(server);

server.listen(PORT, () => {
  console.log(`CRAVZO backend running on port ${PORT}`);
});
