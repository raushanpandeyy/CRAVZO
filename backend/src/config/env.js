import { z } from "zod";

// Browser check: Kya hum frontend (browser) mein hain?
const isBrowser = typeof window !== "undefined";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().url().default("https://www.cravzo.shop"),
  // Frontend par sensitive keys ko optional rakha hai taaki validation fail na ho
  DATABASE_URL: isBrowser ? z.string().optional() : z.string().min(1),
  JWT_SECRET: isBrowser ? z.string().optional() : z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: z.string().min(1).default("otp@cravzo.shop"),
  RESEND_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("cravzo"),
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

export { env };
