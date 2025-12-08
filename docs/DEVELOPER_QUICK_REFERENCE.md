# Developer Quick Reference - Account System

## Quick Start

### Import the Components

```typescript
// SignUp Component
import SignUp from './components/auth/SignUp';

// Settings Modal
import { SettingsModal } from './components/modals/SettingsModal';

// Individual Settings Components
import {
  AccountSettings,
  ProfileSection,
  BusinessSection,
  SecuritySection,
  ThemeSection
} from './components/settings';

// Validation Utilities
import {
  validateEmail,
  validatePasswordStrength,
  validatePhone,
  validateZipCode,
  validateStateCode,
  validatePasswordsMatch,
  validateRequired
} from './utils/validation';

// Types
import {
  UserProfile,
  UpdateProfileData,
  PasswordChangeData,
  PasswordStrength
} from './types/user';
```

## Common Use Cases

### 1. Add Signup to Your Auth Flow

```typescript
import { useState } from 'react';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div>
      {isSignUp ? (
        <SignUp onToggleMode={() => setIsSignUp(false)} />
      ) : (
        <SignIn onToggleMode={() => setIsSignUp(true)} />
      )}
    </div>
  );
}
```

### 2. Add Settings Button to Header

```typescript
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './components/modals/SettingsModal';

function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header>
        <button onClick={() => setShowSettings(true)}>
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
```

### 3. Validate Email Input

```typescript
import { useState } from 'react';
import { validateEmail } from './utils/validation';

function EmailInput() {
  const [email, setEmail] = useState('');
  const validation = validateEmail(email);

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={validation.isValid ? 'border-green-500' : 'border-red-500'}
      />
      {!validation.isValid && validation.error && (
        <p className="text-red-600">{validation.error}</p>
      )}
    </div>
  );
}
```

### 4. Password Strength Indicator

```typescript
import { validatePasswordStrength } from './utils/validation';

function PasswordInput() {
  const [password, setPassword] = useState('');
  const strength = validatePasswordStrength(password);

  const getColor = () => {
    const colors = { red: 'bg-red-500', yellow: 'bg-yellow-500', green: 'bg-green-500' };
    return colors[strength.color];
  };

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="h-1.5 bg-gray-200 rounded">
        <div
          className={`h-full ${getColor()}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
      <p className={`text-xs text-${strength.color}-600`}>
        {strength.feedback}
      </p>
    </div>
  );
}
```

### 5. Update User Profile

```typescript
import { updateAccount } from './services/api';
import toast from 'react-hot-toast';

async function updateUserProfile(data: UpdateProfileData) {
  try {
    await updateAccount(data);
    toast.success('Profile updated successfully!');
  } catch (error) {
    toast.error('Failed to update profile');
    console.error(error);
  }
}

// Usage
updateUserProfile({
  name: 'John Doe',
  phone: '(555) 123-4567',
  businessName: 'ABC Optical'
});
```

### 6. Change Password

```typescript
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';
import { validatePasswordStrength } from './utils/validation';

async function changePassword(newPassword: string) {
  // Validate password strength
  const strength = validatePasswordStrength(newPassword);
  if (strength.score < 3) {
    toast.error('Password is too weak');
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    toast.success('Password updated successfully!');
  } catch (error) {
    toast.error('Failed to update password');
    console.error(error);
  }
}
```

## Validation Functions Reference

### validateEmail(email: string)
```typescript
const result = validateEmail('test@example.com');
// Returns: { isValid: true }

const result2 = validateEmail('invalid-email');
// Returns: { isValid: false, error: 'Please enter a valid email address' }
```

### validatePasswordStrength(password: string)
```typescript
const result = validatePasswordStrength('Test123!');
// Returns: {
//   score: 4,
//   feedback: 'Strong password',
//   color: 'green'
// }
```

### validatePhone(phone: string)
```typescript
const result = validatePhone('(555) 123-4567');
// Returns: { isValid: true }

