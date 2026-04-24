import 'dotenv/config';
import { app } from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT || process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`CRAVZO backend running on port ${PORT}`);
});
