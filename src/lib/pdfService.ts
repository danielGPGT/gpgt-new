import React from 'react';
import { pdf } from '@react-pdf/renderer';
import QuotePDFDocument from '../components/QuotePDFDocument';
import { getBase64Image } from './imageUtils';

interface QuoteData {
  quote_number?: string;
  created_at?: string;
  status?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  event_name?: string;
  event_location?: string;
  event_start_date?: string;
  event_end_date?: string;
  package_name?: string;
  tier_name?: string;
  travelers?: any[];
  travelers_total?: number;
  total_price?: number;
  currency?: string;
  payment_deposit?: number;
  payment_second_payment?: number;
  payment_final_payment?: number;
  payment_deposit_date?: string;
  payment_second_payment_date?: string;
  payment_final_payment_date?: string;
  selected_components?: any[];
  team?: {
    id: string;
    name: string;
    logo_url?: string;
    agency_name?: string;
  };
}

export const generateQuotePDF = async (quoteData: QuoteData): Promise<Uint8Array> => {
  // Convert logo URL to base64 if it exists
  let processedQuoteData = { ...quoteData };
  if (quoteData.team?.logo_url) {
    try {
      const base64Logo = await getBase64Image(quoteData.team.logo_url);
      processedQuoteData = {
        ...quoteData,
        team: {
          ...quoteData.team,
          logo_url: base64Logo
        }
      };
    } catch (error) {
      console.error('Failed to convert logo to base64:', error);
      // Keep original data if conversion fails
    }
  }
  
  const element = React.createElement(QuotePDFDocument, { quoteData: processedQuoteData });
  return await pdf(element).toBuffer();
};

export const downloadQuotePDF = async (quoteData: QuoteData, filename?: string): Promise<void> => {
  // Convert logo URL to base64 if it exists
  let processedQuoteData = { ...quoteData };
  console.log('PDF Service - Original logo URL:', quoteData.team?.logo_url);
  
  if (quoteData.team?.logo_url) {
    try {
      console.log('PDF Service - Converting logo to base64...');
      const base64Logo = await getBase64Image(quoteData.team.logo_url);
      console.log('PDF Service - Base64 conversion successful, length:', base64Logo.length);
      console.log('PDF Service - Base64 starts with:', base64Logo.substring(0, 50));
      
      processedQuoteData = {
        ...quoteData,
        team: {
          ...quoteData.team,
          logo_url: base64Logo
        }
      };
      console.log('PDF Service - Processed data team logo:', processedQuoteData.team?.logo_url?.substring(0, 50));
    } catch (error) {
      console.error('Failed to convert logo to base64:', error);
      // Keep original data if conversion fails
    }
  } else {
    console.log('PDF Service - No logo URL found in team data');
  }
  
  const element = React.createElement(QuotePDFDocument, { quoteData: processedQuoteData });
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `quote-${quoteData.quote_number || 'N/A'}-${new Date().toISOString().split('T')[0]}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const getQuotePDFAsBlob = async (quoteData: QuoteData): Promise<Blob> => {
  // Convert logo URL to base64 if it exists
  let processedQuoteData = { ...quoteData };
  if (quoteData.team?.logo_url) {
    try {
      const base64Logo = await getBase64Image(quoteData.team.logo_url);
      processedQuoteData = {
        ...quoteData,
        team: {
          ...quoteData.team,
          logo_url: base64Logo
        }
      };
    } catch (error) {
      console.error('Failed to convert logo to base64:', error);
      // Keep original data if conversion fails
    }
  }
  
  const element = React.createElement(QuotePDFDocument, { quoteData: processedQuoteData });
  return await pdf(element).toBlob();
}; 