const result2 = validatePhone('123');
// Returns: { isValid: false, error: 'Please enter a valid phone number (10 digits)' }
```

### validateZipCode(zipCode: string)
```typescript
const result = validateZipCode('12345');
// Returns: { isValid: true }

const result2 = validateZipCode('12345-6789');
// Returns: { isValid: true }

const result3 = validateZipCode('123');
// Returns: { isValid: false, error: '...' }
```

### validateStateCode(state: string)
```typescript
const result = validateStateCode('CA');
// Returns: { isValid: true }

const result2 = validateStateCode('XX');
// Returns: { isValid: false, error: 'Please enter a valid US state code' }
```

### validatePasswordsMatch(password: string, confirmPassword: string)
```typescript
const result = validatePasswordsMatch('Test123!', 'Test123!');
// Returns: { isValid: true }

const result2 = validatePasswordsMatch('Test123!', 'Different');
// Returns: { isValid: false, error: 'Passwords do not match' }
```

### validateRequired(value: string, fieldName: string)
```typescript
const result = validateRequired('John Doe', 'Name');
// Returns: { isValid: true }

const result2 = validateRequired('', 'Name');
// Returns: { isValid: false, error: 'Name is required' }
```

### formatPhoneNumber(phone: string)
```typescript
const formatted = formatPhoneNumber('5551234567');
// Returns: '(555) 123-4567'

const formatted2 = formatPhoneNumber('15551234567');
// Returns: '+1 (555) 123-4567'
```

## API Functions Reference

### getCurrentAccount()
```typescript
import { getCurrentAccount } from './services/api';

const profile = await getCurrentAccount();
// Returns:
// {
//   id: 'uuid',
//   name: 'John Doe',
//   email: 'john@example.com',
//   business_name: 'ABC Optical',
//   phone: '(555) 123-4567',
//   address: '123 Main St',
//   city: 'New York',
//   state: 'NY',
//   zip_code: '10001'
// }
```

### updateAccount(data: UpdateAccountData)
```typescript
import { updateAccount } from './services/api';

