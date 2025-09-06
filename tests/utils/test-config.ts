// Test configuration for real authentication tests
export const testConfig = {
  // Test user credentials - replace with your actual test user
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  },

  // Invalid credentials for testing error scenarios
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },

  // Test timeouts
  timeouts: {
    authentication: 10000, // 10 seconds for auth operations
    navigation: 5000, // 5 seconds for navigation
    element: 3000, // 3 seconds for element interactions
  },

  // Test URLs
  urls: {
    login: '/',
    dashboard: '/dashboard',
    signup: '/signup',
    forgotPassword: '/forgot-password',
  },

  // Error messages to expect
  errorMessages: {
    invalidCredentials: 'Invalid email or password',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    invalidEmailFormat: 'Please enter a valid email address',
    networkError: 'An unexpected error occurred',
  },

  // Success messages to expect
  successMessages: {
    loginSuccess: 'Login successful!',
    logoutSuccess: 'Logged out successfully!',
  },
};

// Helper function to get test user credentials
export function getTestUser() {
  return testConfig.testUser;
}

// Helper function to get invalid user credentials
export function getInvalidUser() {
  return testConfig.invalidUser;
}

// Helper function to check if we have valid test credentials
export function hasValidTestCredentials(): boolean {
  const user = getTestUser();
  return (
    user.email !== 'test@example.com' && user.password !== 'testpassword123'
  );
}
