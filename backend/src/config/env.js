import "dotenv/config";
import { z } from "zod";

// Browser check: Kya hum frontend (browser) mein hain?
const isBrowser = typeof window !== "undefined";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().url().default("https://www.dodago.shop"),
  // Frontend par sensitive keys ko optional rakha hai taaki validation fail na ho
  DATABASE_URL: isBrowser ? z.string().optional() : z.string().min(1),
  JWT_SECRET: isBrowser ? z.string().optional() : z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: z.string().min(1).default("otp@dodago.shop"),
  RESEND_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("dodago"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REPLICA_DATABASE_URL: z.string().optional(),
  PGBOUNCER_URL: z.string().optional(),
  ORDER_QUEUE_ENABLED: z.string().optional().default("true"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  RAIN_CHARGE_ENABLED: z.preprocess((value) => value === true || value === "true" || value === "1", z.boolean()).default(false),
  RAIN_CHARGE_AMOUNT: z.coerce.number().default(25),
  SMS_PROVIDER: z.enum(["console", "msg91"]).default("console"),

  // Pricing (Fix 6)
  DELIVERY_BASE_FEE: z.coerce.number().default(33),
  DELIVERY_BASE_KM: z.coerce.number().default(5),
  DELIVERY_PER_KM_RATE: z.coerce.number().default(10),
  GST_RATE: z.coerce.number().default(0.18),
  FOOD_GST_RATE: z.coerce.number().default(0.05),
  DELIVERY_GST_RATE: z.coerce.number().default(0.18),
   PLATFORM_FEE: z.coerce.number().default(0),
   PACKAGING_PERCENT: z.coerce.number().default(0.01),
  RAZORPAY_PERCENT: z.coerce.number().default(0.02),
  COD_CHARGE: z.coerce.number().default(5),
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
