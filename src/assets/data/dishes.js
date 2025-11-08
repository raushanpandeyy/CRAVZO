const dishesData = [
  { id: 1, name: "Chicken Biryani", restaurant: "Biryani Blues", price: "₹210", image: "https://source.unsplash.com/600x400/?biryani", rating: 4.6 },
  { id: 2, name: "Paneer Biryani", restaurant: "Biryani Blues", price: "₹180", image: "https://source.unsplash.com/600x400/?paneer,biryani", rating: 4.4 },
  { id: 3, name: "Mutton Biryani", restaurant: "Behrouz Biryani", price: "₹330", image: "https://source.unsplash.com/600x400/?mutton,biryani", rating: 4.7 },
  { id: 4, name: "Veg Thali", restaurant: "Haldiram's", price: "₹150", image: "https://source.unsplash.com/600x400/?veg,thali", rating: 4.5 },
  { id: 5, name: "Chole Bhature", restaurant: "Haldiram's", price: "₹130", image: "https://source.unsplash.com/600x400/?chole,bhature", rating: 4.3 },
  { id: 6, name: "Masala Dosa", restaurant: "Saravana Bhavan", price: "₹160", image: "https://source.unsplash.com/600x400/?dosa", rating: 4.6 },
  { id: 7, name: "Idli Sambar", restaurant: "Sagar Ratna", price: "₹90", image: "https://source.unsplash.com/600x400/?idli,sambar", rating: 4.2 },
  { id: 8, name: "Paneer Butter Masala", restaurant: "Pind Balluchi", price: "₹260", image: "https://source.unsplash.com/600x400/?paneer,gravy", rating: 4.5 },
  { id: 9, name: "Butter Chicken", restaurant: "Karim's", price: "₹350", image: "https://source.unsplash.com/600x400/?butter,chicken", rating: 4.7 },
  { id: 10, name: "Tandoori Chicken", restaurant: "Tandoori Flames", price: "₹320", image: "https://source.unsplash.com/600x400/?tandoori,chicken", rating: 4.6 },

  // PIZZA & BURGER
  { id: 11, name: "Cheese Burst Pizza", restaurant: "La Pino'z Pizza", price: "₹420", image: "https://source.unsplash.com/600x400/?cheese,pizza", rating: 4.5 },
  { id: 12, name: "Margherita Pizza", restaurant: "Domino's Pizza", price: "₹190", image: "https://source.unsplash.com/600x400/?margherita,pizza", rating: 4.2 },
  { id: 13, name: "Veg Loaded Pizza", restaurant: "Oven Story Pizza", price: "₹350", image: "https://source.unsplash.com/600x400/?veg,pizza", rating: 4.4 },
  { id: 14, name: "Chicken Supreme Pizza", restaurant: "Pizza Hut", price: "₹450", image: "https://source.unsplash.com/600x400/?pizza,chicken", rating: 4.3 },
  { id: 15, name: "Cheese Burger", restaurant: "Burger Singh", price: "₹150", image: "https://source.unsplash.com/600x400/?burger", rating: 4.3 },
  { id: 16, name: "Chicken Whopper", restaurant: "Burger King", price: "₹180", image: "https://source.unsplash.com/600x400/?chicken,burger", rating: 4.4 },
  { id: 17, name: "McVeggie Burger", restaurant: "McDonald's", price: "₹120", image: "https://source.unsplash.com/600x400/?veg,burger", rating: 4.0 },
  { id: 18, name: "Peri Peri Fries", restaurant: "McDonald's", price: "₹90", image: "https://source.unsplash.com/600x400/?fries", rating: 4.3 },

  // CHINESE
  { id: 19, name: "Veg Fried Rice", restaurant: "Chinese Wok", price: "₹160", image: "https://source.unsplash.com/600x400/?friedrice", rating: 4.2 },
  { id: 20, name: "Chicken Hakka Noodles", restaurant: "Chinese Wok", price: "₹180", image: "https://source.unsplash.com/600x400/?noodles", rating: 4.4 },
  { id: 21, name: "Veg Manchurian", restaurant: "Wow! China", price: "₹170", image: "https://source.unsplash.com/600x400/?manchurian", rating: 4.3 },
  { id: 22, name: "Spring Rolls", restaurant: "Momo Nation Cafe", price: "₹130", image: "https://source.unsplash.com/600x400/?springrolls", rating: 4.1 },
  { id: 23, name: "Afghani Momos", restaurant: "Wow! Momo", price: "₹140", image: "https://source.unsplash.com/600x400/?momos", rating: 4.4 },
  { id: 24, name: "Tandoori Momos", restaurant: "Huggi Dumpling", price: "₹160", image: "https://source.unsplash.com/600x400/?tandoori,momos", rating: 4.5 },

  // CAFÉ & DESSERT
  { id: 25, name: "Cold Coffee", restaurant: "Costa Coffee", price: "₹160", image: "https://source.unsplash.com/600x400/?coldcoffee", rating: 4.3 },
  { id: 26, name: "Caramel Latte", restaurant: "Starbucks", price: "₹260", image: "https://source.unsplash.com/600x400/?latte", rating: 4.6 },
  { id: 27, name: "Chocolate Shake", restaurant: "Keventers", price: "₹190", image: "https://source.unsplash.com/600x400/?milkshake", rating: 4.4 },
  { id: 28, name: "Blueberry Cheesecake", restaurant: "Bakingo", price: "₹320", image: "https://source.unsplash.com/600x400/?cheesecake", rating: 4.6 },
  { id: 29, name: "Belgium Waffle", restaurant: "The Belgian Waffle Co.", price: "₹140", image: "https://source.unsplash.com/600x400/?waffle", rating: 4.7 },
  { id: 30, name: "Gulab Jamun", restaurant: "Punjab Sweet Corner", price: "₹90", image: "https://source.unsplash.com/600x400/?gulabjamun", rating: 4.5 },
  { id: 31, name: "Rabri Faluda", restaurant: "Giani's Ice Cream", price: "₹160", image: "https://source.unsplash.com/600x400/?faluda", rating: 4.4 },

  // HEALTHY
  { id: 32, name: "Grilled Chicken Bowl", restaurant: "The Health Kitchen", price: "₹280", image: "https://source.unsplash.com/600x400/?healthy,bowl", rating: 4.3 },
  { id: 33, name: "Veg Salad", restaurant: "The Health Kitchen", price: "₹150", image: "https://source.unsplash.com/600x400/?salad", rating: 4.2 },
  { id: 34, name: "Protein Shake", restaurant: "Health Hub Cafe", price: "₹200", image: "https://source.unsplash.com/600x400/?proteinshake", rating: 4.4 },

  // Continue until 100 dishes
];

export default dishesData;
