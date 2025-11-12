// ============================================================
// API TYPES FOR USER ACCOUNT SYSTEM
// ============================================================

// User Profile Types
export interface UserProfile {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    created_at: string;
  };
  account: AccountData;
}

export interface AccountData {
  id: string;
  user_id: string;
  name: string;
  full_name: string | null;
  business_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  timezone: string;
  avatar_url: string | null;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscription_tier: 'trial' | 'basic' | 'professional' | 'enterprise';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_ends_at: string | null;
  notification_preferences: NotificationPreferences;
  display_preferences: DisplayPreferences;
  onboarding_completed: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface NotificationPreferences {
  email_orders: boolean;
  email_inventory: boolean;
  email_marketing: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

// API Request Types
export interface UpdateProfileRequest {
  full_name?: string;
  business_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface UpdatePreferencesRequest {
  notification_preferences?: Partial<NotificationPreferences>;
  display_preferences?: Partial<DisplayPreferences>;
}

export interface CompleteOnboardingRequest {
  business_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
