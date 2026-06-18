import * as Icons from 'lucide-react';

export const fundIcons: Record<string, Icons.LucideIcon> = {
  Briefcase: Icons.Briefcase,
  Home: Icons.Home,
  User: Icons.User,
  Heart: Icons.Heart,
  ShoppingCart: Icons.ShoppingCart,
  Car: Icons.Car,
  Gift: Icons.Gift,
  GraduationCap: Icons.GraduationCap,
  Plane: Icons.Plane,
  PiggyBank: Icons.PiggyBank,
  TrendingUp: Icons.TrendingUp,
  Wallet: Icons.Wallet,
  Utensils: Icons.Utensils,
  Tv: Icons.Tv,
  Activity: Icons.Activity,
  Flame: Icons.Flame,
  Shield: Icons.Shield,
  Smile: Icons.Smile,
};

// Formats a number with currency symbol
export const formatCurrency = (amount: number, symbol: string): string => {
  // Use Intl formatting but replace the currency sign with our symbol
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
};

// Gets color styling for a pastel hex color
export const getPastelStyles = (hexColor: string) => {
  return {
    backgroundColor: `${hexColor}25`, // 15% opacity for light background
    color: hexColor,
    borderColor: `${hexColor}50`, // 30% opacity for borders
  };
};

export const defaultPastelColors = [
  '#BAD7E9', // Pastel Blue
  '#C1E1C1', // Pastel Green
  '#FFD1B3', // Pastel Peach
  '#FFCCCB', // Pastel Pink
  '#E6C8FA', // Pastel Lavender
  '#FEFDC6', // Pastel Yellow
  '#B2DEDA', // Pastel Teal
  '#FFDFBA', // Pastel Orange
  '#C9E4DE', // Mint
  '#D8B4F8', // Violet
];
