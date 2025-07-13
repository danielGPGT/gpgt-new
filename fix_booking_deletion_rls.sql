-- Fix Booking Deletion RLS Policies
-- This script adds proper RLS policies to allow booking deletion

-- First, let's check if the current policies exist and drop them if needed
DROP POLICY IF EXISTS "Users can update their team's bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their team's bookings" ON public.bookings;

-- Recreate the UPDATE policy with better error handling
CREATE POLICY "Users can update their team's bookings" ON public.bookings
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Add DELETE policy for bookings
CREATE POLICY "Users can delete their team's bookings" ON public.bookings
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Add DELETE policies for related tables
DROP POLICY IF EXISTS "Users can delete their team's booking components" ON public.booking_components;
CREATE POLICY "Users can delete their team's booking components" ON public.booking_components
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their team's booking payments" ON public.booking_payments;
CREATE POLICY "Users can delete their team's booking payments" ON public.booking_payments
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their team's booking travelers" ON public.booking_travelers;
CREATE POLICY "Users can delete their team's booking travelers" ON public.booking_travelers
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their team's booking flights" ON public.bookings_flights;
CREATE POLICY "Users can delete their team's booking flights" ON public.bookings_flights
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their team's booking lounge passes" ON public.bookings_lounge_passes;
CREATE POLICY "Users can delete their team's booking lounge passes" ON public.bookings_lounge_passes
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_components', 'booking_payments', 'booking_travelers', 'bookings_flights', 'bookings_lounge_passes')
ORDER BY tablename, policyname; 