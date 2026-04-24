<<<<<<< HEAD
import { z } from "zod";

// Browser check: Kya hum frontend (browser) mein hain?
const isBrowser = typeof window !== "undefined";
=======
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().url().default("https://www.cravzo.shop"),
<<<<<<< HEAD
  // Frontend par sensitive keys ko optional rakha hai taaki validation fail na ho
  DATABASE_URL: isBrowser ? z.string().optional() : z.string().min(1),
  JWT_SECRET: isBrowser ? z.string().optional() : z.string().min(16),
=======
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: z.string().min(1).default("otp@cravzo.shop"),
  RESEND_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("cravzo"),
<<<<<<< HEAD
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

// Helper function jo sahi jagah se data uthayega
const getEnvData = () => {
  if (isBrowser) {
    // Agar frontend hai toh Vite ke variables use karein
    return {
      PORT: import.meta.env.VITE_PORT,
      NODE_ENV: import.meta.env.MODE,
      CLIENT_URL: import.meta.env.VITE_CLIENT_URL,
      // Frontend par sensitive secrets nahi bhej rahe
    };
  } else {
    // Agar backend hai toh process.env use karein
    return process.env;
  }
};

// Data parse karein
const env = envSchema.parse(getEnvData());
=======
});

const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER,
});
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

export { env };
