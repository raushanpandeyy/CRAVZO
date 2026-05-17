import admin from "firebase-admin";

import { env } from "./env.js";

const parseServiceAccount = () => {
  if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    return JSON.parse(decoded);
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
};

const serviceAccount = parseServiceAccount();

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const isFirebaseAdminReady = () => Boolean(serviceAccount && admin.apps.length);

export { admin, isFirebaseAdminReady };
