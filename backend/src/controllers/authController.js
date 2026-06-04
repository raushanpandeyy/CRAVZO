import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import { generateOTP } from "../services/otpService.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { emailBloomFilter, otpBloomFilter } from "../utils/bloomFilter.js";
import { signToken } from "../utils/jwt.js";
import { sendOTP } from "../utils/sendOtp.js";
import { sanitizeUser } from "../utils/userResponse.js";
import {
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  sendOtpSchema,
  signUpSchema,
  verifyOtpSchema,
} from "../validators/authValidators.js";

const AUTH_COOKIE_NAME = "token";
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const getUserStatusForRole = (role) => {
  return role === ROLES.CUSTOMER || role === ROLES.VENDOR ? "ACTIVE" : "PENDING";
};

const getOtpPurposeForRole = (role) => {
  if (role === ROLES.CUSTOMER) {
    return "CUSTOMER_SIGNUP";
  }

  if (role === ROLES.RIDER) {
    return "RIDER_ONBOARDING";
  }

  return "VENDOR_ONBOARDING";
};

const createAuthPayload = (user) => ({
  sub: user.id,
  role: user.role,
  status: user.status,
  email: user.email,
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

const createOtpRecord = async ({ email, role, purpose = getOtpPurposeForRole(role), pendingSignupData = null }) => {
  // Bloom filter Use Case 3: OTP spam prevention
  // If same email requested OTP within last 2 minutes, throttle it.
  // This runs before bcrypt.hash so it's very fast.
  const recentlySent = await otpBloomFilter.wasRecentlySent(email);
  if (recentlySent) {
    throw new ApiError(429, "OTP recently sent. Please wait a moment before requesting again.");
  }

  const otp = generateOTP();
  const codeHash = await bcrypt.hash(otp, 10);

  await prisma.otpVerification.create({
    data: {
      id: crypto.randomUUID(),
      email,
      purpose,
      codeHash,
      pendingSignupData,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      updatedAt: new Date(),
      lastSentAt: new Date(),
    },
  });

  // Mark email as having received OTP just now
  await otpBloomFilter.markSent(email);

  try {
    const response = await sendOTP(email, otp);
    console.log("OTP sent:", response);
  } catch (error) {
    console.error("OTP sending failed:", error.message);
  }
};

export const sendOtpController = async (req, res) => {
  const payload = sendOtpSchema.parse(req.body);
  const email = payload.email.toLowerCase();
  const role = payload.role;
  const purpose = getOtpPurposeForRole(role);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const pendingSignup = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!user && !pendingSignup?.pendingSignupData) {
    throw new ApiError(404, "Start signup first, then request OTP");
  }

  if (user && user.role !== role) {
    throw new ApiError(400, "OTP role does not match the registered account");
  }

  await createOtpRecord({
    email,
    role,
    purpose,
    pendingSignupData: pendingSignup?.pendingSignupData || null,
  });

  res.status(200).json(
    apiResponse({
      message: "OTP sent successfully",
      data: {
        email,
        role,
      },
    })
  );
};

export const verifyOtpController = async (req, res) => {
  const payload = verifyOtpSchema.parse(req.body);
  const email = payload.email.toLowerCase();
  const otp = payload.otp;
  const role = payload.role;
  const purpose = getOtpPurposeForRole(role);

  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "OTP not found");
  }

  if (record.expiresAt < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  const isValid = await bcrypt.compare(otp, record.codeHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: {
        attemptCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    throw new ApiError(400, "Invalid OTP");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.role !== role) {
    throw new ApiError(400, "OTP role does not match the registered account");
  }

  let user = existingUser;

  if (!user) {
    if (!record.pendingSignupData) {
      throw new ApiError(404, "Signup session not found. Please sign up again.");
    }

    const pendingPhone = record.pendingSignupData.phone || null;
    const conflictingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(pendingPhone ? [{ phone: pendingPhone }] : [])],
      },
    });

    if (conflictingUser) {
      throw new ApiError(409, "User already exists");
    }

    user = await prisma.user.create({
      data: {
        name: record.pendingSignupData.name,
        email,
        phone: pendingPhone,
        passwordHash: record.pendingSignupData.passwordHash,
        role: record.pendingSignupData.role,
        status: getUserStatusForRole(record.pendingSignupData.role),
        vendorOnboarding:
          record.pendingSignupData.role === ROLES.VENDOR ? record.pendingSignupData.onboardingData || null : undefined,
        riderOnboarding:
          record.pendingSignupData.role === ROLES.RIDER ? record.pendingSignupData.onboardingData || null : undefined,
        onboardingSubmittedAt:
          record.pendingSignupData.role === ROLES.VENDOR || record.pendingSignupData.role === ROLES.RIDER
            ? new Date()
            : undefined,
      },
    });
    // Bloom filter: register this email so future signup attempts skip DB query
    emailBloomFilter.add(email);
  } else if (user.status === "PENDING" && user.role === ROLES.CUSTOMER) {
    user = await prisma.user.update({
      where: { email },
      data: {
        status: "ACTIVE",
      },
    });
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: {
      verifiedAt: new Date(),
      usedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const token = signToken(createAuthPayload(user));
  setAuthCookie(res, token);

  res.status(200).json(
    apiResponse({
      message: "OTP verified. Account activated.",
      data: {
        user: sanitizeUser(user),
        token,
      },
    })
  );
};

export const signUp = async (req, res) => {
  const payload = signUpSchema.parse(req.body);
  const email = payload.email.toLowerCase();
  const phone = payload.phone?.trim() || null;
  const role = payload.role || ROLES.CUSTOMER;

  // Bloom filter check — Use Case 1:
  // If filter says "definitely not registered" → skip DB query entirely.
  // If filter says "probably registered" → confirm with DB (handles false positives).
  const mightBeRegistered = await emailBloomFilter.mightExist(email);

  if (mightBeRegistered) {
    // Only hit DB if bloom filter thinks email might exist
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }
  }
  // If mightBeRegistered === false → bloom filter guarantees email is new,
  // skip the DB query completely — saves ~5ms per new signup

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const pendingSignupData = {
    name: payload.name.trim(),
    email,
    phone,
    passwordHash,
    role,
    onboardingData: payload.onboardingData || null,
  };

  await createOtpRecord({ email, role, pendingSignupData });

  res.status(201).json(
    apiResponse({
      message: "OTP sent to email. Verify it to create your account.",
      data: { email, role },
    })
  );
};

