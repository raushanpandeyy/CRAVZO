import 'dotenv/config';
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";


const PORT = env.PORT || process.env.PORT || 8080;

await connectRedis();

const { app } = await import("./app.js");

app.listen(PORT, () => {
  console.log(`CRAVZO backend running on port ${PORT}`);
});
