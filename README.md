# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# LuxeTripBuilder

A luxury travel itinerary builder with AI-powered features, CRM system, and comprehensive travel planning tools.

## Features

### 🎯 Core Features
- **AI-Powered Itinerary Generation**: Create detailed travel itineraries with Gemini AI
- **Hotel Integration**: Real-time hotel search and booking with RateHawk API
- **CRM System**: Client management, proposals, and follow-ups
- **Media Library**: AI-tagged image collection with Unsplash integration
- **Subscription Management**: Tiered pricing with Stripe integration
- **Team Collaboration**: Multi-user support with role-based access

### 🖼️ Media Library Features
- **AI-Powered Tagging**: Automatic image analysis and tagging using Gemini AI
- **Unsplash Integration**: Search and add high-quality stock photos directly to your library
- **Smart Organization**: Categorize images by type, location, and custom tags
- **Bulk Operations**: Upload multiple images with batch AI tagging
- **Search & Filter**: Find images by description, tags, or category
- **Image Management**: Edit descriptions, regenerate tags, and organize your collection

### 💼 CRM Features
- **Client Management**: Store client information, preferences, and history
- **Proposal Generation**: Create professional travel proposals
- **Email Integration**: Send bulk emails and track communications
- **Timeline Tracking**: Monitor client interactions and follow-ups

### 🏨 Hotel Features
- **Real-time Search**: Find hotels with live availability and pricing
- **Detailed Information**: Room types, amenities, photos, and reviews
- **Booking Integration**: Direct booking capabilities
- **Filter Options**: Price, location, amenities, and ratings

### 💳 Subscription System
- **Tiered Plans**: Starter, Professional, and Enterprise tiers
- **Feature Restrictions**: Access control based on subscription level
- **Stripe Integration**: Secure payment processing
- **Usage Tracking**: Monitor feature usage and limits

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luxetripbuilder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Follow the [Environment Setup Guide](ENV_SETUP_GUIDE.md)

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Setup

See [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md) for detailed instructions on setting up:
- Supabase configuration
- Stripe payment integration
- Unsplash API for stock photos
- Database migrations

## Media Library with Unsplash Integration

The Media Library now includes seamless Unsplash integration:

### Features:
- **Search Unsplash**: Find high-quality stock photos by keyword
- **AI Tagging**: Automatic image analysis and tagging
- **Direct Import**: Add Unsplash images to your personal library
- **Smart Organization**: Automatic categorization and tagging

### How to Use:
1. Go to **Media Library** in your dashboard
2. Click **"Unsplash Search"** button
3. Enter search terms (e.g., "luxury hotel", "beach sunset")
4. Browse results and click **"Add to Library"**
5. Images are automatically tagged and categorized

### Requirements:
- Unsplash API key (see [Environment Setup Guide](ENV_SETUP_GUIDE.md))
- Media Library tier access

## API Integrations

- **Supabase**: Database and authentication
- **Stripe**: Payment processing
- **Gemini AI**: Content generation and image analysis
- **RateHawk**: Hotel search and booking
- **Unsplash**: Stock photo library

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini
- **Payments**: Stripe
- **Images**: Unsplash API
- **Hotels**: RateHawk API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
