<<<<<<< HEAD
import 'dotenv/config';
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
import { app } from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT || process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`CRAVZO backend running on port ${PORT}`);
});
