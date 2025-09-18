import { supabase } from '../supabaseClient';

/**
 * Setup tenant and user relationships for CRM functionality
 * This is a development/setup utility function
 */
export async function setupUserTenant(userId: string, email: string) {
  try {
    console.log('Setting up tenant for user:', userId, email);

    // Check if user already has a tenant (use maybeSingle to handle missing profile)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('current_tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile?.current_tenant_id) {
      console.log('User already has tenant:', existingProfile.current_tenant_id);
      return { success: true, tenant_id: existingProfile.current_tenant_id };
    }

    // Create a tenant for this user
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: `${email.split('@')[0]}'s Organization`,
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        industry: 'general',
        settings: {},
        metadata: {
          setup_type: 'auto',
          created_via: 'crm_setup'
        }
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      throw tenantError;
    }

    console.log('Created tenant:', tenant.id);

    // Update user profile with tenant (or create if doesn't exist)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: userId, 
        current_tenant_id: tenant.id
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      throw profileError;
    }

    // Add user to tenant_users with admin role
    const { error: tenantUserError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: 'admin',
        permissions: {
          'crm:accounts:write': true,
          'crm:contacts:write': true,
          'crm:deals:write': true,
          'crm:activities:write': true,
          'crm:campaigns:write': true
        },
        joined_at: new Date().toISOString()
      });

    if (tenantUserError) {
      console.error('Error creating tenant user:', tenantUserError);
      throw tenantUserError;
    }

    console.log('Setup complete for user:', userId);
    return { success: true, tenant_id: tenant.id };

  } catch (error) {
    console.error('Setup failed:', error);
    return { success: false, error };
  }
}

/**
 * Check if user has proper tenant setup
 */
export async function checkUserTenantSetup(userId: string) {
  try {
    // Check user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.current_tenant_id) {
      return { hasSetup: false, reason: 'No tenant assigned' };
    }

    // Check tenant user relationship
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, permissions')
      .eq('tenant_id', profile.current_tenant_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!tenantUser) {
      return { hasSetup: false, reason: 'Not a tenant member' };
    }

    const hasPermission = ['owner', 'admin', 'manager'].includes(tenantUser.role);
    
    return { 
      hasSetup: true, 
      tenant_id: profile.current_tenant_id,
      role: tenantUser.role,
      hasAccountPermission: hasPermission
    };

  } catch (error) {
    console.error('Error checking setup:', error);
    return { hasSetup: false, reason: 'Error checking setup', error };
  }
}
