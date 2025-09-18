import { supabase } from '../supabaseClient';
import type { Database } from '../database.types';

// CRM-specific types
export type CRMAccount = Database['public']['Tables']['crm_accounts']['Row'];
export type CRMContact = Database['public']['Tables']['crm_contacts']['Row'];
export type CRMDeal = Database['public']['Tables']['crm_deals']['Row'];
export type CRMActivity = Database['public']['Tables']['crm_activities']['Row'];
export type CRMCampaign = Database['public']['Tables']['crm_campaigns']['Row'];

export type CRMAccountInsert = Database['public']['Tables']['crm_accounts']['Insert'];
export type CRMContactInsert = Database['public']['Tables']['crm_contacts']['Insert'];
export type CRMDealInsert = Database['public']['Tables']['crm_deals']['Insert'];
export type CRMActivityInsert = Database['public']['Tables']['crm_activities']['Insert'];
export type CRMCampaignInsert = Database['public']['Tables']['crm_campaigns']['Insert'];

export type CRMAccountUpdate = Database['public']['Tables']['crm_accounts']['Update'];
export type CRMContactUpdate = Database['public']['Tables']['crm_contacts']['Update'];
export type CRMDealUpdate = Database['public']['Tables']['crm_deals']['Update'];
export type CRMActivityUpdate = Database['public']['Tables']['crm_activities']['Update'];
export type CRMCampaignUpdate = Database['public']['Tables']['crm_campaigns']['Update'];

// Tenant and User types
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type TenantUser = Database['public']['Tables']['tenant_users']['Row'];

/**
 * CRM Client - Provides high-level CRM operations
 */
export class CRMClient {
  constructor() {}

  // =====================================================
  // ACCOUNTS OPERATIONS
  // =====================================================

