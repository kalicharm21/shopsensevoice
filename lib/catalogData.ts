export interface CatalogProduct {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy' | 'Bakery' | 'Pantry' | 'Snacks' | 'Beverages' | 'Personal Care' | 'Household';
  price: number;
  unit: string;
  brand: string;
  image: string;
  inStock: boolean;
  isSeasonal?: boolean;
  discountBadge?: string;
  originalPrice?: number;
  tags: string[];
}

export const STORE_CATALOG: CatalogProduct[] = [
  // Produce
  { id: 'cat-1', name: 'Farm Fresh Potatoes', category: 'Produce', price: 40, unit: 'kg', brand: 'Organic Farms', image: '🥔', inStock: true, tags: ['vegetables', 'potatoes', 'aloo'] },
  { id: 'cat-2', name: 'Red Fresh Tomatoes', category: 'Produce', price: 35, unit: 'kg', brand: 'Local Harvest', image: '🍅', inStock: true, discountBadge: '20% OFF', originalPrice: 45, tags: ['tomatoes', 'tamatar'] },
  { id: 'cat-3', name: 'Crisp Shimla Apples', category: 'Produce', price: 160, unit: 'kg', brand: 'Himalayan Fresh', image: '🍎', inStock: true, isSeasonal: true, tags: ['apples', 'fruits', 'seb'] },
  { id: 'cat-4', name: 'Fresh Organic Spinach', category: 'Produce', price: 30, unit: 'bunch', brand: 'Farm Fresh', image: '🥬', inStock: true, isSeasonal: true, tags: ['palak', 'spinach', 'greens'] },
  { id: 'cat-5', name: 'Sweet Yellow Bananas', category: 'Produce', price: 60, unit: 'dozen', brand: 'South Direct', image: '🍌', inStock: true, tags: ['banana', 'kela', 'fruits'] },

  // Dairy & Alternatives
  { id: 'cat-6', name: 'Amul Taaza Toned Milk', category: 'Dairy', price: 54, unit: 'litre', brand: 'Amul', image: '🥛', inStock: true, tags: ['milk', 'doodh', 'dairy'] },
  { id: 'cat-7', name: 'Amul Pure Salted Butter', category: 'Dairy', price: 56, unit: '100g', brand: 'Amul', image: '🧈', inStock: true, tags: ['butter', 'makhan'] },
  { id: 'cat-8', name: 'Unsweetened Almond Milk', category: 'Dairy', price: 140, unit: 'litre', brand: 'Raw Pressery', image: '🥛', inStock: true, discountBadge: 'Special Deal', originalPrice: 175, tags: ['almond milk', 'vegan', 'plant milk'] },
  { id: 'cat-9', name: 'Fresh Malai Paneer', category: 'Dairy', price: 90, unit: '200g', brand: 'Mother Dairy', image: '🧀', inStock: true, tags: ['paneer', 'cottage cheese'] },

  // Bakery
  { id: 'cat-10', name: '100% Whole Wheat Bread', category: 'Bakery', price: 45, unit: 'loaf', brand: 'English Oven', image: '🍞', inStock: true, tags: ['bread', 'brown bread', 'whole wheat'] },
  { id: 'cat-11', name: 'Fresh Pav Buns (Pack of 6)', category: 'Bakery', price: 30, unit: 'pack', brand: 'Local Bakery', image: '🍞', inStock: true, tags: ['pav', 'buns', 'bread'] },

  // Pantry
  { id: 'cat-12', name: 'Fortune Sunlite Sunflower Oil', category: 'Pantry', price: 145, unit: 'litre', brand: 'Fortune', image: '🌻', inStock: true, discountBadge: 'Hot Deal', originalPrice: 170, tags: ['oil', 'cooking oil', 'tel'] },
  { id: 'cat-13', name: 'Tata Salt Vaccum Evaporated', category: 'Pantry', price: 28, unit: 'kg', brand: 'Tata', image: '🧂', inStock: true, tags: ['salt', 'namak', 'tata salt'] },
  { id: 'cat-14', name: 'India Gate Basmati Rice Feast', category: 'Pantry', price: 110, unit: 'kg', brand: 'India Gate', image: '🌾', inStock: true, discountBadge: '15% OFF', originalPrice: 130, tags: ['rice', 'basmati', 'chawal'] },
  { id: 'cat-15', name: 'Aashirvaad Shudh Chakki Atta', category: 'Pantry', price: 220, unit: '5kg', brand: 'Aashirvaad', image: '🌾', inStock: true, tags: ['atta', 'flour', 'wheat flour'] },
  { id: 'cat-16', name: 'Organic Jaggery Powder', category: 'Pantry', price: 65, unit: 'kg', brand: 'Organic India', image: '🍯', inStock: true, tags: ['jaggery', 'gur', 'sugar substitute'] },

  // Beverages & Personal Care
  { id: 'cat-17', name: 'Organic India Tulsi Green Tea', category: 'Beverages', price: 210, unit: 'pack (25 bags)', brand: 'Organic India', image: '🍵', inStock: true, discountBadge: 'Buy 1 Get 10% Off', originalPrice: 240, tags: ['green tea', 'tea', 'organic tea'] },
  { id: 'cat-18', name: 'Tata Tea Gold Leaf Tea', category: 'Beverages', price: 140, unit: '500g', brand: 'Tata', image: '☕', inStock: true, tags: ['tea', 'chai', 'tata tea'] },
  { id: 'cat-19', name: 'Sensodyne Rapid Relief Toothpaste', category: 'Personal Care', price: 195, unit: '80g', brand: 'Sensodyne', image: '🪥', inStock: true, tags: ['toothpaste', 'brush', 'oral care'] },
  { id: 'cat-20', name: 'Colgate Strong Teeth Toothpaste', category: 'Personal Care', price: 75, unit: '150g', brand: 'Colgate', image: '🪥', inStock: true, tags: ['toothpaste', 'colgate'] }
];

export const HEALTHY_SUBSTITUTES_MAP: Record<string, { name: string; price: number; unit: string; category: string; image: string; reason: string; savings?: number }> = {
  sugar: { name: 'Organic Jaggery Powder', price: 65, unit: 'kg', category: 'Pantry', image: '🍯', reason: 'Unrefined, mineral-rich natural sweetener' },
  'white sugar': { name: 'Organic Jaggery Powder', price: 65, unit: 'kg', category: 'Pantry', image: '🍯', reason: 'Low-glycemic natural sweetener' },
  milk: { name: 'Unsweetened Almond Milk', price: 140, unit: 'litre', category: 'Dairy', image: '🥛', reason: 'Lactose-free, 60% fewer calories' },
  'dairy milk': { name: 'Unsweetened Oat Milk', price: 155, unit: 'litre', category: 'Dairy', image: '🥛', reason: 'Creamy plant-based heart healthy alternative' },
  butter: { name: 'Cold-Pressed Olive Oil', price: 290, unit: 'bottle', category: 'Pantry', image: '🫒', reason: 'Rich in heart-healthy monounsaturated fats' },
  'white bread': { name: '100% Whole Wheat Bread', price: 45, unit: 'loaf', category: 'Bakery', image: '🍞', reason: 'Higher dietary fiber with zero refined flour' },
  maida: { name: 'Aashirvaad Multigrain Atta', price: 75, unit: 'kg', category: 'Pantry', image: '🌾', reason: 'Complex carbs with high fiber' },
  cola: { name: 'Sparkling Kombucha', price: 95, unit: 'bottle', category: 'Beverages', image: '🍵', reason: 'Probiotic-rich gut friendly drink' }
};