import { test, expect } from '@playwright/test';

/**
 * Direct API and Database Testing for CRM
 * Tests backend functionality without UI dependency
 */

test.describe('CRM API & Database Debug Tests', () => {
  
  test('Debug user profile and tenant setup via console', async ({ page }) => {
    console.log('=== CRM API DEBUGGING SESSION ===');
    
    // Navigate to CRM page to get access to the app context
    await page.goto('/crm/accounts/new');
    await page.waitForLoadState('networkidle');
    
    // Inject debugging script to test API calls directly
    const debugResults = await page.evaluate(async () => {
      const results = {
        timestamp: new Date().toISOString(),
        environment: {},
        auth: {},
        database: {},
        errors: []
      };
      
      try {
        // Check environment variables
        results.environment = {
          supabaseUrl: (window as any).VITE_SUPABASE_URL || 'Not set',
          hasAnonKey: !!(window as any).VITE_SUPABASE_ANON_KEY,
          nodeEnv: (window as any).NODE_ENV || 'Not set'
        };
        
        // Try to import and test Supabase client
        const supabaseModule = await import('/src/lib/supabaseClient.ts');
        const { supabase, authUtils } = supabaseModule;
        
        // Test auth state
        try {
          const { data: session } = await supabase.auth.getSession();
          const user = await authUtils.getCurrentUser();
          
          results.auth = {
            hasSession: !!session?.session,
            hasUser: !!user,
            userId: user?.id || null,
            userEmail: user?.email || null
          };
        } catch (authError: any) {
          results.errors.push(`Auth error: ${authError.message}`);
        }
        
        // Test database connectivity
        try {
          // Try a simple query first
          const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('id, name')
            .limit(1);
            
          if (tenantsError) {
            results.errors.push(`Tenants query error: ${tenantsError.message}`);
          } else {
            results.database.tenantsCount = tenants?.length || 0;
          }
        } catch (dbError: any) {
          results.errors.push(`Database error: ${dbError.message}`);
        }
        
        // Test user_profiles table specifically
        if (results.auth.userId) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', results.auth.userId)
              .maybeSingle();
              
            if (profileError) {
              results.errors.push(`Profile query error: ${profileError.message}`);
            } else {
              results.database.hasUserProfile = !!profile;
              results.database.userProfile = profile || null;
            }
          } catch (profileErr: any) {
            results.errors.push(`Profile test error: ${profileErr.message}`);
          }
          
          // Test tenant_users table
          try {
            const { data: tenantUsers, error: tenantUsersError } = await supabase
              .from('tenant_users')
              .select('*')
              .eq('user_id', results.auth.userId);
              
            if (tenantUsersError) {
              results.errors.push(`Tenant users query error: ${tenantUsersError.message}`);
            } else {
              results.database.tenantMemberships = tenantUsers?.length || 0;
              results.database.tenantUserData = tenantUsers || [];
            }
          } catch (tenantErr: any) {
            results.errors.push(`Tenant users test error: ${tenantErr.message}`);
          }
        }
        
        // Test RLS policies by trying to create a user profile
        if (results.auth.userId && !results.database.hasUserProfile) {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({ id: results.auth.userId })
              .select()
              .single();
              
            if (createError) {
              results.errors.push(`Profile creation RLS error: ${createError.message}`);
            } else {
              results.database.profileCreated = true;
              results.database.newProfile = newProfile;
            }
          } catch (createErr: any) {
            results.errors.push(`Profile creation error: ${createErr.message}`);
          }
        }
        
      } catch (generalError: any) {
        results.errors.push(`General error: ${generalError.message}`);
      }
      
      return results;
    });
    
    // Log comprehensive debug results
    console.log('\n=== ENVIRONMENT ===');
    console.log(JSON.stringify(debugResults.environment, null, 2));
    
    console.log('\n=== AUTHENTICATION ===');
    console.log(JSON.stringify(debugResults.auth, null, 2));
    
    console.log('\n=== DATABASE ===');
    console.log(JSON.stringify(debugResults.database, null, 2));
    
    console.log('\n=== ERRORS ===');
    debugResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    console.log('\n=== RECOMMENDATIONS ===');
    
    // Generate recommendations based on findings
    if (!debugResults.auth.hasUser) {
      console.log('❌ User not authenticated - need to log in first');
    }
    
    if (debugResults.errors.some(e => e.includes('RLS') || e.includes('row-level security'))) {
      console.log('❌ RLS Policy Issue - user_profiles table has restrictive policies');
      console.log('   💡 Suggestion: Check if user needs tenant setup first');
    }
    
    if (!debugResults.database.hasUserProfile && debugResults.auth.hasUser) {
      console.log('❌ Missing user profile - trigger may not be working');
      console.log('   💡 Suggestion: Create profile manually or fix trigger');
    }
    
    if (debugResults.database.tenantMemberships === 0 && debugResults.auth.hasUser) {
      console.log('❌ User not member of any tenant');
      console.log('   💡 Suggestion: Run tenant setup process first');
    }
    
    if (debugResults.errors.length === 0) {
      console.log('✅ No critical errors detected');
    }
    
    console.log('\n=================================');
    
    // Take screenshot for visual reference
    await page.screenshot({ path: 'test-results/api-debug-page.png', fullPage: true });
  });
  
  test('Test manual tenant and profile setup', async ({ page }) => {
    console.log('=== MANUAL SETUP TEST ===');
    
    await page.goto('/crm/accounts/new');
    await page.waitForLoadState('networkidle');
    
    const setupResults = await page.evaluate(async () => {
      const results = {
        steps: [],
        success: false,
        finalState: {}
      };
      
      try {
        const supabaseModule = await import('/src/lib/supabaseClient.ts');
        const { supabase, authUtils } = supabaseModule;
        
        // Get current user
        const user = await authUtils.getCurrentUser();
        if (!user) {
          results.steps.push('❌ No authenticated user');
          return results;
        }
        
        results.steps.push(`✅ Authenticated user: ${user.email}`);
        
        // Step 1: Check/Create user profile  
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (!existingProfile) {
          results.steps.push('🔄 No user profile found, need to create one');
          
          // Try to create profile manually (bypass RLS for testing)
          // This should fail due to RLS, which will help us understand the issue
          const { data: newProfile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({ id: user.id })
            .select()
            .single();
            
          if (profileError) {
            results.steps.push(`❌ Profile creation failed: ${profileError.message}`);
            
            // Try with service role if available (for testing only)
            results.steps.push('💡 This suggests RLS policy is blocking profile creation');
            results.steps.push('💡 Normal auth users cannot create their own profiles');
            results.steps.push('💡 Need to either: ');
            results.steps.push('   1. Fix the database trigger');
            results.steps.push('   2. Update RLS policies');
            results.steps.push('   3. Use service role for setup');
          } else {
            results.steps.push('✅ Profile created successfully');
          }
        } else {
          results.steps.push('✅ User profile exists');
          results.finalState = { ...results.finalState, profile: existingProfile };
        }
        
        // Step 2: Check tenant membership
        const { data: tenantMemberships } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', user.id);
          
        if (!tenantMemberships || tenantMemberships.length === 0) {
          results.steps.push('❌ User is not a member of any tenant');
          results.steps.push('💡 Need to create tenant and add user as member');
        } else {
          results.steps.push(`✅ User is member of ${tenantMemberships.length} tenant(s)`);
          results.finalState = { ...results.finalState, tenantMemberships };
        }
        
        results.success = !results.steps.some(step => step.includes('❌'));
        
      } catch (error: any) {
        results.steps.push(`❌ Setup test failed: ${error.message}`);
      }
      
      return results;
    });
    
    console.log('\n=== SETUP TEST RESULTS ===');
    setupResults.steps.forEach(step => console.log(step));
    
    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(setupResults.finalState, null, 2));
    
    console.log(`\n=== OVERALL SUCCESS: ${setupResults.success ? '✅' : '❌'} ===`);
  });
  
  test('Test direct account creation without UI', async ({ page }) => {
    console.log('=== DIRECT ACCOUNT CREATION TEST ===');
    
    await page.goto('/crm');
    await page.waitForLoadState('networkidle');
    
    const accountCreationResults = await page.evaluate(async () => {
      const results = {
        preparationSteps: [],
        creationAttempt: {},
        success: false
      };
      
      try {
        const supabaseModule = await import('/src/lib/supabaseClient.ts');
        const crmModule = await import('/src/lib/crm/crmClient.ts');
        const { supabase, authUtils } = supabaseModule;
        const { crmClient } = crmModule;
        
        // Get current user
        const user = await authUtils.getCurrentUser();
        if (!user) {
          results.preparationSteps.push('❌ No authenticated user');
          return results;
        }
        
        // Check user setup
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('current_tenant_id')
          .eq('id', user.id)
          .maybeSingle();
          
        if (!profile?.current_tenant_id) {
          results.preparationSteps.push('❌ No tenant assigned to user');
          
          // Try the auto-setup process
          try {
            const setupModule = await import('/src/lib/crm/setupTenant.ts');
            const { setupUserTenant } = setupModule;
            
            results.preparationSteps.push('🔄 Attempting auto-setup...');
            const setupResult = await setupUserTenant(user.id, user.email || '');
            
            if (setupResult.success) {
              results.preparationSteps.push('✅ Auto-setup succeeded');
            } else {
              results.preparationSteps.push(`❌ Auto-setup failed: ${setupResult.error?.message || 'Unknown error'}`);
            }
          } catch (setupError: any) {
            results.preparationSteps.push(`❌ Auto-setup error: ${setupError.message}`);
          }
        } else {
          results.preparationSteps.push('✅ User has tenant assignment');
        }
        
        // Try to create account
        try {
          const testAccount = {
            name: 'Test Account via API',
            industry: 'technology',
            business_type: 'prospect' as const,
            created_by: user.id,
            tenant_id: profile?.current_tenant_id
          };
          
          results.preparationSteps.push('🔄 Attempting account creation...');
          
          const { data: account, error: accountError } = await crmClient.createAccount(testAccount);
          
          if (accountError) {
            results.creationAttempt = {
              success: false,
              error: accountError.message || 'Unknown error',
              details: accountError
            };
          } else {
            results.creationAttempt = {
              success: true,
              accountId: account?.id,
              accountName: account?.name
            };
            results.success = true;
          }
          
        } catch (creationError: any) {
          results.creationAttempt = {
            success: false,
            error: creationError.message,
            type: 'Exception'
          };
        }
        
      } catch (generalError: any) {
        results.preparationSteps.push(`❌ General error: ${generalError.message}`);
      }
      
      return results;
    });
    
    console.log('\n=== PREPARATION STEPS ===');
    accountCreationResults.preparationSteps.forEach(step => console.log(step));
    
    console.log('\n=== ACCOUNT CREATION ATTEMPT ===');
    console.log(JSON.stringify(accountCreationResults.creationAttempt, null, 2));
    
    console.log(`\n=== FINAL RESULT: ${accountCreationResults.success ? '✅ SUCCESS' : '❌ FAILED'} ===`);
  });
});

