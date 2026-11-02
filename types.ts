export interface Product {
  id: number;
  name: string;
  price: number;
  tag: 'Best Seller' | 'New' | 'Popular' | 'Special Edition' | string;
  category: string;
  image: string;
  images?: string[];
  description?: string;
  tags?: string[];
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

// Fallback used before the categories API responds
export const DEFAULT_CATEGORIES = [
  'Baking Tools',
  'Craft Supplies',
  'Kitchen Scale',
  'Kitchen Tools',
];

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'recent';

export function formatNaira(value: number): string {
  return `\u20a6${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
