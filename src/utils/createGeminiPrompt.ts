import type { IntakeData } from '@/store/intake';

function getEventSchedule(eventName: string, startDate: string): string {
  // Handle specific event types with their schedules
  if (eventName.toLowerCase().includes('grand prix')) {
    return `
F1 GRAND PRIX SCHEDULE:
- Day 1 (${startDate}): Practice Sessions
  • First Practice (FP1): 13:30 - 14:30
  • Second Practice (FP2): 17:00 - 18:00
  Key Activities: Track walk, pit lane access, practice session viewing

- Day 2 (Next Day): Qualifying
  • Third Practice (FP3): 14:30 - 15:30
  • Qualifying Session: 18:00 - 19:00
  Key Activities: Qualifying session, pit lane activities, driver appearances

- Day 3 (Race Day): Main Race
  • Driver's Parade: 16:30 - 17:00
  • Race Start: 18:00 (approximately 2 hours)
  Key Activities: Pre-race ceremonies, main race, podium celebration`;
  }
  // Add more event types here as needed
  return '';
}

export function createGeminiPrompt(
  data: IntakeData,
  selectedEvent?: any,
  selectedTicket?: any,
  dummyEvents?: { name: string; date: string; price?: number; currency?: string }[]
): string {
  console.log('🔍 createGeminiPrompt - Input data:', {
    hasEvent: !!selectedEvent,
    hasTicket: !!selectedTicket,
    eventName: selectedEvent?.name,
    ticketType: selectedTicket?.categoryName,
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate
  });

  // Compose event emphasis if an event and ticket are selected
  let eventEmphasis = '';
  if (selectedEvent && selectedTicket) {
    console.log('✅ Creating event emphasis for:', selectedEvent.name);
    const eventSchedule = getEventSchedule(selectedEvent.name, selectedEvent.dateOfEvent);
    const isMultiDayEvent = selectedTicket.categoryName.toLowerCase().includes('3 day') || 
                           selectedTicket.categoryName.toLowerCase().includes('weekend');

    eventEmphasis = `\n\nCRITICAL EVENT INFORMATION - THIS IS THE CENTERPIECE OF THE TRIP:

EVENT DETAILS:
- Name: ${selectedEvent.name}
- Type: ${isMultiDayEvent ? 'Multi-Day Event (3 Days)' : 'Single Day Event'}
- Main Date: ${selectedEvent.dateOfEvent}
- Venue: ${selectedEvent.venue?.name || 'TBD'}
- Location: ${selectedEvent.venue?.city || selectedEvent.city?.name}, ${selectedEvent.venue?.country || selectedEvent.country?.name}
${selectedEvent.description ? `- Description: ${selectedEvent.description}` : ''}

TICKET PACKAGE:
- Type: ${selectedTicket.categoryName}
- Section: ${selectedTicket.splittedCategoryName?.main || ''} ${selectedTicket.splittedCategoryName?.secondary ? `• ${selectedTicket.splittedCategoryName.secondary}` : ''}
- Price: ${selectedTicket.price} ${selectedTicket.currency}
${selectedTicket.isVipPackage ? '- VIP Package Benefits:\n  • Premium seating\n  • Exclusive lounge access\n  • Gourmet catering\n  • Premium bar service' : ''}
${selectedTicket.immediateConfirmation ? '- Immediate Confirmation Available' : '- 24-hour Confirmation Period'}
${selectedTicket.importantNotes ? `- Important Notes: ${selectedTicket.importantNotes}` : ''}

${eventSchedule}

STRICT ITINERARY REQUIREMENTS:
1. Event Integration:
   - This event is the MAIN FOCUS of the trip
   - ALL event sessions must be included in the itinerary
   - Each session should be marked as "FEATURED EVENT:" in activities
   - Do not schedule other major activities during event times

2. Transportation & Logistics:
   - Include detailed transport to/from each session
   - Factor in traffic and security check times
   - Suggest optimal departure times from hotel
   - Include parking/drop-off information if available

3. Complementary Activities:
   - Plan activities that enhance the event experience
   - Include relevant fan zones or event villages
   - Suggest nearby attractions for non-event times
   - Include post-session dining or entertainment aligned with event timing

4. Accommodation:
   - Suggest hotels close to the venue
   - Consider traffic patterns during event days
   - Include luxury properties with event shuttle services if available

5. Special Considerations:
   ${selectedTicket.isVipPackage ? '- Include all VIP access points and exclusive areas\n   - List special VIP services and timings\n   - Suggest VIP meeting points and lounges' : ''}
   - Note best times to arrive for optimal experience
   - Include backup plans for weather delays
   - List essential items to bring${isMultiDayEvent ? '\n   - Suggest different viewing points for each day' : ''}`;
  } else if (data.eventRequests || (data.eventTypes && data.eventTypes.length > 0)) {
    console.log('⚠️ No specific event selected, using general event preferences');
    eventEmphasis = `\n\nEvent Preferences:${
      data.eventRequests ? `\nRequested Events: ${data.eventRequests}` : ''
    }${
      data.eventTypes && data.eventTypes.length > 0
        ? `\nEvent Types of Interest: ${data.eventTypes.join(', ')}`
        : ''
    }\n\nPlease suggest and incorporate suitable events matching these preferences into the itinerary.`;
  } else {
    console.log('❌ No event data provided');
  }

  const prompt = `Create a luxury travel itinerary focused on the following major event and preferences:

Destination: ${data.destination}
Dates: ${data.startDate} to ${data.endDate}
Interests: ${data.interests.join(', ')}
Tone: ${data.tone}
Travel Type: ${data.travelType}
Budget: ${data.budget.amount} ${data.budget.currency}
${eventEmphasis}

Format the response as a JSON array, where each day is an object with:
- day (number)
- title (string, should reference the main event of the day)
- narrative (string, include specific timings and logistics)
- schedule (array of objects with 'time' and 'activity' properties)
- activities (array of strings, prefix main event activities with "FEATURED EVENT:")
- luxuryHighlights (array of objects with 'name', 'description', and 'timing' properties)
- eventAccess (object with 'entrances', 'facilities', and 'services' arrays)

Example:
[
  {
    "day": 1,
    "title": "F1 Practice Day & Circuit Introduction",
    "narrative": "Your Grand Prix weekend begins with exclusive access to practice sessions. Start with a champagne breakfast at 10:00 AM before your dedicated chauffeur transfers you to the circuit...",
    "schedule": [
      {
        "time": "10:00",
        "activity": "Champagne breakfast at hotel"
      },
      {
        "time": "12:00",
        "activity": "Depart for circuit (30 min transfer)"
      },
      {
        "time": "13:30",
        "activity": "First Practice Session (FP1)"
      }
    ],
    "activities": [
      "Luxury breakfast at Four Seasons",
      "Private transfer to Yas Marina Circuit",
      "FEATURED EVENT: F1 Practice Session 1 (FP1) - North Grandstand",
      "FEATURED EVENT: F1 Practice Session 2 (FP2) - North Grandstand",
      "Evening at Yas Marina"
    ],
    "luxuryHighlights": [
      {
        "name": "North Grandstand VIP Experience",
        "description": "Premium viewing position with dedicated hospitality suite",
        "timing": "Full day access"
      }
    ],
    "eventAccess": {
      "entrances": ["Gate 1 - VIP Entry", "North Grandstand Entry"],
      "facilities": ["VIP Lounge", "Air-conditioned seating", "Private restrooms"],
      "services": ["Dedicated host", "Complimentary refreshments", "Program guide"]
    }
  }
]
`;

  console.log('📝 Final prompt length:', prompt.length);
  console.log('📝 Event emphasis included:', !!eventEmphasis);
  
  return prompt;
} 