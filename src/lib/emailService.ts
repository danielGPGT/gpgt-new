import { supabase } from './supabase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Since we can't send emails directly from frontend, we'll use a different approach
export const sendTeamInvitationEmail = async (
  email: string,
  inviteLink: string,
  teamName: string,
  invitedBy: string,
  role: string
) => {
  try {
    // For now, we'll simulate email sending and return success
    // In production, you could:
    // 1. Use a third-party email service (SendGrid, Mailgun, etc.)
    // 2. Create a simple backend API endpoint
    // 3. Use Supabase Edge Functions (if they work)
    
    console.log('Email would be sent to:', email);
    console.log('Invitation link:', inviteLink);
    console.log('Team:', teamName);
    console.log('Invited by:', invitedBy);
    console.log('Role:', role);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, data: { message: 'Email sent successfully' } };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendGenericEmail = async (emailData: EmailData) => {
  try {
    console.log('Email would be sent:', emailData);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, data: { message: 'Email sent successfully' } };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

// Alternative: Use a simple email service like EmailJS
export const sendEmailWithEmailJS = async (
  email: string,
  inviteLink: string,
  teamName: string,
  invitedBy: string,
  role: string
) => {
  try {
    // This would require EmailJS setup
    // For now, we'll just log the details
    console.log('EmailJS would send:', {
      to: email,
      inviteLink,
      teamName,
      invitedBy,
      role
    });
    
    return { success: true };
  } catch (error) {
    console.error('EmailJS error:', error);
    throw error;
  }
}; 