  /**
   * Get all accounts for the current tenant
   */
  async getAccounts(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    industry?: string;
    business_type?: string;
  }) {
    try {
      let query = supabase
        .from('crm_accounts')
        .select(`
          *,
          crm_contacts(count),
          crm_deals(count)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.search) {
        query = query.textSearch('search_vector', options.search);
      }
      
      if (options?.industry) {
        query = query.eq('industry', options.industry);
      }
      
      if (options?.business_type) {
        query = query.eq('business_type', options.business_type);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single account by ID
   */
  async getAccount(id: string) {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select(`
          *,
          crm_contacts(*),
          crm_deals(*),
          crm_activities(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching account:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new account
   */
  async createAccount(account: CRMAccountInsert) {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating account:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an account
   */
  async updateAccount(id: string, updates: CRMAccountUpdate) {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating account:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete an account
   */
  async deleteAccount(id: string) {
    try {
      const { error } = await supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { error };
    }
  }

  // =====================================================
  // CONTACTS OPERATIONS
  // =====================================================

  /**
   * Get all contacts for the current tenant
   */
  async getContacts(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    account_id?: string;
    lead_status?: string;
  }) {
    try {
      let query = supabase
        .from('crm_contacts')
        .select(`
          *,
          crm_accounts(name, industry),
          crm_activities(count)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.search) {
        query = query.textSearch('search_vector', options.search);
      }
      
      if (options?.account_id) {
        query = query.eq('account_id', options.account_id);
      }
      
      if (options?.lead_status) {
        query = query.eq('lead_status', options.lead_status);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string) {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select(`
          *,
          crm_accounts(*),
          crm_activities(*),
          crm_deals(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching contact:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contact: CRMContactInsert) {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a contact
   */
  async updateContact(id: string, updates: CRMContactUpdate) {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string) {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { error };
    }
  }

  // =====================================================
  // DEALS OPERATIONS
  // =====================================================

  /**
   * Get all deals for the current tenant
   */
  async getDeals(options?: {
    limit?: number;
    offset?: number;
    stage?: string;
    account_id?: string;
    assigned_to?: string;
  }) {
    try {
      let query = supabase
        .from('crm_deals')
        .select(`
          *,
          crm_accounts(name, industry),
          crm_contacts(first_name, last_name, email),
          crm_activities(count)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.stage) {
        query = query.eq('stage', options.stage);
      }
      
      if (options?.account_id) {
        query = query.eq('account_id', options.account_id);
      }
      
      if (options?.assigned_to) {
        query = query.eq('assigned_to', options.assigned_to);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching deals:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string) {
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_accounts(*),
          crm_contacts(*),
          crm_activities(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching deal:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(deal: CRMDealInsert) {
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating deal:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(id: string, updates: CRMDealUpdate) {
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating deal:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string) {
    try {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting deal:', error);
      return { error };
    }
  }

  // =====================================================
  // ACTIVITIES OPERATIONS
  // =====================================================

  /**
   * Get activities for an account, contact, or deal
   */
  async getActivities(options?: {
    limit?: number;
    offset?: number;
    account_id?: string;
    contact_id?: string;
    deal_id?: string;
    activity_type?: string;
  }) {
    try {
      let query = supabase
        .from('crm_activities')
        .select(`
          *,
          crm_accounts(name),
          crm_contacts(first_name, last_name),
          crm_deals(name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.account_id) {
        query = query.eq('account_id', options.account_id);
      }
      
      if (options?.contact_id) {
        query = query.eq('contact_id', options.contact_id);
      }
      
      if (options?.deal_id) {
        query = query.eq('deal_id', options.deal_id);
      }
      
      if (options?.activity_type) {
        query = query.eq('activity_type', options.activity_type);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(activity: CRMActivityInsert) {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // DASHBOARD & ANALYTICS
  // =====================================================

  /**
   * Get CRM dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [accountsResult, contactsResult, dealsResult, activitiesResult] = await Promise.all([
        supabase.from('crm_accounts').select('id, business_type, lead_score').range(0, 1000),
        supabase.from('crm_contacts').select('id, lead_status, lead_score').range(0, 1000),
        supabase.from('crm_deals').select('id, stage, deal_value, probability').range(0, 1000),
        supabase.from('crm_activities').select('id, activity_type, created_at').range(0, 1000)
      ]);

      if (accountsResult.error) throw accountsResult.error;
      if (contactsResult.error) throw contactsResult.error;
      if (dealsResult.error) throw dealsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      const accounts = accountsResult.data || [];
      const contacts = contactsResult.data || [];
      const deals = dealsResult.data || [];
      const activities = activitiesResult.data || [];

      // Calculate statistics
      const stats = {
        accounts: {
          total: accounts.length,
          prospects: accounts.filter(a => a.business_type === 'prospect').length,
          customers: accounts.filter(a => a.business_type === 'customer').length,
          avgLeadScore: accounts.reduce((sum, a) => sum + (a.lead_score || 0), 0) / accounts.length || 0
        },
        contacts: {
          total: contacts.length,
          new: contacts.filter(c => c.lead_status === 'new').length,
          qualified: contacts.filter(c => c.lead_status === 'qualified').length,
          opportunities: contacts.filter(c => c.lead_status === 'opportunity').length,
          customers: contacts.filter(c => c.lead_status === 'customer').length
        },
        deals: {
          total: deals.length,
          totalValue: deals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0),
          avgValue: deals.length > 0 ? deals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0) / deals.length : 0,
          pipelineValue: deals
            .filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage || ''))
            .reduce((sum, d) => sum + (Number(d.deal_value) || 0) * ((d.probability || 0) / 100), 0)
        },
        activities: {
          total: activities.length,
          thisWeek: activities.filter(a => {
            const activityDate = new Date(a.created_at || '');
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return activityDate >= weekAgo;
          }).length,
          byType: activities.reduce((acc, a) => {
            acc[a.activity_type || 'unknown'] = (acc[a.activity_type || 'unknown'] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: null, error };
    }
  }
}

// Export a singleton instance
export const crmClient = new CRMClient();
