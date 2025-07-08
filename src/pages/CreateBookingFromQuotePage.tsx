import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CreateBookingFromQuoteV2 from './CreateBookingFromQuoteV2';
import { QuoteService } from '@/lib/quoteService';

export default function CreateBookingFromQuotePage() {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      setLoading(true);
      QuoteService.getQuoteById(quoteId as string)
        .then((q) => setQuote(q))
        .finally(() => setLoading(false));
    }
  }, [quoteId]);

  if (loading) return <div className="p-8 text-center">Loading quote...</div>;
  if (!quote) return <div className="p-8 text-center text-red-500">Quote not found.</div>;
  return <CreateBookingFromQuoteV2 quote={quote} />;
} 