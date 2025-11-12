# Account System Implementation Guide

## Overview

This document describes the comprehensive user account system that has been implemented with enhanced signup functionality and a complete account settings interface.

## Components Implemented

### 1. Enhanced SignUp Form (`src/components/auth/SignUp.tsx`)

**Features:**
- Real-time email validation with visual feedback (checkmark/x icon)
- Password strength indicator with color-coded progress bar
- Password requirements validation (length, uppercase, lowercase, numbers, special chars)
- Confirm password matching validation
- Visual feedback on all fields (green/red borders when valid/invalid)
- Smooth animations using Framer Motion
- Integration with Supabase authentication via AuthContext
- Toast notifications for success/error states
- Disabled submit button when form is invalid
- Dark mode support

**Validation Rules:**
- Email: Must be valid email format
- Password: Minimum score of 3/5 (medium strength)
  - At least 8 characters
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character
- Confirm Password: Must match new password

### 2. Account Settings System

#### Main Container (`src/components/settings/AccountSettings.tsx`)

**Features:**
- Tabbed navigation with 4 sections
- Smooth tab transitions with Framer Motion
- Active tab indicator (sliding underline)
- Loading state while fetching profile data
- Automatic profile refresh after updates

**Tabs:**
1. Profile - Personal information
2. Business - Business details
3. Security - Password management
4. Theme - Appearance preferences

#### Profile Section (`src/components/settings/ProfileSection.tsx`)

**Editable Fields:**
- Full Name (required)
- Phone Number (optional, validated)
- Email Address (read-only)

**Features:**
- Inline editing with Edit/Save/Cancel buttons
- Real-time validation on blur
- Optimistic UI updates
- Phone number format validation
- Toast notifications for success/error
- Dark mode support

#### Business Section (`src/components/settings/BusinessSection.tsx`)

**Editable Fields:**
- Business Name
- Street Address
- City
- State (2-letter code, validated)
- Zip Code (5 or 9 digit format, validated)

**Features:**
- Inline editing pattern
- State code validation (US states only)
- Zip code format validation
- Responsive grid layout for City/State/Zip
- Save/Cancel functionality
- Error feedback below fields

#### Security Section (`src/components/settings/SecuritySection.tsx`)

**Features:**
- Password change form
- Current password field
- New password with strength indicator
- Confirm new password
- Requirements checklist in info box
- Show/hide password toggles on all fields
- Integration with Supabase auth.updateUser()
- Prevents using same password
- Form validation before submission

**Password Requirements:**
- Minimum 8 characters
- Uppercase and lowercase letters
- At least one number
- At least one special character

#### Theme Section (`src/components/settings/ThemeSection.tsx`)

**Features:**
- Three theme options: Light, Dark, System
- Visual cards with icons and descriptions
- Selected state with checkmark animation
- Integration with existing ThemeContext
- Automatic persistence to localStorage
- Smooth transitions between themes

### 3. Updated Settings Modal (`src/components/modals/SettingsModal.tsx`)

**Changes:**
- Expanded from single theme selector to full account settings
- Larger modal (max-w-4xl) to accommodate more content
- Scrollable content area
- Enhanced header with gradient background
- Integrated AccountSettings component
- Footer with Done button

## File Structure

```
src/
├── components/
│   ├── auth/
│   │   └── SignUp.tsx (Enhanced)
│   ├── settings/
│   │   ├── AccountSettings.tsx (Main container)
│   │   ├── ProfileSection.tsx
│   │   ├── BusinessSection.tsx
│   │   ├── SecuritySection.tsx
│   │   ├── ThemeSection.tsx
│   │   └── index.ts
│   └── modals/
│       └── SettingsModal.tsx (Updated)
├── types/
│   └── user.ts (New)
├── utils/
│   └── validation.ts (New)
└── services/
    └── api.ts (Already has updateAccount & getCurrentAccount)
```

## TypeScript Types

### User Profile Types (`src/types/user.ts`)

```typescript
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

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  color: 'red' | 'yellow' | 'green';
}
```

## Validation Utilities (`src/utils/validation.ts`)

### Available Functions:

1. `validateEmail(email: string)` - Email format validation
2. `validatePasswordStrength(password: string)` - Returns strength score and feedback
3. `validatePhone(phone: string)` - US phone number validation
4. `validateRequired(value: string, fieldName: string)` - Required field check
5. `validateZipCode(zipCode: string)` - US zip code format (5 or 5+4)
6. `validatePasswordsMatch(password: string, confirmPassword: string)` - Match check
7. `formatPhoneNumber(phone: string)` - Format for display
8. `validateStateCode(state: string)` - US state code validation

All validation functions return `{ isValid: boolean; error?: string }`

## API Integration

Uses existing services from `src/services/api.ts`:

- `getCurrentAccount()` - Fetch user profile data
- `updateAccount(data: UpdateAccountData)` - Update profile information

Uses `AuthContext` for:
- `signUp(email, password)` - User registration
- `user` - Current authenticated user
- `loading` - Auth loading state

Uses Supabase directly for:
- `supabase.auth.updateUser()` - Password changes

## Styling Patterns

### Input Fields
```tsx
<input
  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600
             rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white
             placeholder-gray-500 dark:placeholder-gray-400
             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
/>
```

### Icons in Inputs
```tsx
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
</div>
```

### Error Messages
```tsx
<p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
```

### Buttons
```tsx
// Primary action
<button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600
                   hover:from-blue-700 hover:to-purple-700 text-white rounded-lg
                   shadow-md hover:shadow-lg transition-all">
  Save Changes
</button>

// Secondary action
<button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300
                   dark:border-gray-600 text-gray-700 dark:text-gray-300
                   rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
  Cancel
</button>
```

## User Flow

### Signup Flow:
1. User enters email
2. Real-time email validation shows checkmark/error
3. User enters password
4. Password strength indicator updates in real-time
5. User confirms password
6. Match validation provides immediate feedback
7. Submit button disabled until all validations pass
8. On submit, calls `signUp()` from AuthContext
9. Success: Redirects to onboarding
10. Error: Toast notification with user-friendly message

### Settings Flow:
1. User opens Settings modal (via header icon)
2. AccountSettings component loads profile data
3. User can switch between 4 tabs
4. In Profile/Business tabs:
   - Click Edit button
   - Modify fields with inline validation
   - Click Save (optimistic update) or Cancel
5. In Security tab:
   - Enter current and new passwords
   - Real-time strength indicator
   - Submit to update password
6. In Theme tab:
   - Select preferred theme
   - Automatic save and persistence
7. Click Done to close modal

## Accessibility Features

- ARIA labels on all form fields
- Keyboard navigation support
- Focus management in modals
- Error announcements with role="alert"
- Proper button labels
- Tab navigation between fields
- Accessible color contrast in all themes

## Success/Error Handling

### Toast Notifications:
```typescript
// Success
toast.success('Profile updated successfully!');

// Error
toast.error('Failed to update profile');

// Loading (used in some contexts)
toast.loading('Updating profile...');
```

### Error States:
- Form validation errors shown inline below fields
- Toast notifications for API errors
- Visual feedback (red borders) on invalid fields
- Disabled submit buttons during loading
- Loading spinners on buttons during async operations

## Dark Mode Support

All components fully support dark mode using Tailwind's dark: prefix:
- Background colors: `bg-white dark:bg-[#1F2623]`
- Text colors: `text-gray-900 dark:text-white`
- Border colors: `border-gray-300 dark:border-gray-600`
- Hover states: `hover:bg-gray-50 dark:hover:bg-gray-800`

## Database Schema Requirements

The implementation expects the following database structure:

### `accounts` table:
```sql
- id (uuid, primary key)
- email (text)
- name (text)
- business_name (text, nullable)
- phone (text, nullable)
- address (text, nullable)
- city (text, nullable)
- state (text, nullable)
- zip_code (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

## Testing Checklist

### SignUp Component:
- [ ] Email validation works correctly
- [ ] Password strength indicator shows proper colors
- [ ] Password requirements are enforced
- [ ] Confirm password matching works
- [ ] Submit button disabled when invalid
- [ ] Success toast on successful signup
- [ ] Error toast on failed signup
- [ ] Redirects to onboarding after signup
- [ ] Dark mode styling works

### Profile Section:
- [ ] Edit button enables editing mode
- [ ] Name field validation works
- [ ] Phone number validation works
- [ ] Email is read-only
- [ ] Save button updates profile
- [ ] Cancel button reverts changes
- [ ] Toast notifications work
- [ ] Profile refreshes after update

### Business Section:
- [ ] All fields editable
- [ ] State code validation (2 letters, uppercase)
- [ ] Zip code validation (5 or 9 digits)
- [ ] Save updates all fields
- [ ] Cancel reverts changes
- [ ] Grid layout responsive

### Security Section:
- [ ] Password strength indicator works
- [ ] All password fields have show/hide toggle
- [ ] New password must differ from current
- [ ] Validation enforced before submit
- [ ] Success toast on password change
- [ ] Error toast on failure
- [ ] Form clears after success

### Theme Section:
- [ ] All three themes selectable
- [ ] Selected theme shows checkmark
- [ ] Theme persists after page refresh
- [ ] System theme follows OS preference
- [ ] Smooth transitions between themes

### Settings Modal:
- [ ] Opens and closes properly
- [ ] Tab navigation works
- [ ] Content scrollable if needed
- [ ] Done button closes modal
- [ ] Backdrop click closes modal
- [ ] Animations smooth

## Future Enhancements

Potential improvements for future iterations:

1. **Profile Photo Upload**
   - Add avatar image upload
   - Integration with cloud storage
   - Image cropping/resizing

2. **Two-Factor Authentication**
   - Enable 2FA in Security section
   - QR code generation
   - Backup codes

3. **Notification Preferences**
   - Email notifications toggle
   - Push notifications settings
   - Frequency preferences

4. **Account Deletion**
   - Delete account option in Security
   - Confirmation modal
   - Data export before deletion

5. **Session Management**
   - View active sessions
   - Logout from other devices
   - Session history

6. **Audit Log**
   - Track profile changes
   - Security events log
   - Login history

7. **Multi-language Support**
   - Language selector in settings
   - Translation files
   - RTL support

8. **Advanced Validation**
   - International phone formats
   - Additional address fields
   - Tax ID/EIN validation

## Troubleshooting

### Common Issues:

**Issue: Profile not loading**
- Check Supabase connection
- Verify user is authenticated
- Check browser console for errors
- Verify `getCurrentAccount()` function

**Issue: Updates not saving**
- Check network tab for API errors
- Verify Supabase RLS policies
- Check user permissions
- Verify field names match database

**Issue: Password change failing**
- User must be authenticated
- Check Supabase auth configuration
- Verify password meets requirements
- Check for network errors

**Issue: Theme not persisting**
- Check localStorage is enabled
- Verify ThemeContext is wrapping app
- Check for console errors
- Clear browser cache

## Conclusion

This implementation provides a complete, production-ready account management system with:
- Modern, intuitive UI/UX
- Comprehensive validation
- Real-time feedback
- Dark mode support
- Accessibility features
- Error handling
- Smooth animations
- Mobile-responsive design

All components follow existing patterns from the OptiProfit application and integrate seamlessly with the current architecture.
