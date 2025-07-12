import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "./components/layout/MainLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AuthProvider, useAuth } from "./lib/AuthProvider";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NewProposal from "./pages/NewProposal";
import ItinerariesPage from "./pages/Itineraries";
import ViewItinerary from "./pages/ViewItinerary";
import EditItinerary from "./pages/EditItinerary";
import { Dashboard } from "./pages/Dashboard";
import QuoteTest from "./pages/QuoteTest";
import { Quotes } from "./pages/Quotes";
import Bookings from "./pages/Bookings";
import { ViewQuote } from "./pages/ViewQuote";
import { EditQuote } from "./pages/EditQuote";
import { CreateBooking } from "./pages/CreateBooking";
import MediaLibrary from "./pages/MediaLibrary";
import OrderConfirmation from "./pages/OrderConfirmation";
import Settings from "./pages/Settings";
import TeamInvitation from './pages/TeamInvitation';
import TeamInvitationSignup from './pages/TeamInvitationSignup';
import HubSpotCallback from './pages/HubSpotCallback';
import { RateHawkTest } from './components/RateHawkTest';
import Analytics from './pages/Analytics';
import CRM from './pages/Crm';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import EditClient from './pages/EditClient';
import Integrations from './pages/Integrations';
import { NewIntakeTest } from "./pages/NewIntakeTest";
import PackageBuilderPage from './pages/PackageBuilderPage';
import InventoryPage from './pages/Inventory';
import PackageManager from './pages/PackageManager';
import { PackageIntakeTest } from "./pages/PackageIntakeTest";
import CreateBookingFromQuotePage from './pages/CreateBookingFromQuoteV2';
import ViewBooking from './pages/ViewBooking';
import EditBooking from './pages/EditBooking';
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  return (
    <>
      <Routes>
        {/* Public routes - Login as home page */}
        <Route path="/" element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        } />
        <Route path="/login" element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        } />
        
        {/* Team invitation routes - must be public and accessible */}
        <Route path="/team-invite" element={
          <PublicLayout>
            <TeamInvitation />
          </PublicLayout>
        } />
        <Route path="/team-invitation" element={
          <PublicLayout>
            <TeamInvitation />
          </PublicLayout>
        } />
        <Route path="/team-invitation-signup" element={
          <PublicLayout>
            <TeamInvitationSignup />
          </PublicLayout>
        } />
        
        {/* Protected routes with sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/new-proposal" element={<NewProposal />} />
                  <Route path="/new-trip" element={<div>New Trip Page (Coming Soon)</div>} />
                  <Route path="/itineraries" element={<ItinerariesPage />} />
                  <Route path="/itinerary/:id" element={<ViewItinerary />} />
                  <Route path="/edit-itinerary/:id" element={<EditItinerary />} />
                  <Route path="/quote-test" element={<QuoteTest />} />
                  <Route path="/ratehawk-test" element={<RateHawkTest />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/media-library" element={<MediaLibrary />} />
                  <Route path="/quotes/:quoteId" element={<ViewQuote />} />
                  <Route path="/quotes/:quoteId/edit" element={<EditQuote />} />
                  <Route path="/quotes/:quoteId/create-booking" element={<CreateBookingFromQuotePage />} />
                  <Route path="/booking/:bookingId" element={<ViewBooking />} />
                  <Route path="/booking/:bookingId/edit" element={<EditBooking />} />
                  <Route path="/order/success" element={<OrderConfirmation />} />
                  
                  {/* CRM Routes */}
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/crm/new-client" element={<NewClient />} />
                  <Route path="/crm/client/:clientId" element={<ClientDetail />} />
                  <Route path="/crm/client/:clientId/edit" element={<EditClient />} />
                  
                  {/* Integration Routes */}
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/auth/callback" element={<HubSpotCallback />} />
                  <Route path="/new-intake-test" element={<NewIntakeTest />} />
                  <Route path="/package-builder" element={<PackageBuilderPage />} />
                  {/* Inventory Management Route */}
                  <Route path="/inventory" element={<InventoryPage />} />
                  {/* Package Manager Route */}
                  <Route path="/package-manager" element={<PackageManager />} />
                  <Route path="/package-intake-test" element={<PackageIntakeTest />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />

                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
