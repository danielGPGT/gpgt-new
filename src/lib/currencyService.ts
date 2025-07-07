const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  adjustedRate: number; // Rate with 5% spread
  amount: number;
  convertedAmount: number;
}

export class CurrencyService {
  private static cache: Map<string, { data: ExchangeRate; timestamp: number }> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch exchange rates from the API
   */
  static async fetchExchangeRates(baseCurrency: string = 'GBP'): Promise<ExchangeRate> {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`💰 Using cached exchange rates for ${baseCurrency}`);
      return cached.data;
    }

    try {
      console.log(`💰 Fetching exchange rates for ${baseCurrency}...`);
      const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.status}`);
      }

      const data: ExchangeRate = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`✅ Exchange rates fetched for ${baseCurrency}:`, data.rates);
      return data;
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another with 5% spread
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        adjustedRate: 1,
        amount,
        convertedAmount: amount
      };
    }

    try {
      const rates = await this.fetchExchangeRates(fromCurrency);
      const baseRate = rates.rates[toCurrency];
      
      if (!baseRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }

      // Apply 5% spread (multiply by 1.05 for markup)
      const adjustedRate = baseRate * 1.05;
      const convertedAmount = amount * adjustedRate;

      return {
        fromCurrency,
        toCurrency,
        rate: baseRate,
        adjustedRate,
        amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
      };
    } catch (error) {
      console.error('❌ Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get supported currencies
   */
  static getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
    return [
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
      { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
      { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
      { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
      { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
      { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
      { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
      { code: 'COP', name: 'Colombian Peso', symbol: '$' },
      { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
      { code: 'UYU', name: 'Uruguayan Peso', symbol: '$' },
      { code: 'VEF', name: 'Venezuelan Bolívar', symbol: 'Bs' },
      { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs' },
      { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲' },
      { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
      { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
      { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
      { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
      { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
      { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
      { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с' },
      { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'ЅМ' },
      { code: 'TMT', name: 'Turkmenistan Manat', symbol: 'T' },
              { code: 'UZS', name: 'Uzbekistani Som', symbol: "so'm" },
      { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
      { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM' },
      { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
      { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
      { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
      { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
      { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
      { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
      { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
      { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
      { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
      { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
      { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨' },
      { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
      { code: 'TND', name: 'Tunisian Dinar', symbol: 'TND' },
      { code: 'DZD', name: 'Algerian Dinar', symbol: 'DZD' },
      { code: 'LYD', name: 'Libyan Dinar', symbol: 'LYD' },
      { code: 'SDG', name: 'Sudanese Pound', symbol: 'SDG' },
      { code: 'ETB', name: 'Ethiopian Birr', symbol: 'ETB' },
      { code: 'SOS', name: 'Somali Shilling', symbol: 'S' },
      { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
      { code: 'KMF', name: 'Comorian Franc', symbol: 'CF' },
      { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar' },
      { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
      { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$' },
      { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
      { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
      { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
      { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
      { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
      { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
      { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$' },
      { code: 'BBD', name: 'Barbadian Dollar', symbol: '$' },
      { code: 'BMD', name: 'Bermudian Dollar', symbol: '$' },
      { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$' },
      { code: 'JMD', name: 'Jamaican Dollar', symbol: '$' },
      { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$' },
      { code: 'BZD', name: 'Belize Dollar', symbol: '$' },
      { code: 'GYD', name: 'Guyanese Dollar', symbol: '$' },
      { code: 'SRD', name: 'Surinamese Dollar', symbol: '$' },
      { code: 'FJD', name: 'Fijian Dollar', symbol: '$' },
      { code: 'WST', name: 'Samoan Tālā', symbol: 'T' },
      { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
      { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
      { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$' },
      { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
      { code: 'KID', name: 'Kiribati Dollar', symbol: '$' },
      { code: 'TVD', name: 'Tuvaluan Dollar', symbol: '$' },
      { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
      { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
      { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
      { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
      { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
      { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
      { code: 'MNT', name: 'Mongolian Tögrög', symbol: '₮' },
      { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
      { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
      { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
      { code: 'SVC', name: 'Salvadoran Colón', symbol: '₡' },
      { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
      { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
      { code: 'DOP', name: 'Dominican Peso', symbol: '$' },
      { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
      { code: 'CUP', name: 'Cuban Peso', symbol: '$' },
      { code: 'CUC', name: 'Cuban Convertible Peso', symbol: '$' },
      { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ' },
      { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
      { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
      { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
      { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
      { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$' },
      { code: 'BBD', name: 'Barbadian Dollar', symbol: '$' },
      { code: 'BMD', name: 'Bermudian Dollar', symbol: '$' },
      { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$' },
      { code: 'JMD', name: 'Jamaican Dollar', symbol: '$' },
      { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$' },
      { code: 'BZD', name: 'Belize Dollar', symbol: '$' },
      { code: 'GYD', name: 'Guyanese Dollar', symbol: '$' },
      { code: 'SRD', name: 'Surinamese Dollar', symbol: '$' },
      { code: 'FJD', name: 'Fijian Dollar', symbol: '$' },
      { code: 'WST', name: 'Samoan Tālā', symbol: 'T' },
      { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
      { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
      { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$' },
      { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
      { code: 'KID', name: 'Kiribati Dollar', symbol: '$' },
      { code: 'TVD', name: 'Tuvaluan Dollar', symbol: '$' },
      { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
      { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
      { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
      { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
      { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
      { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
      { code: 'MNT', name: 'Mongolian Tögrög', symbol: '₮' },
      { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
      { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
      { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
      { code: 'SVC', name: 'Salvadoran Colón', symbol: '₡' },
      { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
      { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
      { code: 'DOP', name: 'Dominican Peso', symbol: '$' },
      { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
      { code: 'CUP', name: 'Cuban Peso', symbol: '$' },
      { code: 'CUC', name: 'Cuban Convertible Peso', symbol: '$' },
      { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ' },
      { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' }
    ];
  }

  /**
   * Format currency amount with proper symbol
   */
  static formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
} 