test('Generate comprehensive API debug report', async ({ page }) => {
  console.log('\n'.repeat(3));
  console.log('='.repeat(60));
  console.log('         COMPREHENSIVE CRM DEBUG REPORT');
  console.log('='.repeat(60));
  console.log('📋 All debug information has been logged above');
  console.log('📸 Screenshots saved to test-results/ directory');
  console.log('🔍 Key areas to investigate:');
  console.log('   1. RLS policies on user_profiles table');
  console.log('   2. Database triggers for auto-profile creation');
  console.log('   3. Tenant setup and user membership');
  console.log('   4. Authentication and session state');
  console.log('='.repeat(60));
  
  await page.setContent(`
    <html>
      <head><title>CRM API Debug Report</title></head>
      <body style="font-family: monospace; padding: 20px;">
        <h1>🔧 CRM API Debug Report</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <h2>📊 Test Summary</h2>
        <ul>
          <li>✅ Environment check</li>
          <li>✅ Authentication state</li>
          <li>✅ Database connectivity</li>
          <li>✅ User profile investigation</li>
          <li>✅ Tenant setup testing</li>
          <li>✅ Direct account creation</li>
        </ul>
        <h2>🔍 Next Steps</h2>
        <p>Review the console output for detailed findings and specific error messages.</p>
      </body>
    </html>
  `);
  
  await page.screenshot({ path: 'test-results/api-debug-report.png', fullPage: true });
});
