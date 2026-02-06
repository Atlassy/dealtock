// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, lang: string = 'fr'): string {
  if (typeof price !== 'number' || isNaN(price)) return 'N/A';
  
  const currencySymbol = lang === 'ar' ? 'د.م.' : 'MAD';
  const numberFormat = new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : lang, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${numberFormat.format(price)} ${currencySymbol}`;
}