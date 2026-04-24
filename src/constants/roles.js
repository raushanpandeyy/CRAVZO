export const ROLES = {
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",
  RIDER: "RIDER",
  ADMIN: "ADMIN",
};

export const roleToAccountType = (role) => {
  switch (role) {
    case ROLES.VENDOR:
      return "vendor";
    case ROLES.RIDER:
      return "rider";
    case ROLES.ADMIN:
      return "admin";
    case ROLES.CUSTOMER:
    default:
      return "customer";
  }
};

export const accountTypeToRole = (accountType) => {
  switch (accountType) {
    case "vendor":
      return ROLES.VENDOR;
    case "rider":
      return ROLES.RIDER;
    case "admin":
      return ROLES.ADMIN;
    case "customer":
    default:
      return ROLES.CUSTOMER;
  }
};
