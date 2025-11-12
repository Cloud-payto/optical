export interface UserProfile {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  subscriptionTier: 'trial' | 'basic' | 'professional' | 'enterprise';
  trialEndsAt?: string;
  createdAt: string;
}

export interface UpdateProfileData {
  name?: string;
  businessName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  color: 'red' | 'yellow' | 'green';
}
