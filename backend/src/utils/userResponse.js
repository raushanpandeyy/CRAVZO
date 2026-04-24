const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
<<<<<<< HEAD
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
=======
  status: user.status,
  avatarUrl: user.avatarUrl,
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export { sanitizeUser };
