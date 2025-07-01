import type { IntakeData } from '@/store/intake';
import { createGeminiPrompt } from '@/utils/createGeminiPrompt';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeminiItineraryDay = {
  day: number;
  title: string;
  narrative: string;
  schedule: { time: string; activity: string }[];
  activities: string[];
  luxuryHighlights: { name: string; description: string; timing: string }[];
  eventAccess?: {
    entrances: string[];
    facilities: string[];
    services: string[];
  };
};

export async function generateItineraryWithGemini(
  data: IntakeData,
  selectedEvent?: any,
  selectedTicket?: any
): Promise<GeminiItineraryDay[]> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('Gemini API key is required');
  }

  // Debug logging
  console.log('🎫 Gemini Client - Event Data Debug:', {
    hasEvent: !!selectedEvent,
    hasTicket: !!selectedTicket,
    eventName: selectedEvent?.name,
    ticketType: selectedTicket?.categoryName,
    eventDate: selectedEvent?.dateOfEvent,
    ticketPrice: selectedTicket?.price
  });

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      temperature: 0.9,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 4096,
    }
  });

  try {
    const prompt = createGeminiPrompt(data, selectedEvent, selectedTicket);
    console.log('📝 Generated prompt length:', prompt.length);
    console.log('📝 Prompt includes event data:', prompt.includes('CRITICAL EVENT INFORMATION'));
    console.log('📝 Prompt includes F1:', prompt.includes('F1') || prompt.includes('Grand Prix'));

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('🤖 Raw Gemini response length:', text.length);
    console.log('🤖 Response preview:', text.substring(0, 500));

    try {
      const itinerary = JSON.parse(text);
      console.log('✅ Parsed itinerary successfully');
      console.log('📅 Itinerary days:', itinerary.length);
      return itinerary;
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      console.log('📄 Raw response:', text);
      throw new Error('Failed to generate itinerary. Please try again.');
    }
  } catch (error) {
    console.error('💥 Gemini API error:', error);
    throw error;
  }
} 