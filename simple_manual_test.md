# Simple Manual Test for Account Creation

## 🎯 Quick Test Steps

1. **Navigate to**: `/crm/accounts/new`
2. **Open Developer Tools**: Press F12
3. **Go to Console tab**
4. **Fill out the form** with any test data:
   - Name: "Test Account"
   - Industry: Select any option
   - Business Type: "prospect"
5. **Click "Create Account"**
6. **Watch the console** for output

## 🔍 What to Look For

### ✅ SUCCESS (RLS Fix Worked)

```
✅ Account created successfully
Account creation response: { data: {...}, error: null }
```

### ❌ FAILURE (Still Has RLS Issue)

```
❌ Account creation failed: Error message
Database error: new row violates row-level security policy
```

### 🔄 NETWORK CHECK

If nothing appears in console:

1. Go to **Network tab** in DevTools
2. Look for requests to `crm_accounts`
3. Check if there are any 403/500 errors

## 🚀 Quick Console Commands

If you want to monitor in real-time, paste this in console before submitting:

```javascript
// Monitor form submission
console.log('🔍 Monitoring form submission...');

// Listen for any network errors
window.addEventListener('error', (e) => {
  console.log('❌ Error caught:', e.message);
});

// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log('📡 Network request:', args[0]);
  return originalFetch
    .apply(this, arguments)
    .then((response) => {
      console.log('📡 Response status:', response.status);
      return response;
    })
    .catch((error) => {
      console.log('❌ Network error:', error);
      throw error;
    });
};
```

## 🎯 Expected Result

After applying the RLS fix, account creation should work without "row-level security policy" errors.
