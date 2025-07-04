import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { HubSpotIntegration } from '@/components/HubSpotIntegration';
import { User, KeyRound, CreditCard, Settings as SettingsIcon, Users, Building2, Phone, Upload, Loader2, Sparkles, Shield, Mail, Link, Check, X, Edit } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Add interfaces for team member and invite
interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
}
interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

const ProfileSettings = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Team member data
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      console.log('Loading user data:', user.user_metadata);
      setName(user.user_metadata?.name || '');
      setPhone(user.user_metadata?.phone || '');
      setEmail(user.email || '');
      setAgencyName(user.user_metadata?.agency_name || '');
      setLogoUrl(user.user_metadata?.logo_url || '');
      
      // Load team member data
      loadTeamMemberData();
    }
  }, [user]);

  const loadTeamMemberData = async () => {
    if (!user) return;
    
    try {
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('id, name, email, phone')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error loading team member data:', error);
        return;
      }

      if (teamMember) {
        setTeamMemberId(teamMember.id);
        // Use team member data if available, otherwise fall back to user metadata
        setName(teamMember.name || user.user_metadata?.name || '');
        setPhone(teamMember.phone || user.user_metadata?.phone || '');
        setEmail(teamMember.email || user.email || '');
      }
    } catch (error) {
      console.error('Error loading team member data:', error);
    }
  };

  const refreshUserData = async () => {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    if (refreshedUser) {
      console.log('Refreshed user data:', refreshedUser.user_metadata);
      setName(refreshedUser.user_metadata?.name || '');
      setPhone(refreshedUser.user_metadata?.phone || '');
      setAgencyName(refreshedUser.user_metadata?.agency_name || '');
      setLogoUrl(refreshedUser.user_metadata?.logo_url || '');
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.email}-${Date.now()}.${fileExt}`;
    
    console.log('Uploading logo to path:', filePath);
    
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(filePath, file);
      
    if (error) {
      console.error('Upload error:', error);
      toast.error('Logo upload failed: ' + error.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);
      
    const publicUrl = publicUrlData?.publicUrl;
    console.log('Generated public URL:', publicUrl);
    
    return publicUrl || null;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setIsUploading(true);
    
    try {
      const uploadedUrl = await uploadLogo(file);
      if (uploadedUrl) {
        setLogoUrl(uploadedUrl);
        console.log('Logo uploaded successfully:', uploadedUrl);
        toast.success('Logo uploaded successfully');
      } else {
        toast.error('Failed to get logo URL');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  // Add phone formatting function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    if (phoneNumber.length <= 10) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    
    // For longer numbers (international), just add spaces
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Update phone validation to be more lenient
  const validatePhone = (phone: string): boolean => {
    // Remove formatting and check if it's a reasonable length
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate inputs
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    if (phone && !validatePhone(phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Saving profile with data:', {
        name,
        phone,
        email,
        agency_name: agencyName,
        logo_url: logoUrl,
      });

      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name,
          phone,
          agency_name: agencyName,
          logo_url: logoUrl,
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        throw authError;
      }

      console.log('Auth metadata updated successfully');

      // Update users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name,
          phone,
          agency_name: agencyName,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw here as auth update succeeded
      } else {
        console.log('Users table updated successfully');
      }

      // Update team_members table if user is a team member
      if (teamMemberId) {
        const { error: teamError } = await supabase
          .from('team_members')
          .update({
            name,
            phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teamMemberId);

        if (teamError) {
          console.error('Team member update error:', teamError);
          // Don't throw here as other updates succeeded
        } else {
          console.log('Team member table updated successfully');
        }
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      setLogoFile(null);
      
      // Refresh user data to show updated values
      await refreshUserData();
      await loadTeamMemberData();
      
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setName(user.user_metadata?.name || '');
      setPhone(user.user_metadata?.phone || '');
      setEmail(user.email || '');
      setAgencyName(user.user_metadata?.agency_name || '');
      setLogoUrl(user.user_metadata?.logo_url || '');
    }
    setLogoFile(null);
    setIsEditing(false);
    setShowEmailChange(false);
    setNewEmail('');
    setConfirmNewEmail('');
  };

  const handleEmailChange = async () => {
    if (!user) return;

    // Validate email
    if (!validateEmail(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      toast.error('Email addresses do not match');
      return;
    }

    if (newEmail === email) {
      toast.error('New email must be different from current email');
      return;
    }

    setIsChangingEmail(true);
    try {
      // Update email in Supabase Auth (this will send verification email)
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        throw error;
      }

      toast.success('Verification email sent to your new email address. Please check your inbox and click the verification link.');
      setShowEmailChange(false);
      setNewEmail('');
      setConfirmNewEmail('');
      
      // Refresh user data
      await refreshUserData();
      await loadTeamMemberData();
      
    } catch (error: any) {
      console.error('Email change error:', error);
      toast.error('Failed to update email: ' + error.message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar/Logo Section */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Agency Branding
          </CardTitle>
          <CardDescription>
            Upload your agency logo to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-xl border-4 border-primary/10 overflow-hidden bg-white shadow-lg">
                  <img 
                    src={logoUrl} 
                    alt="Agency Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-4 border-primary/10 bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="logo" className="text-sm font-medium">
                  Agency Logo
                </Label>
                <div className="mt-2">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={!isEditing || isUploading}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors disabled:opacity-50"
                  />
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading logo...
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Square image, 512x512px or larger
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your contact details and agency information
            </CardDescription>
          </div>
           {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 bg-primary hover:bg-primary/90 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="px-6 bg-primary hover:bg-primary/90 rounded-xl"
          >
            Edit Profile
          </Button>
        )}
      </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full name"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="h-11 bg-muted/50 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEmailChange(!showEmailChange)}
                className="mt-2"
              >
                <Mail className="h-4 w-4 mr-2" />
                Change Email
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
                className="h-11 rounded-xl"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">Enter your phone number with area code</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyName" className="text-sm font-medium">Agency Name</Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your agency name"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Change Section */}
      {showEmailChange && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Change Email Address
            </CardTitle>
            <CardDescription>
              Update your email address. You'll receive a verification email to confirm the change.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail" className="text-sm font-medium">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewEmail" className="text-sm font-medium">Confirm New Email</Label>
                <Input
                  id="confirmNewEmail"
                  type="email"
                  value={confirmNewEmail}
                  onChange={(e) => setConfirmNewEmail(e.target.value)}
                  placeholder="Confirm new email address"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEmailChange}
                disabled={isChangingEmail || !newEmail || !confirmNewEmail}
                className="px-6 bg-primary hover:bg-primary/90 rounded-xl"
              >
                {isChangingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Email'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailChange(false);
                  setNewEmail('');
                  setConfirmNewEmail('');
                }}
                disabled={isChangingEmail}
                className="px-6 rounded-xl"
              >
                Cancel
              </Button>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <Shield className="h-4 w-4 inline mr-2" />
                <strong>Security Note:</strong> You'll receive a verification email at your new address. 
                Click the verification link to complete the email change.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

     
    </div>
  );
};

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    } catch (error: any) {
      toast.error('Failed to update password: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Password Requirements */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <h4 className="font-medium text-sm mb-2">Password Requirements</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                At least 6 characters long
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Contains uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Contains number
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Security Tips
          </CardTitle>
          <CardDescription>
            Best practices to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Strong Passwords</h4>
                <p className="text-xs text-muted-foreground">Use a mix of letters, numbers, and symbols</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Regular Updates</h4>
                <p className="text-xs text-muted-foreground">Change your password every 3-6 months</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Unique Passwords</h4>
                <p className="text-xs text-muted-foreground">Don't reuse passwords across accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Two-Factor Auth</h4>
                <p className="text-xs text-muted-foreground">Enable 2FA for additional security</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
        <Button
          onClick={handlePasswordChange}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          className="px-6 bg-primary hover:bg-primary/90 rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </div>
    </div>
  );
};

const TeamManagement = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin' | 'sales' | 'operations'>('member');
  const [loading, setLoading] = useState(false);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      const { data: member } = await supabase
        .from('team_members')
        .select('role, team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setTeamRole(member?.role || null);
    }
    fetchRole();
  }, [user]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // 1. Find or create the user's team
        if (!user?.id) return;
        
        let team = null;
        
        // First check if user is a team member
        const { data: memberTeams, error: memberError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        if (memberError) {
          console.error('Error checking team membership:', memberError);
        }
        
        if (memberTeams && memberTeams.length > 0) {
          // User is a team member, get their team
          const { data: teamsAsMember, error: teamError } = await supabase
            .from('teams')
            .select('id')
            .in('id', memberTeams.map(tm => tm.team_id))
            .single();
          
          if (teamError) {
            console.error('Error getting team as member:', teamError);
          } else {
            team = teamsAsMember;
          }
        }
        
        // If no team found as member, check if user owns any teams
        if (!team) {
          const { data: ownedTeam, error: ownedError } = await supabase
            .from('teams')
            .select('id')
            .eq('owner_id', user.id)
            .single();
          
          if (ownedError) {
            console.error('Error checking owned teams:', ownedError);
          } else {
            team = ownedTeam;
          }
        }
        
        // If still no team, create one
        if (!team || !team.id) {
          console.log('Creating new team for user:', user.id);
          
          // Create a new team
          const { data: newTeam, error: createTeamError } = await supabase
            .from('teams')
            .insert({
              name: user.user_metadata?.agency_name || user.user_metadata?.name || 'My Team',
              owner_id: user.id,
              max_members: 10
            })
            .select('id')
            .single();
          
          if (createTeamError) {
            console.error('Error creating team:', createTeamError);
            return;
          }
          
          team = newTeam;
          
          // Add user as team member with owner role
          const { error: addMemberError } = await supabase
            .from('team_members')
            .insert({
              team_id: team.id,
              user_id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email,
              role: 'owner',
              status: 'active',
              joined_at: new Date().toISOString()
            });
          
          if (addMemberError) {
            console.error('Error adding user to team:', addMemberError);
          }
        }
        
        if (!team || !team.id) return;
        
        // 2. Fetch team members
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('id, name, email, role, status')
          .eq('team_id', team.id);
        
        if (membersError) {
          console.error('Error fetching team members:', membersError);
        } else {
          setTeamMembers((members as TeamMember[]) || []);
        }
        
        // 3. Fetch pending invitations
        const { data: invites, error: invitesError } = await supabase
          .from('team_invitations')
          .select('id, email, role, status, created_at, updated_at')
          .eq('team_id', team.id)
          .eq('status', 'pending');
        
        if (invitesError) {
          console.error('Error fetching invitations:', invitesError);
        } else {
          setPendingInvites((invites as TeamInvite[]) || []);
        }
      } catch (err) {
        console.error('Error in fetchTeamData:', err);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchTeamData();
  }, [user?.id]);

  // Invite logic
  const handleInviteMember = async () => {
    if (!newMemberEmail) {
      toast.error('Please enter an email address');
      return;
    }
    if (!user?.id) {
      toast.error('User not found');
      return;
    }
    try {
      setLoading(true);
      
      // 1. Find or create the user's team
      let team = null;
      
      // First, try to find existing team membership
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (memberError) {
        console.error('Error checking team membership:', memberError);
      }
      
      if (memberTeams && memberTeams.length > 0) {
        // User is a team member, get their team
        const { data: teamsAsMember, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', memberTeams.map(tm => tm.team_id))
          .single();
        
        if (teamError) {
          console.error('Error getting team as member:', teamError);
        } else {
          team = teamsAsMember;
        }
      }
      
      // If no team found as member, check if user owns any teams
      if (!team) {
        const { data: ownedTeam, error: ownedError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('owner_id', user.id)
          .single();
        
        if (ownedError) {
          console.error('Error checking owned teams:', ownedError);
        } else {
          team = ownedTeam;
        }
      }
      
      // If still no team, create one
      if (!team || !team.id) {
        console.log('Creating new team for user:', user.id);
        
        // Create a new team
        const { data: newTeam, error: createTeamError } = await supabase
          .from('teams')
          .insert({
            name: user.user_metadata?.agency_name || user.user_metadata?.name || 'My Team',
            owner_id: user.id,
            max_members: 10
          })
          .select('id, name')
          .single();
        
        if (createTeamError) {
          console.error('Error creating team:', createTeamError);
          toast.error('Failed to create team');
          setLoading(false);
          return;
        }
        
        team = newTeam;
        
        // Add user as team member with owner role
        const { error: addMemberError } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email,
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString()
          });
        
        if (addMemberError) {
          console.error('Error adding user to team:', addMemberError);
        }
      }

      // 2. Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('email', newMemberEmail)
        .single();

      if (existingMember) {
        toast.error('User is already a team member');
        setLoading(false);
        return;
      }

      // 3. Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', team.id)
        .eq('email', newMemberEmail)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        toast.error('Invitation already sent to this email');
        setLoading(false);
        return;
      }

      // 4. Create invitation directly in Supabase
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: team.id,
          email: newMemberEmail,
          role: selectedRole,
          invited_by: user.id,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        toast.error('Failed to create invitation');
        setLoading(false);
        return;
      }

      // 5. Show invitation link and copy to clipboard
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/team-invitation?token=${invitation.token}`;
      
      toast.success(`Invitation created for ${newMemberEmail}!`);
      
      // Copy to clipboard automatically
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inviteLink);
          toast.success('Invitation link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          alert(`Invitation Link for ${newMemberEmail}:\n\n${inviteLink}`);
        }
      } else {
        alert(`Invitation Link for ${newMemberEmail}:\n\n${inviteLink}`);
      }

      setNewMemberEmail('');
      
      // 6. Refresh invites
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('id, email, role, status, created_at, updated_at')
        .eq('team_id', team.id)
        .eq('status', 'pending');
      setPendingInvites((invites as TeamInvite[]) || []);
      
    } catch (err) {
      console.error('Error inviting member:', err);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const canInviteMembers = teamRole === 'admin' || teamRole === 'owner';
  const canManageRoles = teamRole === 'admin' || teamRole === 'owner';

  // Function to handle role changes
  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Update the team member's role
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);
      
      if (error) {
        console.error('Error updating role:', error);
        toast.error('Failed to update role');
        return;
      }
      
      toast.success('Role updated successfully');
      setEditingRole(null);
      setNewRole('');
      
      // Refresh team data
      const fetchTeamData = async () => {
        try {
          let team = null;
          
          // Find user's team
          const { data: memberTeams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('status', 'active');
          
          if (memberTeams && memberTeams.length > 0) {
            const { data: teamsAsMember } = await supabase
              .from('teams')
              .select('id')
              .in('id', memberTeams.map(tm => tm.team_id))
              .single();
            team = teamsAsMember;
          }
          
          if (!team) {
            const { data: ownedTeam } = await supabase
              .from('teams')
              .select('id')
              .eq('owner_id', user.id)
              .single();
            team = ownedTeam;
          }
          
          if (!team || !team.id) return;
          
          // Refresh team members
          const { data: members } = await supabase
            .from('team_members')
            .select('id, name, email, role, status')
            .eq('team_id', team.id);
          
          setTeamMembers((members as TeamMember[]) || []);
        } catch (err) {
          console.error('Error refreshing team data:', err);
        }
      };
      
      await fetchTeamData();
      
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  // Function to resend invitation link
  const handleResendEmail = async (invitationId: string, email: string) => {
    try {
      setLoading(true);
      
      console.log('Resending invitation for ID:', invitationId, 'Email:', email);
      
      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .select('id, email, role, status, created_at, token, team_id, invited_by')
        .eq('id', invitationId)
        .single();
      
      if (invitationError || !invitation) {
        console.error('Invitation not found:', invitationError);
        toast.error('Invitation not found');
        return;
      }
      
      // Update the invitation's updated_at timestamp
      await supabase
        .from('team_invitations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', invitationId);
      
      // Show the invitation link and copy to clipboard
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/team-invitation?token=${invitation.token}`;
      
      toast.success(`Invitation link ready for ${email}!`);
      
      // Copy to clipboard automatically
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inviteLink);
          toast.success('Invitation link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          alert(`Invitation link for ${email}:\n\n${inviteLink}`);
        }
      } else {
        alert(`Invitation link for ${email}:\n\n${inviteLink}`);
      }
      
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Team Member - Only show for admin/owner */}
      {canInviteMembers && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Invite Team Member
            </CardTitle>
            <CardDescription>
              Send invitations to new team members to join your agency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="member-email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role" className="text-sm font-medium">Role</Label>
                <Select value={selectedRole} onValueChange={(value: 'member' | 'admin' | 'sales' | 'operations') => setSelectedRole(value)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales Consultant</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleInviteMember} 
              disabled={!newMemberEmail || loading}
              className="px-6 bg-primary hover:bg-primary/90 rounded-xl"
            >
              <User className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Show message for members who can't invite */}
      {!canInviteMembers && teamRole === 'member' && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Management Restricted</h3>
            <p className="text-muted-foreground mb-4">
              You have view-only access to team information. Only team admins and owners can invite or manage team members.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your team admin if you need to invite new team members.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Current team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading team members...</span>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>No team members yet</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingRole === member.id ? (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={newRole} 
                        onValueChange={(value: string) => setNewRole(value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleRoleChange(member.id, newRole)}
                        disabled={loading || !newRole}
                        className="h-8 px-2"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRole(null);
                          setNewRole('');
                        }}
                        className="h-8 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                      {canManageRoles && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRole(member.id);
                            setNewRole(member.role);
                          }}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations - Only show for admin/owner */}
      {canInviteMembers && pendingInvites.length > 0 && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations that are waiting for acceptance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                      {invite.updated_at && invite.updated_at !== invite.created_at && (
                        <span className="ml-2">• Last sent {new Date(invite.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{invite.role}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendEmail(invite.id, invite.email)}
                    disabled={loading}
                    className="h-8 px-3"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Team Features */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Team Features
          </CardTitle>
          <CardDescription>
            What you can do with team management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Multi-seat Dashboard</h4>
                <p className="text-xs text-muted-foreground">Up to 10 team members can access the platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Role-based Permissions</h4>
                <p className="text-xs text-muted-foreground">Control what each team member can access</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Shared Media Library</h4>
                <p className="text-xs text-muted-foreground">Access and share images across your team</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Team Analytics</h4>
                <p className="text-xs text-muted-foreground">Track team performance and collaboration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function Settings() {
  const { user } = useAuth();
  const [teamRole, setTeamRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      // Find the user's team membership
      const { data: member } = await supabase
        .from('team_members')
        .select('role, team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setTeamRole(member?.role || null);
    }
    fetchRole();
  }, [user]);



  return (
    <div className="mx-auto px-8 py-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and team with a beautiful, modern dashboard.
          </p>
        </div>
      </div>



      {/* Main Settings Card */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="bg-card rounded-t-2xl p-1">

              <TabsTrigger value="profile" className="transition-all duration-200 text-base py-4 rounded-xl">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="team" className="transition-all duration-200 text-base py-4 rounded-xl">
                <Users className="mr-2 h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="security" className="transition-all duration-200 text-base py-4 rounded-xl">
                <KeyRound className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 p-8">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="team" className="space-y-4 p-8">
              <TeamManagement />
            </TabsContent>
            <TabsContent value="security" className="space-y-4 p-8">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings; 