import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  agency_name?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
};

export const auth = {
  async signUp(
    email: string,
    password: string,
    name: string,
    phone?: string,
    agency_name?: string,
    logo_url?: string
  ): Promise<{ user: User | null; error?: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          phone: phone || undefined,
          agency_name: agency_name || undefined,
          logo_url: logo_url || undefined,
        },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      return { user: null, error };
    }
    
    if (!data.user) {
      return { user: null, error: new Error('No user returned after signup') };
    }

    return { user: data.user };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error?: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user };
  },

  async signInAfterPayment(email: string, password: string): Promise<{ user: User | null; error?: any }> {
    return this.signIn(email, password);
  },

  async signOut(): Promise<{ error?: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser(): Promise<{ user: User | null; error?: any }> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { user: null, error };
    }

    return { user };
  },

  async getSession(): Promise<{ session: any; error?: any }> {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async resetPassword(email: string): Promise<{ error?: any }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  async updatePassword(password: string): Promise<{ error?: any }> {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    return { error };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: User | null; error?: any }> {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user };
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Profile not found');

    return data as UserProfile;
  },

  async createProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...profile }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create profile');

    return data as UserProfile;
  },

  async ensureProfileExists(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await this.getProfile(user.id);
    } catch (error) {
      // Profile doesn't exist, create it
      await this.createProfile(user.id, {
        email: user.email!,
        name: user.user_metadata?.name || 'Unknown',
      });
    }
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
}; 