await updateAccount({
  name: 'John Doe',
  businessName: 'ABC Optical',
  phone: '(555) 123-4567',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001'
});
// Returns: void (throws on error)
```

## Common Patterns

### Inline Edit Pattern

```typescript
function EditableField() {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('Initial Value');
  const [savedValue, setSavedValue] = useState('Initial Value');

  const handleSave = async () => {
    try {
      await updateAccount({ name: value });
      setSavedValue(value);
      setIsEditing(false);
      toast.success('Saved!');
    } catch (error) {
      setValue(savedValue); // Rollback
      toast.error('Failed to save');
    }
  };

  const handleCancel = () => {
    setValue(savedValue);
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <>
          <input value={value} onChange={(e) => setValue(e.target.value)} />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      ) : (
        <>
          <span>{savedValue}</span>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
}
```

### Form with Validation

```typescript
import { useState } from 'react';
import { validateEmail, validateRequired } from './utils/validation';
import toast from 'react-hot-toast';

function ValidatedForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [touched, setTouched] = useState({ name: false, email: false });

  const nameValidation = validateRequired(formData.name, 'Name');
  const emailValidation = validateEmail(formData.email);

  const isValid = nameValidation.isValid && emailValidation.isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ name: true, email: true });

    if (!isValid) {
      toast.error('Please fix the errors');
      return;
    }

    // Submit form
    await updateAccount(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        onBlur={() => setTouched({ ...touched, name: true })}
        className={touched.name && !nameValidation.isValid ? 'border-red-500' : ''}
      />
      {touched.name && !nameValidation.isValid && (
        <p className="text-red-600">{nameValidation.error}</p>
      )}

      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        onBlur={() => setTouched({ ...touched, email: true })}
        className={touched.email && !emailValidation.isValid ? 'border-red-500' : ''}
      />
      {touched.email && !emailValidation.isValid && (
        <p className="text-red-600">{emailValidation.error}</p>
      )}

      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

### Loading State Pattern

```typescript
function AsyncAction() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await updateAccount({ name: 'New Name' });
      toast.success('Success!');
    } catch (error) {
      toast.error('Failed!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleAction} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Loading...</span>
        </>
      ) : (
        'Submit'
      )}
    </button>
  );
}
```

## Styling Reference

### Input Field Styles

```typescript
// Base input class
const baseInputClass = `
  block w-full px-3 py-2.5 border rounded-lg
  bg-white dark:bg-[#1F2623]
  text-gray-900 dark:text-white
  placeholder-gray-500 dark:placeholder-gray-400
  focus:ring-2 focus:ring-blue-500 focus:border-transparent
  transition-colors
`;

// With validation
const getInputClass = (isValid: boolean, touched: boolean) => `
  ${baseInputClass}
  ${touched && !isValid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
`;

// With icon (left padding)
const inputWithIconClass = `${baseInputClass} pl-10`;
```

### Button Styles

```typescript
// Primary button
const primaryButton = `
  px-4 py-2 rounded-lg font-medium
  bg-gradient-to-r from-blue-600 to-purple-600
  hover:from-blue-700 hover:to-purple-700
  text-white shadow-md hover:shadow-lg
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`;

// Secondary button
const secondaryButton = `
  px-4 py-2 rounded-lg font-medium
  bg-white dark:bg-gray-800
  border border-gray-300 dark:border-gray-600
  text-gray-700 dark:text-gray-300
  hover:bg-gray-50 dark:hover:bg-gray-700
  transition-colors
`;
```

### Error Message Style

```typescript
const errorMessage = `
  mt-1 text-sm text-red-600 dark:text-red-400
`;
```

## Toast Notifications

```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Profile updated successfully!');

// Error
toast.error('Failed to update profile');

// Loading (with promise)
toast.promise(
  updateAccount(data),
  {
    loading: 'Updating...',
    success: 'Updated!',
    error: 'Failed!'
  }
);

// Custom duration
toast.success('Done!', { duration: 4000 });

// With icon
toast.success('Done!', { icon: '✅' });
```

## Animation Examples

### Fade In
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

### Slide In
```typescript
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

### Scale In
```typescript
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.95, opacity: 0 }}
>
  Content
</motion.div>
```

### Layout Animation
```typescript
<motion.div
  layoutId="uniqueId"
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
/>
```

## Troubleshooting

### Issue: TypeScript errors in validation functions
**Solution:** Ensure you've imported the correct types from `src/types/user.ts`

### Issue: API calls failing
**Solution:**
1. Check user is authenticated
2. Verify Supabase connection
3. Check RLS policies in database

### Issue: Theme not updating
**Solution:**
1. Ensure ThemeProvider wraps your app
2. Check localStorage permissions
3. Verify ThemeContext is imported correctly

### Issue: Toast notifications not showing
**Solution:**
1. Ensure react-hot-toast Toaster is in your app root
2. Check z-index conflicts
3. Verify toast is being called

### Issue: Validation not working
**Solution:**
1. Check validation function is imported correctly
2. Verify field values are strings
3. Check console for errors

## Best Practices

1. **Always validate on blur, not just on submit**
2. **Provide immediate visual feedback**
3. **Use optimistic updates with rollback on error**
4. **Show loading states during async operations**
5. **Clear sensitive data (passwords) after submission**
6. **Use toast notifications for user feedback**
7. **Handle all error cases gracefully**
8. **Test dark mode for all components**
9. **Ensure mobile responsiveness**
10. **Add ARIA labels for accessibility**

## Next Steps

1. Review the full implementation guide: `ACCOUNT_SYSTEM_IMPLEMENTATION.md`
2. Check component structure: `COMPONENT_STRUCTURE.md`
3. Test the signup flow
4. Test the settings modal
5. Customize styling to match your brand
6. Add additional validation as needed
7. Implement automated tests
8. Deploy to production

## Support

For issues or questions:
1. Check the implementation docs
2. Review the component structure
3. Check console for errors
4. Verify Supabase configuration
5. Test in incognito mode to rule out cache issues
