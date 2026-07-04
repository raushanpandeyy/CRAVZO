import { admin, isFirebaseAdminReady } from "../config/firebaseAdmin.js";
import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { signToken } from "../utils/jwt.js";
import { sanitizeUser } from "../utils/userResponse.js";

const createAuthPayload = (user) => ({
  sub: user.id,
  role: user.role,
  status: user.status,
  email: user.email,
});

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const firebaseAuth = async (req, res) => {
  if (!isFirebaseAdminReady()) {
    throw new ApiError(500, "Firebase Admin is not configured on the server");
  }

  const { idToken, name } = req.body;
  if (!idToken) {
    throw new ApiError(400, "Firebase ID token is required");
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new ApiError(400, "No email associated with this Firebase account");
  }

  if (!decoded.email_verified) {
    throw new ApiError(403, "Email not verified with Firebase. Please verify your email first.");
  }

  const firebaseName = decoded.name || name || email.split("@")[0] || "User";

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.status === "BLOCKED") {
      throw new ApiError(403, "Account blocked");
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: firebaseName,
        role: ROLES.CUSTOMER,
        status: "ACTIVE",
      },
    });
  }

  const token = signToken(createAuthPayload(user));
  setAuthCookie(res, token);

  res.status(200).json(
    apiResponse({
      message: "Firebase authentication successful",
      data: { user: sanitizeUser(user), token },
    })
  );
};
