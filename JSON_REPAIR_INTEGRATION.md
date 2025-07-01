# JSON Repair Integration for Gemini AI

## Overview

This document describes the integration of the `jsonrepair` package to handle malformed JSON responses from Google's Gemini AI in the AItinerary application.

## Problem

Gemini AI responses often contain malformed JSON due to:
- Truncated responses (missing closing braces/brackets)
- Unquoted property names
- Trailing commas
- Code fences and markdown formatting
- Mixed content (JSON + explanatory text)

## Solution

### 1. Package Installation
```bash
npm install jsonrepair
```

### 2. Implementation in `src/lib/gemini.ts`

The `GeminiService` class now includes robust JSON repair functionality:

#### Primary Repair Method
```typescript
private tryRepairJson(str: string): string {
  try {
    // Remove code fences and trim
    const cleaned = str.replace(/```json|```/gi, '').trim();
    
    // Use jsonrepair to fix common JSON issues
    const repaired = jsonrepair(cleaned);
    return repaired;
  } catch (error) {
    console.error('JSON repair failed:', error);
    // Fallback to basic repair for simple cases
    return this.basicJsonRepair(str);
  }
}
```

#### Fallback Repair Method
```typescript
private basicJsonRepair(str: string): string {
  // Remove code fences
  str = str.replace(/```json|```/gi, '').trim();
  const openBraces = (str.match(/{/g) || []).length;
  let closeBraces = (str.match(/}/g) || []).length;
  const openBrackets = (str.match(/\[/g) || []).length;
  let closeBrackets = (str.match(/\]/g) || []).length;
  
  // Auto-close missing braces and brackets
  while (closeBraces < openBraces) {
    str += '}';
    closeBraces++;
  }
  while (closeBrackets < openBrackets) {
    str += ']';
    closeBrackets++;
  }
  return str;
}
```

### 3. Integration in Itinerary Generation

The JSON repair is automatically applied during itinerary generation:

```typescript
async generateItinerary(preferences: TripPreferences): Promise<GeneratedItinerary> {
  try {
    const prompt = this.buildPrompt(preferences);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Debug log to see raw response
    console.log('Raw Gemini Response:', text);

    try {
      // Use jsonrepair to handle malformed JSON
      const cleanedText = this.tryRepairJson(text);
      console.log('Cleaned/Repaired Response:', cleanedText.slice(0, 500));
      const itinerary = JSON.parse(cleanedText);
      toast.success('Itinerary generated successfully');
      return itinerary;
    } catch (error) {
      console.error('Parse Error:', error);
      toast.error('Failed to parse AI response. The response may be too long or incomplete. Try a shorter trip or fewer details.');
      throw new Error(
        `Failed to parse Gemini response as JSON.\n\nFirst 500 chars of response:\n${text.slice(0, 500)}...`);
    }
  } catch (error) {
    console.error('Generation Error:', error);
    toast.error('Failed to generate itinerary');
    throw error;
  }
}
```

## Features

### 1. Multi-Layer Repair Strategy
- **Primary**: Uses `jsonrepair` package for comprehensive JSON repair
- **Fallback**: Basic repair for simple cases (missing braces/brackets)
- **Error Handling**: Graceful degradation with detailed error messages

### 2. Common Issues Handled
- ✅ Truncated JSON responses
- ✅ Unquoted property names
- ✅ Trailing commas
- ✅ Code fences and markdown
- ✅ Mixed content
- ✅ Missing closing braces/brackets

### 3. Debugging Support
- Logs raw AI response for debugging
- Logs cleaned/repaired response
- Provides detailed error messages with response snippets

## Benefits

1. **Improved Reliability**: Significantly reduces JSON parse errors
2. **Better User Experience**: Fewer failed itinerary generations
3. **Robust Error Handling**: Graceful fallbacks and clear error messages
4. **Debugging Support**: Comprehensive logging for troubleshooting

## Usage

The JSON repair functionality is automatically applied whenever an itinerary is generated. No additional configuration is required.

## Testing

The implementation has been tested with various malformed JSON scenarios:
- Truncated responses
- Unquoted properties
- Code fences
- Mixed content
- Valid JSON (should remain unchanged)

## Future Enhancements

1. **Custom Repair Rules**: Add domain-specific repair patterns for travel itineraries
2. **Response Validation**: Validate repaired JSON against expected schema
3. **Retry Logic**: Attempt multiple repair strategies before failing
4. **Performance Optimization**: Cache repair patterns for common issues 