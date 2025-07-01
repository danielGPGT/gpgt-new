import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mock exchange rates (in practice, these would come from an API)
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.73,
  'CAD': 1.25,
  'AUD': 1.35,
  'JPY': 110.0,
  'CHF': 0.92,
  'CNY': 6.45,
  'INR': 74.5,
  'BRL': 5.2,
  'MXN': 20.5,
  'SGD': 1.35,
  'HKD': 7.8,
  'KRW': 1150.0,
  'SEK': 8.5,
  'NOK': 8.8,
  'DKK': 6.3,
  'PLN': 3.8,
  'CZK': 21.5,
  'HUF': 300.0,
};

/**
 * Convert currency with a 2% spread to cover exchange charges
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency (3-letter code)
 * @param toCurrency - The target currency (3-letter code)
 * @param spread - The spread percentage (default 2%)
 * @returns The converted amount with spread applied
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  spread: number = 0.02
): number {
  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get exchange rates
  const fromRate = MOCK_EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = MOCK_EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    console.warn(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
    return amount; // Return original amount if rate not found
  }

  // Convert to USD first (base currency)
  const usdAmount = amount / fromRate;
  
  // Convert from USD to target currency
  const convertedAmount = usdAmount * toRate;
  
  // Apply spread (add 2% to cover exchange charges)
  const spreadAmount = convertedAmount * spread;
  const finalAmount = convertedAmount + spreadAmount;
  
  return Math.round(finalAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Format currency for display
 * @param amount - The amount to format
 * @param currency - The currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹',
    'BRL': 'R$',
    'MXN': '$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'KRW': '₩',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
  
  // Special formatting for currencies that don't use decimal places
  if (['JPY', 'KRW', 'HUF'].includes(currency.toUpperCase())) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
