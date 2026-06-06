import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const restaurants = [
  {
    vendor: { name: "Rahul Sharma", email: "rahul@test.com", phone: "9999999901" },
    restaurant: {
      name: "Punjabi Dhaba",
      slug: "punjabi-dhaba",
      cuisine: "North Indian, Punjabi",
      addressLine1: "MG Road, Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
      isOpen: true,
      status: "ACTIVE",
      latitude: 12.9716,
      longitude: 77.5946,
    },
    menuItems: [
      { name: "Butter Chicken", category: "Main Course", price: 349, imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae6c9?w=200&h=200&fit=crop", isVeg: false },
      { name: "Dal Makhani", category: "Main Course", price: 249, imageUrl: "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=200&h=200&fit=crop", isVeg: true },
      { name: "Butter Naan", category: "Breads", price: 49, imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop", isVeg: true },
      { name: "Gulab Jamun", category: "Desserts", price: 99, imageUrl: "https://images.unsplash.com/photo-1666190050266-af97912ece15?w=200&h=200&fit=crop", isVeg: true },
    ],
  },
  {
    vendor: { name: "Priya Singh", email: "priya@test.com", phone: "9999999902" },
    restaurant: {
      name: "South Indian Express",
      slug: "south-indian-express",
      cuisine: "South Indian, Kerala",
      addressLine1: "100 Feet Road, Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
      isOpen: true,
      status: "ACTIVE",
      latitude: 12.9352,
      longitude: 77.6245,
    },
    menuItems: [
      { name: "Masala Dosa", category: "Breakfast", price: 129, imageUrl: "https://images.unsplash.com/photo-1630383249896-3d7f3d2e5a4c?w=200&h=200&fit=crop", isVeg: true },
      { name: "Idli Sambhar", category: "Breakfast", price: 89, imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&h=200&fit=crop", isVeg: true },
      { name: "Chicken Chettinad", category: "Main Course", price: 399, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=200&fit=crop", isVeg: false },
      { name: "Filter Coffee", category: "Beverages", price: 49, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop", isVeg: true },
    ],
  },
  {
    vendor: { name: "Amit Patel", email: "amit@test.com", phone: "9999999903" },
    restaurant: {
      name: "Mughlai Bites",
      slug: "mughlai-bites",
      cuisine: "Mughlai, Biryani",
      addressLine1: "Brigade Road",
      city: "Bangalore",
      state: "Karnataka",
      imageUrl: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=300&fit=crop",
      isOpen: true,
      status: "ACTIVE",
      latitude: 12.9719,
      longitude: 77.6413,
    },
    menuItems: [
      { name: "Chicken Biryani", category: "Biryani", price: 349, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop", isVeg: false },
      { name: "Mutton Biryani", category: "Biryani", price: 449, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop", isVeg: false },
      { name: "Veg Biryani", category: "Biryani", price: 249, imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&h=200&fit=crop", isVeg: true },
      { name: "Raita", category: "Sides", price: 49, imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop", isVeg: true },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Test@123", 12);

  for (const item of restaurants) {
    const existingVendor = await prisma.user.findUnique({ where: { email: item.vendor.email } });
    if (existingVendor) {
      console.log(`Vendor ${item.vendor.email} already exists, skipping`);
      continue;
    }

    const vendor = await prisma.user.create({
      data: {
        ...item.vendor,
        passwordHash,
        role: "VENDOR",
        status: "ACTIVE",
        onboardingSubmittedAt: new Date(),
        vendorOnboarding: { seeded: true },
      },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        vendorId: vendor.id,
        ...item.restaurant,
        openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        openingTime: "09:00",
        closingTime: "23:00",
      },
    });

    for (const menu of item.menuItems) {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          name: menu.name,
          category: menu.category,
          price: menu.price,
          imageUrl: menu.imageUrl,
          isVeg: menu.isVeg,
          status: "ACTIVE",
        },
      });
    }

    console.log(`Created: ${item.restaurant.name} (${item.menuItems.length} dishes)`);
  }

  console.log("\nSample data added! Login as admin@cravzo.com / Admin@12345");
  console.log("Go to Promotions → Add → select a restaurant → pick a dish");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
