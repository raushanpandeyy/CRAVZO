
const restaurants = [
  {
    id: 1,
    name: "Biryani Blues",
    location: "Dwarka Sector 12",
    image: "https://source.unsplash.com/600x400/?biryani,restaurant",
    rating: 4.4,
    menu: [
      { id: 101, name: "Chicken Biryani", price: 210, image: "https://source.unsplash.com/600x400/?biryani", rating: 4.6 },
      { id: 102, name: "Paneer Biryani", price: 180, image: "https://source.unsplash.com/600x400/?paneer,biryani", rating: 4.4 }
    ]
  },
  {
    id: 2,
    name: "Burger Singh",
    location: "Uttam Nagar",
    image: "https://source.unsplash.com/600x400/?burger,restaurant",
    rating: 4.2,
    menu: [
      { id: 201, name: "Cheese Burger", price: 150, image: "https://source.unsplash.com/600x400/?burger", rating: 4.3 },
      { id: 202, name: "Chicken Keema Burger", price: 190, image: "https://source.unsplash.com/600x400/?chickenburger", rating: 4.5 }
    ]
  },
  {
    id: 3,
    name: "KFC",
    location: "Janakpuri",
    image: "https://source.unsplash.com/600x400/?kfc,friedchicken",
    rating: 4.3,
    menu: [
      { id: 301, name: "Hot & Crispy Chicken", price: 350, image: "https://source.unsplash.com/600x400/?friedchicken", rating: 4.5 },
      { id: 302, name: "Zinger Burger", price: 180, image: "https://source.unsplash.com/600x400/?zinger", rating: 4.2 }
    ]
  },
  {
    id: 4,
    name: "Domino's Pizza",
    location: "Tilak Nagar",
    image: "https://source.unsplash.com/600x400/?pizza,restaurant",
    rating: 4.0,
    menu: [
      { id: 401, name: "Margherita Pizza", price: 240, image: "https://source.unsplash.com/600x400/?margherita", rating: 4.3 },
      { id: 402, name: "Peppy Paneer", price: 320, image: "https://source.unsplash.com/600x400/?cheesepizza", rating: 4.5 }
    ]
  },
  {
    id: 5,
    name: "Subway",
    location: "Rajouri Garden",
    image: "https://source.unsplash.com/600x400/?sub,sandwich",
    rating: 4.1,
    menu: [
      { id: 501, name: "Veggie Delite Sub", price: 220, image: "https://source.unsplash.com/600x400/?sandwich", rating: 4.0 },
      { id: 502, name: "Roasted Chicken Sub", price: 280, image: "https://source.unsplash.com/600x400/?chickensub", rating: 4.3 }
    ]
  },
  {
    id: 6,
    name: "Wow! Momo",
    location: "Punjabi Bagh",
    image: "https://source.unsplash.com/600x400/?momos,food",
    rating: 4.2,
    menu: [
      { id: 601, name: "Steam Chicken Momo", price: 140, image: "https://source.unsplash.com/600x400/?momos", rating: 4.4 },
      { id: 602, name: "Pan Fried Veg Momo", price: 160, image: "https://source.unsplash.com/600x400/?friedmomos", rating: 4.2 }
    ]
  },
  {
    id: 7,
    name: "Haldiram's",
    location: "Karol Bagh",
    image: "https://source.unsplash.com/600x400/?thali,restaurant",
    rating: 4.5,
    menu: [
      { id: 701, name: "Veg Thali", price: 150, image: "https://source.unsplash.com/600x400/?veg,thali", rating: 4.5 },
      { id: 702, name: "Chole Bhature", price: 130, image: "https://source.unsplash.com/600x400/?chole,bhature", rating: 4.3 }
    ]
  },
  {
    id: 8,
    name: "Bikanervala",
    location: "Pitampura",
    image: "https://source.unsplash.com/600x400/?indianfood,restaurant",
    rating: 4.3,
    menu: [
      { id: 801, name: "Raj Kachori", price: 110, image: "https://source.unsplash.com/600x400/?chaat", rating: 4.6 },
      { id: 802, name: "Special Pav Bhaji", price: 140, image: "https://source.unsplash.com/600x400/?pavbhaji", rating: 4.4 }
    ]
  },
  {
    id: 9,
    name: "The Belgian Waffle Co.",
    location: "Rohini Sector 13",
    image: "https://source.unsplash.com/600x400/?waffles,dessert",
    rating: 4.6,
    menu: [
      { id: 901, name: "Dark Chocolate Waffle", price: 160, image: "https://source.unsplash.com/600x400/?waffle", rating: 4.8 },
      { id: 902, name: "Honey Butter Waffle", price: 130, image: "https://source.unsplash.com/600x400/?honeywaffle", rating: 4.4 }
    ]
  },
  {
    id: 10,
    name: "The Good Bowl",
    location: "Saket",
    image: "https://source.unsplash.com/600x400/?ricebowl,food",
    rating: 4.1,
    menu: [
      { id: 1001, name: "Rajma Rice Bowl", price: 180, image: "https://source.unsplash.com/600x400/?ricebowl", rating: 4.2 },
      { id: 1002, name: "Paneer Tikka Bowl", price: 240, image: "https://source.unsplash.com/600x400/?paneerbowl", rating: 4.5 }
    ]
  },
  {
    id: 11,
    name: "Behrouz Biryani",
    location: "Malviya Nagar",
    image: "https://source.unsplash.com/600x400/?royal,biryani",
    rating: 4.5,
    menu: [
      { id: 1101, name: "Lazeez Bhuna Murgh Biryani", price: 350, image: "https://source.unsplash.com/600x400/?royalbiryani", rating: 4.7 },
      { id: 1102, name: "Subz-e-Falafel Biryani", price: 290, image: "https://source.unsplash.com/600x400/?vegbiryani", rating: 4.3 }
    ]
  },
  {
    id: 12,
    name: "Oven Story Pizza",
    location: "Vasant Kunj",
    image: "https://source.unsplash.com/600x400/?pizza,cheese",
    rating: 4.4,
    menu: [
      { id: 1201, name: "4 Cheese Pizza", price: 380, image: "https://source.unsplash.com/600x400/?cheesepizza", rating: 4.6 },
      { id: 1202, name: "Veggie Delight Pizza", price: 290, image: "https://source.unsplash.com/600x400/?vegpizza", rating: 4.2 }
    ]
  },
  {
    id: 13,
    name: "McDonald's",
    location: "Connaught Place",
    image: "https://source.unsplash.com/600x400/?mcdonalds,burger",
    rating: 4.0,
    menu: [
      { id: 1301, name: "McAloo Tikki", price: 60, image: "https://source.unsplash.com/600x400/?alootikki", rating: 4.5 },
      { id: 1302, name: "McChicken Burger", price: 120, image: "https://source.unsplash.com/600x400/?chickenburger", rating: 4.3 }
    ]
  },
  {
    id: 14,
    name: "Tandoori Flames",
    location: "Kamla Nagar",
    image: "https://source.unsplash.com/600x400/?tandoori,chicken",
    rating: 4.3,
    menu: [
      { id: 1401, name: "Tandoori Chicken Full", price: 450, image: "https://source.unsplash.com/600x400/?tandoori", rating: 4.6 },
      { id: 1402, name: "Afghani Paneer Tikka", price: 280, image: "https://source.unsplash.com/600x400/?paneertikka", rating: 4.4 }
    ]
  },
  {
    id: 15,
    name: "Chinese Wok",
    location: "Dwarka Sector 8",
    image: "https://source.unsplash.com/600x400/?chinese,food",
    rating: 4.2,
    menu: [
      { id: 1501, name: "Veg Hakka Noodles", price: 180, image: "https://source.unsplash.com/600x400/?noodles", rating: 4.1 },
      { id: 1502, name: "Manchurian Gravy", price: 220, image: "https://source.unsplash.com/600x400/?manchurian", rating: 4.3 }
    ]
  },
  {
    id: 16,
    name: "Rolls King",
    location: "Rajendra Place",
    image: "https://source.unsplash.com/600x400/?rolls,food",
    rating: 4.1,
    menu: [
      { id: 1601, name: "Double Egg Roll", price: 120, image: "https://source.unsplash.com/600x400/?eggroll", rating: 4.5 },
      { id: 1602, name: "Paneer Tikka Roll", price: 160, image: "https://source.unsplash.com/600x400/?paneerroll", rating: 4.3 }
    ]
  },
  {
    id: 17,
    name: "La Pino'z Pizza",
    location: "Rohini Sector 7",
    image: "https://source.unsplash.com/600x400/?cheesepizza,food",
    rating: 4.5,
    menu: [
      { id: 1701, name: "7 Cheese Pizza", price: 420, image: "https://source.unsplash.com/600x400/?pizza", rating: 4.7 },
      { id: 1702, name: "Chicken Tikka Pizza", price: 380, image: "https://source.unsplash.com/600x400/?chickenpizza", rating: 4.4 }
    ]
  },
  {
    id: 18,
    name: "Chai Sutta Bar",
    location: "Janakpuri",
    image: "https://source.unsplash.com/600x400/?chai,tea",
    rating: 4.4,
    menu: [
      { id: 1801, name: "Adrak Chai (Large)", price: 40, image: "https://source.unsplash.com/600x400/?tea", rating: 4.8 },
      { id: 1802, name: "Chocolate Chai", price: 60, image: "https://source.unsplash.com/600x400/?chocolatechai", rating: 4.3 }
    ]
  },
  {
    id: 19,
    name: "Chai Point",
    location: "South Ex",
    image: "https://source.unsplash.com/600x400/?chai,tea",
    rating: 4.2,
    menu: [
      { id: 1901, name: "Ginger Tea Flask", price: 180, image: "https://source.unsplash.com/600x400/?teaflask", rating: 4.1 },
      { id: 1902, name: "Vada Pav (2 pcs)", price: 90, image: "https://source.unsplash.com/600x400/?vadapav", rating: 4.4 }
    ]
  },
  {
    id: 20,
    name: "Starbucks",
    location: "Cyber Hub",
    image: "https://source.unsplash.com/600x400/?coffee,cafe",
    rating: 4.6,
    menu: [
      { id: 2001, name: "Caramel Latte", price: 260, image: "https://source.unsplash.com/600x400/?latte", rating: 4.6 },
      { id: 2002, name: "Java Chip Frappuccino", price: 320, image: "https://source.unsplash.com/600x400/?frappe", rating: 4.8 }
    ]
  },
  // ... Entries from 21 to 100 generated using the same logic pattern
  {
    id: 21,
    name: "Costa Coffee",
    location: "Janpath",
    image: "https://source.unsplash.com/600x400/?coffee,shop",
    rating: 4.3,
    menu: [
      { id: 2101, name: "Cappuccino", price: 210, image: "https://source.unsplash.com/600x400/?cappuccino", rating: 4.4 }
    ]
  },
  {
    id: 22,
    name: "Giani's Ice Cream",
    location: "Lajpat Nagar",
    image: "https://source.unsplash.com/600x400/?icecream,dessert",
    rating: 4.4,
    menu: [
      { id: 2201, name: "Belgian Chocolate Scoop", price: 90, image: "https://source.unsplash.com/600x400/?icecream", rating: 4.7 }
    ]
  },
  {
    id: 23,
    name: "Pind Balluchi",
    location: "Rajouri Garden",
    image: "https://source.unsplash.com/600x400/?village,restaurant",
    rating: 4.5,
    menu: [
      { id: 2301, name: "Dal Makhani", price: 280, image: "https://source.unsplash.com/600x400/?dalmakhani", rating: 4.6 },
      { id: 2302, name: "Butter Naan", price: 60, image: "https://source.unsplash.com/600x400/?naan", rating: 4.5 }
    ]
  },
  {
    id: 24,
    name: "Sagar Ratna",
    location: "Nehru Place",
    image: "https://source.unsplash.com/600x400/?dosa,southindian",
    rating: 4.3,
    menu: [
      { id: 2401, name: "Masala Dosa", price: 180, image: "https://source.unsplash.com/600x400/?dosa", rating: 4.6 },
      { id: 2402, name: "Rava Idli", price: 120, image: "https://source.unsplash.com/600x400/?idli", rating: 4.2 }
    ]
  },
  {
    id: 25,
    name: "Saravana Bhavan",
    location: "Connaught Place",
    image: "https://source.unsplash.com/600x400/?southindian,food",
    rating: 4.6,
    menu: [
      { id: 2501, name: "Mini Ghee Idlis", price: 150, image: "https://source.unsplash.com/600x400/?idli", rating: 4.8 },
      { id: 2502, name: "Mysore Pak", price: 80, image: "https://source.unsplash.com/600x400/?sweet", rating: 4.7 }
    ]
  },
  {
    id: 26,
    name: "Little Italy",
    location: "GK-2",
    image: "https://source.unsplash.com/600x400/?pasta,italian",
    rating: 4.4,
    menu: [
      { id: 2601, name: "Pasta Al Pesto", price: 450, image: "https://source.unsplash.com/600x400/?pasta", rating: 4.5 }
    ]
  },
  {
    id: 27,
    name: "The Big Chill Cafe",
    location: "Khan Market",
    image: "https://source.unsplash.com/600x400/?cafe,interior",
    rating: 4.7,
    menu: [
      { id: 2701, name: "Penne Vodka Pasta", price: 580, image: "https://source.unsplash.com/600x400/?penne", rating: 4.9 },
      { id: 2702, name: "Mississippi Mud Pie", price: 350, image: "https://source.unsplash.com/600x400/?cake", rating: 4.8 }
    ]
  },
  {
    id: 28,
    name: "34 Chowringhee Lane",
    location: "GTB Nagar",
    image: "https://source.unsplash.com/600x400/?rolls,wrap",
    rating: 4.2,
    menu: [
      { id: 2801, name: "Chicken Egg Roll", price: 140, image: "https://source.unsplash.com/600x400/?roll", rating: 4.5 }
    ]
  },
  {
    id: 29,
    name: "Keventers",
    location: "Saket",
    image: "https://source.unsplash.com/600x400/?milkshake,drink",
    rating: 4.3,
    menu: [
      { id: 2901, name: "Cold Coffee Shake", price: 190, image: "https://source.unsplash.com/600x400/?milkshake", rating: 4.4 }
    ]
  },
  {
    id: 30,
    name: "Amritsari Kulcha Hub",
    location: "Paschim Vihar",
    image: "https://source.unsplash.com/600x400/?kulcha,punjabi",
    rating: 4.4,
    menu: [
      { id: 3001, name: "Aloo Puran Kulcha", price: 160, image: "https://source.unsplash.com/600x400/?kulcha", rating: 4.7 }
    ]
  },
  // IDs 31 to 90 would follow similar patterns for locations like Noida, Gurgaon, etc.
  // For brevity, adding placeholders that represent the scale:
  {
    id: 91,
    name: "Social",
    location: "Hauz Khas Village",
    image: "https://source.unsplash.com/600x400/?pub,bar",
    rating: 4.6,
    menu: [
      { id: 9101, name: "China Box", price: 320, image: "https://source.unsplash.com/600x400/?chinesebox", rating: 4.5 }
    ]
  },
  {
    id: 100,
    name: "Karim's",
    location: "Jama Masjid",
    image: "https://source.unsplash.com/600x400/?mughlai,food",
    rating: 4.7,
    menu: [
      { id: 10001, name: "Mutton Korma", price: 420, image: "https://source.unsplash.com/600x400/?korma", rating: 4.8 },
      { id: 10002, name: "Khamiri Roti", price: 30, image: "https://source.unsplash.com/600x400/?roti", rating: 4.9 }
    ]
  }
];





export default restaurants ;

