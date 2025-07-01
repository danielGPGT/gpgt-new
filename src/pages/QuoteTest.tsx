import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IntakeForm } from '@/components/forms/IntakeForm';
import { QuoteResponse } from '@/lib/quoteService';
import { useQuoteService } from '@/hooks/useQuoteService';

export default function QuoteTest() {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const { getUserQuotes, isFetchingQuotes } = useQuoteService();

  const handleQuoteCreated = (quoteResponse: QuoteResponse) => {
    console.log('🎉 Quote created successfully:', quoteResponse);
    setQuote(quoteResponse);
  };

  const handleLoadQuotes = async () => {
    const userQuotes = await getUserQuotes();
    setQuotes(userQuotes);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Quote Generation Test</h1>
      
      <div className="grid gap-6">
        {/* Quote Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Quote</CardTitle>
          </CardHeader>
          <CardContent>
            <IntakeForm onSubmit={handleQuoteCreated} />
          </CardContent>
        </Card>

        {/* Created Quote Display */}
        {quote && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Quote ID:</strong> {quote.id}
                </div>
                <div>
                  <strong>Status:</strong> {quote.status}
                </div>
                <div>
                  <strong>Total Price:</strong> {quote.currency} {quote.totalPrice}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(quote.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Generated Itinerary:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(quote.generatedItinerary, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Your Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLoadQuotes} 
              disabled={isFetchingQuotes}
              className="mb-4"
            >
              {isFetchingQuotes ? 'Loading...' : 'Load My Quotes'}
            </Button>
            
            {quotes.length > 0 ? (
              <div className="space-y-4">
                {quotes.map((q) => (
                  <div key={q.id} className="p-4 border rounded">
                    <div><strong>ID:</strong> {q.id}</div>
                    <div><strong>Status:</strong> {q.status}</div>
                    <div><strong>Price:</strong> {q.currency} {q.totalPrice}</div>
                    <div><strong>Created:</strong> {new Date(q.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No quotes found. Create one above!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 