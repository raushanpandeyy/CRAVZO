import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleRestaurants = [
  {
    name: "Biryani Blues",
    slug: "biryani-blues",
    description: "Fresh dum biryani bowls and kebab combos.",
    cuisine: "Biryani",
    phone: "9876500001",
    addressLine1: "Sector 12 Market",
    city: "Dwarka",
    state: "Delhi",
    postalCode: "110078",
    // FIX: Naya working URL + fm=webp force kiya hai (Size and format optimized)
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fm=webp&fit=crop&w=400&q=70",
    isOpen: true,
    menuItems: [
      { name: "Chicken Biryani", description: "Classic dum biryani with raita", category: "Biryani", price: 210, isVeg: false },
      { name: "Paneer Biryani", description: "Paneer dum biryani", category: "Biryani", price: 180, isVeg: true },
      { name: "Chicken Kebab", description: "Juicy kebabs on skewers", category: "Sides", price: 160, isVeg: false },
    ],
  },
  {
    name: "Burger Singh",
    slug: "burger-singh",
    description: "Loaded burgers, fries, and sauces.",
    cuisine: "Burgers",
    phone: "9876500002",
    addressLine1: "Uttam Nagar Main Road",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110059",
    // FIX: fm=webp force kiya aur width 400px ki taaki search drop-down freeze na ho
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fm=webp&fit=crop&w=400&q=70",
    isOpen: true,
    menuItems: [
      { name: "Cheese Burger", description: "Cheesy grilled burger", category: "Burgers", price: 150, isVeg: true },
      { name: "Chicken Keema Burger", description: "Spiced keema patty burger", category: "Burgers", price: 190, isVeg: false },
      { name: "Peri Peri Fries", description: "Crispy seasoned fries", category: "Sides", price: 110, isVeg: true },
    ],
  },
  {
    name: "South Spice",
    slug: "south-spice",
    description: "Dosas, idlis, and filter coffee.",
    cuisine: "South Indian",
    phone: "9876500003",
    addressLine1: "Nehru Place Plaza",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110019",
    // FIX: fm=webp force kiya aur width 400px ki
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fm=webp&fit=crop&w=400&q=70",
    isOpen: true,
    menuItems: [
      { name: "Masala Dosa", description: "Crispy dosa with potato masala", category: "Main Course", price: 180, isVeg: true },
      { name: "Rava Idli", description: "Soft idli with chutney", category: "Breakfast", price: 120, isVeg: true },
      { name: "Filter Coffee", description: "Fresh filter coffee", category: "Beverages", price: 70, isVeg: true },
    ],
  },
];



async function main() {
  const adminEmail = "admin@cravzo.com";
  const adminPassword = "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const vendorPasswordHash = await bcrypt.hash("Vendor@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "CRAVZO Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "CRAVZO Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const vendor = await prisma.user.upsert({
    where: { email: "seedvendor@cravzo.com" },
    update: {
      name: "Seed Vendor",
      phone: "9876500010",
      passwordHash: vendorPasswordHash,
      role: "VENDOR",
      status: "ACTIVE",
    },
    create: {
      name: "Seed Vendor",
      email: "seedvendor@cravzo.com",
      phone: "9876500010",
      passwordHash: vendorPasswordHash,
      role: "VENDOR",
      status: "ACTIVE",
    },
  });

  for (const restaurantSeed of sampleRestaurants) {
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: restaurantSeed.slug },
      update: {
        vendorId: vendor.id,
        name: restaurantSeed.name,
        description: restaurantSeed.description,
        cuisine: restaurantSeed.cuisine,
        phone: restaurantSeed.phone,
        addressLine1: restaurantSeed.addressLine1,
        city: restaurantSeed.city,
        state: restaurantSeed.state,
        postalCode: restaurantSeed.postalCode,
        imageUrl: restaurantSeed.imageUrl,
        status: "ACTIVE",
        isOpen: restaurantSeed.isOpen,
      },
      create: {
        vendorId: vendor.id,
        name: restaurantSeed.name,
        slug: restaurantSeed.slug,
        description: restaurantSeed.description,
        cuisine: restaurantSeed.cuisine,
        phone: restaurantSeed.phone,
        addressLine1: restaurantSeed.addressLine1,
        city: restaurantSeed.city,
        state: restaurantSeed.state,
        postalCode: restaurantSeed.postalCode,
        imageUrl: restaurantSeed.imageUrl,
        status: "ACTIVE",
        isOpen: restaurantSeed.isOpen,
      },
    });

    // 🔥 FIX: delete dependent order items first
    await prisma.orderItem.deleteMany({
      where: {
        menuItem: {
          restaurantId: restaurant.id,
        },
      },
    });

    // then delete menu items
    await prisma.menuItem.deleteMany({
      where: { restaurantId: restaurant.id },
    });

    // recreate menu items
    await prisma.menuItem.createMany({
      data: restaurantSeed.menuItems.map((item) => ({
        restaurantId: restaurant.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        isVeg: item.isVeg,
        status: "ACTIVE",
      })),
    });
  }

  console.log("Seed completed");
  console.log(`Admin email: ${admin.email}`);
  console.log(`Admin password: ${adminPassword}`);
  console.log(`Admin id: ${admin.id}`);
  console.log(`Seed vendor email: ${vendor.email}`);
  console.log("Sample restaurants and menu items seeded");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });