# Account System Component Structure

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AuthProvider                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           ThemeProvider                      │   │   │
│  │  │                                              │   │   │
│  │  │  ┌────────────────────────────────────┐    │   │   │
│  │  │  │        Login/SignUp Page           │    │   │   │
│  │  │  │  ┌──────────────────────────┐     │    │   │   │
│  │  │  │  │    SignUp.tsx            │     │    │   │   │
│  │  │  │  │  - Email validation      │     │    │   │   │
│  │  │  │  │  - Password strength     │     │    │   │   │
│  │  │  │  │  - Real-time feedback    │     │    │   │   │
│  │  │  │  └──────────────────────────┘     │    │   │   │
│  │  │  └────────────────────────────────────┘    │   │   │
│  │  │                                              │   │   │
│  │  │  ┌────────────────────────────────────┐    │   │   │
│  │  │  │        Main App (Logged In)        │    │   │   │
│  │  │  │                                     │    │   │   │
│  │  │  │  ┌──────────────────────────┐     │    │   │   │
│  │  │  │  │   Header Component       │     │    │   │   │
│  │  │  │  │   - Settings Icon        │     │    │   │   │
│  │  │  │  └──────────┬───────────────┘     │    │   │   │
│  │  │  │             │                      │    │   │   │
│  │  │  │             ▼                      │    │   │   │
│  │  │  │  ┌──────────────────────────────┐ │    │   │   │
│  │  │  │  │    SettingsModal.tsx         │ │    │   │   │
│  │  │  │  │  ┌──────────────────────┐   │ │    │   │   │
│  │  │  │  │  │  AccountSettings.tsx │   │ │    │   │   │
│  │  │  │  │  │                      │   │ │    │   │   │
│  │  │  │  │  │  [Tab Navigation]    │   │ │    │   │   │
│  │  │  │  │  │  ┌─────────────────┐│   │ │    │   │   │
│  │  │  │  │  │  │ ProfileSection  ││   │ │    │   │   │
│  │  │  │  │  │  ├─────────────────┤│   │ │    │   │   │
│  │  │  │  │  │  │ BusinessSection ││   │ │    │   │   │
│  │  │  │  │  │  ├─────────────────┤│   │ │    │   │   │
│  │  │  │  │  │  │ SecuritySection ││   │ │    │   │   │
│  │  │  │  │  │  ├─────────────────┤│   │ │    │   │   │
│  │  │  │  │  │  │ ThemeSection    ││   │ │    │   │   │
│  │  │  │  │  │  └─────────────────┘│   │ │    │   │   │
│  │  │  │  │  └──────────────────────┘   │ │    │   │   │
│  │  │  │  └──────────────────────────────┘ │    │   │   │
│  │  │  └────────────────────────────────────┘    │   │   │
│  │  └──────────────────────────────────────────────┘   │
│  └─────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### SignUp Flow
```
User Input → SignUp.tsx
              ↓
         Validation Utils (validation.ts)
              ↓
         AuthContext.signUp()
              ↓
         Supabase Auth
              ↓
    Success: Redirect to Onboarding
    Error: Toast Notification
```

### Profile Update Flow
```
User Clicks Edit → ProfileSection.tsx
                         ↓
                   Inline Editing
                         ↓
                   Validation
                         ↓
               api.updateAccount()
                         ↓
                   Supabase DB
                         ↓
                 Toast Notification
                         ↓
              Refresh Profile Data
```

### Password Change Flow
```
User Enters Passwords → SecuritySection.tsx
                              ↓
                         Validation
                              ↓
                  supabase.auth.updateUser()
                              ↓
                     Supabase Auth
                              ↓
                    Toast Notification
                              ↓
                      Clear Form
```

## State Management

### Component-Level State

**SignUp.tsx:**
```typescript
- formData: { email, password, confirmPassword }
- showPassword: boolean
- showConfirmPassword: boolean
- touched: { email, password, confirmPassword }
- isSubmitting: boolean
```

**ProfileSection.tsx:**
```typescript
- isEditing: boolean
- isSaving: boolean
- formData: { name, phone }
- errors: Record<string, string>
```

**BusinessSection.tsx:**
```typescript
- isEditing: boolean
- isSaving: boolean
- formData: { businessName, address, city, state, zipCode }
- errors: Record<string, string>
```

**SecuritySection.tsx:**
```typescript
- formData: { currentPassword, newPassword, confirmPassword }
- showPasswords: { current, new, confirm }
- isChanging: boolean
```

**AccountSettings.tsx:**
```typescript
- activeTab: 'profile' | 'business' | 'security' | 'theme'
- profile: UserProfile | null
- isLoading: boolean
```

### Context State

**AuthContext:**
```typescript
- user: User | null
- session: Session | null
- loading: boolean
- isAuthenticated: boolean
- signUp(email, password)
- signIn(email, password)
- signOut()
```

**ThemeContext:**
```typescript
- theme: 'light' | 'dark' | 'system'
- setTheme(theme)
- actualTheme: 'light' | 'dark'
```

## API Integration Points

### Authentication (`AuthContext`)
- `signUp(email, password)` - New user registration
- `signIn(email, password)` - User login
- `signOut()` - User logout
- `user` - Current authenticated user

### Account Management (`api.ts`)
- `getCurrentAccount()` - GET /accounts/:userId
- `updateAccount(data)` - PUT /accounts/:userId

### Direct Supabase
- `supabase.auth.updateUser({ password })` - Password change
- `supabase.from('accounts').select()` - Direct DB queries
- `supabase.from('accounts').update()` - Direct DB updates

## Validation Flow

```
Input Field
    ↓
onChange Event
    ↓
Update State
    ↓
onBlur Event
    ↓
validation.ts Function
    ↓
{ isValid, error? }
    ↓
Update UI (borders, messages)
    ↓
Update Submit Button State
```

