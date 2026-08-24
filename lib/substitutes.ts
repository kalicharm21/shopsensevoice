import { ShoppingItem } from '../types';

export function optimizeShoppingList(items: ShoppingItem[]) {
  const itemSwaps: { original: string; substitute: string; savings: number }[] = [];
  let totalSavings = 0;

  items.forEach(item => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('white sugar') || nameLower.includes('refined sugar')) {
      itemSwaps.push({ original: item.name, substitute: 'Organic Jaggery Powder', savings: 25 });
      totalSavings += 25;
    } else if (nameLower.includes('whole milk') || nameLower.includes('dairy milk')) {
      itemSwaps.push({ original: item.name, substitute: 'Almond Milk (Unsweetened)', savings: 30 });
      totalSavings += 30;
    }
  });

  return { itemSwaps, totalSavings };
}