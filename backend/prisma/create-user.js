import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const pass = await bcrypt.hash("Test@123", 12);
const user = await prisma.user.upsert({
  where: { email: "bacardiblack35@gmail.com" },
  update: { name: "Raushan", passwordHash: pass, role: "CUSTOMER", status: "ACTIVE" },
  create: { name: "Raushan", email: "bacardiblack35@gmail.com", passwordHash: pass, role: "CUSTOMER", status: "ACTIVE" },
});
console.log("Created:", user.email, "/ Test@123");
await prisma.$disconnect();