### Validation Functions Used:

**SignUp.tsx:**
- `validateEmail()`
- `validatePasswordStrength()`
- `validatePasswordsMatch()`

**ProfileSection.tsx:**
- `validateRequired()`
- `validatePhone()`

**BusinessSection.tsx:**
- `validateZipCode()`
- `validateStateCode()`

**SecuritySection.tsx:**
- `validatePasswordStrength()`
- `validatePasswordsMatch()`

## Event Handlers

### Common Patterns:

**Edit Mode Toggle:**
```typescript
handleEdit() {
  setIsEditing(true)
  setFormData(currentProfile)
  setErrors({})
}
```

**Cancel Edit:**
```typescript
handleCancel() {
  setIsEditing(false)
  setFormData(originalProfile)
  setErrors({})
}
```

**Form Submission:**
```typescript
handleSubmit(e) {
  e.preventDefault()
  if (!validateForm()) return
  setIsSaving(true)
  try {
    await updateAccount(formData)
    toast.success('Updated!')
    setIsEditing(false)
    onUpdate()
  } catch (error) {
    toast.error('Failed')
  } finally {
    setIsSaving(false)
  }
}
```

## Animation Patterns

### Framer Motion Usage:

**Tab Transitions:**
```tsx
<motion.div
  key={activeTab}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
/>
```

**Active Tab Indicator:**
```tsx
<motion.div
  layoutId="activeTab"
  className="absolute bottom-0 h-0.5 bg-blue-600"
/>
```

**Password Strength Bar:**
```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.3 }}
/>
```

**Save/Cancel Buttons:**
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
/>
```

## Styling System

### Utility Classes:

**Input Fields:**
- Base: `block w-full px-3 py-2.5 border rounded-lg`
- Light: `bg-white text-gray-900 border-gray-300`
- Dark: `dark:bg-[#1F2623] dark:text-white dark:border-gray-600`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Validation: `border-green-500` or `border-red-500`

**Buttons:**
- Primary: `bg-gradient-to-r from-blue-600 to-purple-600`
- Secondary: `bg-white dark:bg-gray-800 border`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

**Cards/Sections:**
- Background: `bg-white dark:bg-[#1F2623]`
- Border: `border border-gray-200 dark:border-gray-700`
- Shadow: `shadow-sm hover:shadow-md`

## Accessibility Features

### ARIA Attributes:
- `aria-label` on all form fields
- `role="alert"` on error messages
- `aria-describedby` for field descriptions
- `aria-invalid` on invalid fields

### Keyboard Navigation:
- Tab through all fields
- Enter to submit forms
- Escape to close modals
- Arrow keys for tab navigation

### Screen Reader Support:
- Descriptive labels
- Error announcements
- State changes announced
- Loading states indicated

## Error Handling Strategy

### Levels of Error Handling:

1. **Client-Side Validation** (Immediate)
   - Field validation on blur
   - Form validation on submit
   - Visual feedback (borders, messages)

2. **API Error Handling** (Network)
   - Try-catch blocks
   - Toast notifications
   - Rollback on failure
   - Maintain previous state

3. **Authentication Errors** (Auth)
   - Handled in AuthContext
   - User-friendly messages
   - Redirect on auth failure

4. **Network Errors** (Connection)
   - Timeout handling
   - Retry logic (in some cases)
   - Offline indicators

## Performance Considerations

### Optimizations:

1. **Lazy Loading**
   - Settings modal loads on demand
   - Profile data fetched when modal opens

2. **Debouncing**
   - Could add to real-time validation
   - Currently validates on blur

3. **Memoization**
   - Validation results cached per render
   - Re-computed only when inputs change

4. **Code Splitting**
   - Settings components in separate files
   - Loaded only when needed

5. **Optimistic Updates**
   - UI updates before API response
   - Rollback on error

## Security Considerations

### Implemented Security:

1. **Password Requirements**
   - Minimum length enforced
   - Complexity requirements
   - Strength indicator

2. **Input Sanitization**
   - Validation before submission
   - Type checking
   - Length limits

3. **Secure Communication**
   - HTTPS only (in production)
   - Supabase secure connections
   - Auth tokens in headers

4. **Session Management**
   - Handled by Supabase Auth
   - Secure cookie storage
   - Automatic token refresh

5. **No Sensitive Data in State**
   - Passwords not stored
   - Cleared after submission
   - Only user ID persisted

## Testing Strategy

### Unit Tests (Recommended):
- Validation functions
- Component rendering
- Event handlers
- State updates

### Integration Tests (Recommended):
- Form submission flows
- API integration
- Authentication flows
- Error scenarios

### E2E Tests (Recommended):
- Complete signup flow
- Profile update flow
- Password change flow
- Theme switching

## Mobile Responsiveness

### Breakpoints:

**Small Screens (< 640px):**
- Single column layout
- Stacked form fields
- Full-width buttons
- Reduced padding

**Medium Screens (640px - 1024px):**
- Two column grids where appropriate
- Sidebar navigation possible
- Comfortable spacing

**Large Screens (> 1024px):**
- Multi-column layouts
- Maximum width containers
- Generous spacing
- Enhanced hover effects

### Touch Interactions:
- Larger tap targets (min 44x44px)
- No hover-only functionality
- Swipe gestures (future)
- Touch-friendly spacing

## Browser Compatibility

### Supported Browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Fallbacks:
- CSS Grid fallbacks
- Flexbox alternatives
- Animation graceful degradation
- Color contrast maintained

## Conclusion

This component structure provides:
- Clear separation of concerns
- Reusable components
- Consistent patterns
- Maintainable code
- Scalable architecture
- Excellent user experience
