export const ROLES = {
  CUSTOMER: "customer",
  VENDOR: "vendor",
  RIDER: "rider",
  ADMIN: "admin",
};

export const roleToAccountType = (role) => role?.toLowerCase() || "";

export const accountTypeToRole = (accountType) => accountType?.toLowerCase() || "";
