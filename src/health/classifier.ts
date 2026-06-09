import type { FoodCategory } from "../types/index.js";

const JUNK_KEYWORDS = [
  "burger", "pizza", "fries", "fried", "deep fry", "nuggets", "hot dog",
  "wings", "biryani masala fries", "mayonnaise", "cola", "soda", "pepsi",
  "coke", "sprite", "mountain dew", "milkshake", "sundae", "mousse",
  "brownie", "truffle", "cheesecake", "pastry", "donut", "churros",
];

const HEALTHY_KEYWORDS = [
  "salad", "grilled", "steamed", "baked", "roasted", "boiled",
  "quinoa", "oats", "millet", "ragi", "bajra", "dal", "lentil", "chickpea",
  "rajma", "sprouts", "tofu", "egg white", "grilled chicken",
  "fish", "salmon", "tuna", "avocado", "spinach", "kale", "broccoli",
  "smoothie", "coconut water", "green tea", "black coffee",
  "idli", "dosa", "poha", "upma", "khichdi",
];

const VEGETABLE_KEYWORDS = [
  "salad", "spinach", "kale", "broccoli", "cauliflower", "cabbage",
  "carrot", "beans", "peas", "corn", "tomato", "cucumber", "lettuce",
  "palak", "methi", "sabzi", "vegetable", "mixed veg",
];

const FRUIT_KEYWORDS = [
  "apple", "banana", "mango", "papaya", "watermelon", "grapes",
  "pomegranate", "orange", "strawberry", "blueberry", "fruit bowl",
  "fresh fruit", "fruit salad",
];

const PROTEIN_KEYWORDS = [
  "chicken", "paneer", "egg", "fish", "prawn", "mutton", "dal", "lentil",
  "chickpea", "rajma", "soya", "tofu", "peanut", "greek yogurt", "curd",
];

export function classifyFoodItem(name: string): FoodCategory {
  const lower = name.toLowerCase();

  if (VEGETABLE_KEYWORDS.some((k) => lower.includes(k))) return "vegetable";
  if (FRUIT_KEYWORDS.some((k) => lower.includes(k))) return "fruit";
  if (PROTEIN_KEYWORDS.some((k) => lower.includes(k))) return "protein";
  if (JUNK_KEYWORDS.some((k) => lower.includes(k))) return "junk";
  if (HEALTHY_KEYWORDS.some((k) => lower.includes(k))) return "snack_healthy";

  if (["tea", "coffee", "juice", "water", "lassi", "chaas"].some((k) => lower.includes(k))) {
    const unhealthy = ["cold coffee", "frappe", "mocha", "caramel", "chocolate shake"];
    return unhealthy.some((k) => lower.includes(k)) ? "beverage_unhealthy" : "beverage_healthy";
  }

  if (["bread", "naan", "roti", "paratha", "puri", "kulcha", "rice"].some((k) => lower.includes(k))) {
    return "grain";
  }

  return "unknown";
}

export function isLateNightOrder(isoTimestamp: string): boolean {
  const hour = new Date(isoTimestamp).getHours();
  return hour >= 22 || hour < 5;
}