export const requestPasswordReset = async (req, res) => {
  const payload = requestPasswordResetSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || (payload.role && user.role !== payload.role)) {
    throw new ApiError(404, "Account not found for this email");
  }

  await createOtpRecord({
    email,
    role: user.role,
    purpose: "PASSWORD_RESET",
  });

  res.status(200).json(
    apiResponse({
      message: "Password reset OTP sent successfully",
      data: {
        email,
        role: user.role,
      },
    })
  );
};

export const resetPassword = async (req, res) => {
  const payload = resetPasswordSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || (payload.role && user.role !== payload.role)) {
    throw new ApiError(404, "Account not found for this email");
  }

  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose: "PASSWORD_RESET",
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "OTP not found");
  }

  if (record.expiresAt < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  const isValid = await bcrypt.compare(payload.otp, record.codeHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: {
        attemptCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    throw new ApiError(400, "Invalid OTP");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: {
        passwordHash,
      },
    }),
    prisma.otpVerification.update({
      where: { id: record.id },
      data: {
        verifiedAt: new Date(),
        usedAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  res.status(200).json(
    apiResponse({
      message: "Password reset successfully. You can login now.",
    })
  );
};

export const login = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === "BLOCKED") {
    throw new ApiError(403, "Account blocked");
  }

  if (user.role === ROLES.CUSTOMER && user.status === "PENDING") {
    throw new ApiError(403, "Verify your OTP before logging in");
  }

  const token = signToken(createAuthPayload(user));
  setAuthCookie(res, token);

  res.status(200).json(
    apiResponse({
      message: "Login successful",
      data: {
        user: sanitizeUser(user),
        token,
      },
    })
  );
};

export const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(
    apiResponse({
      message: "Authenticated user fetched",
      data: {
        user: sanitizeUser(user),
      },
    })
  );
};

export const logout = async (_req, res) => {
  clearAuthCookie(res);

  res.status(200).json(
    apiResponse({
      message: "Logout successful",
    })
  );
};
