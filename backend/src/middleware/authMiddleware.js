import { prisma } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { verifyToken } from "../utils/jwt.js";

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isOnline: true,
      latitude: true,
      longitude: true,
      status: true,
      name: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "User linked to this token no longer exists");
  }

  if (user.status === "BLOCKED") {
    throw new ApiError(403, "Your account has been blocked");
  }

  req.user = {
    sub: user.id,
    email: user.email,
    role: user.role,
    isOnline: user.isOnline,
    latitude: user.latitude,
    longitude: user.longitude,
    status: user.status,
    name: user.name,
  };
  next();
});

const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

export { authenticate, authorize };
