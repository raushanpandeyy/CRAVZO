const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isOnline: user.isOnline,
  latitude: user.latitude,
  longitude: user.longitude,
  status: user.status,
  avatarUrl: user.avatarUrl,
  riderOnboarding: user.riderOnboarding,
  vendorOnboarding: user.vendorOnboarding,
  bankDetails: user.bankDetails,
  vehicleDetails: user.vehicleDetails,
  paymentMethods: user.paymentMethods,
  referralCode: user.referralCode,
  walletBalance: user.walletBalance,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export { sanitizeUser };
