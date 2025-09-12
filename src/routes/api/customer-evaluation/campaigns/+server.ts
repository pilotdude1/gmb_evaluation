import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { RequestHandler } from './$types';

// GET - Load saved campaigns/templates
export const GET: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user's saved campaigns
    const { data: campaigns, error: dbError } = await supabase
      .from('customer_evaluation_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to load campaigns' }, { status: 500 });
    }

    return json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error) {
    console.error('Campaigns GET API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

// POST - Save new campaign/template
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Parse request body
    const campaignData = await request.json();
    
    // Validate required fields
    if (!campaignData.name || !campaignData.searchParams) {
      return json({ 
        error: 'Missing required fields: name, searchParams' 
      }, { status: 400 });
    }

    // Generate campaign ID
    const campaignId = crypto.randomUUID();
    
    // Save campaign to database
    const { data: savedCampaign, error: dbError } = await supabase
      .from('customer_evaluation_campaigns')
      .insert({
        id: campaignId,
        user_id: user.id,
        name: campaignData.name,
        description: campaignData.description || '',
        search_params: campaignData.searchParams,
        is_template: campaignData.isTemplate || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to save campaign' }, { status: 500 });
    }

    return json({
      success: true,
      campaign: savedCampaign,
      message: 'Campaign saved successfully'
    });

  } catch (error) {
    console.error('Campaigns POST API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

// PUT - Update existing campaign
export const PUT: RequestHandler = async ({ request }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Parse request body
    const updateData = await request.json();
    
    // Validate required fields
    if (!updateData.id) {
      return json({ error: 'Missing campaign ID' }, { status: 400 });
    }

    // Update campaign in database
    const { data: updatedCampaign, error: dbError } = await supabase
      .from('customer_evaluation_campaigns')
      .update({
        name: updateData.name,
        description: updateData.description,
        search_params: updateData.searchParams,
        is_template: updateData.isTemplate,
        updated_at: new Date().toISOString()
      })
      .eq('id', updateData.id)
      .eq('user_id', user.id) // Ensure user can only update their own campaigns
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    if (!updatedCampaign) {
      return json({ error: 'Campaign not found' }, { status: 404 });
    }

    return json({
      success: true,
      campaign: updatedCampaign,
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Campaigns PUT API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

// DELETE - Delete campaign
export const DELETE: RequestHandler = async ({ request, url }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get campaign ID from query params
    const campaignId = url.searchParams.get('id');
    if (!campaignId) {
      return json({ error: 'Missing campaign ID' }, { status: 400 });
    }

    // Delete campaign from database
    const { error: dbError } = await supabase
      .from('customer_evaluation_campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('user_id', user.id); // Ensure user can only delete their own campaigns

    if (dbError) {
      console.error('Database error:', dbError);
      return json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Campaigns DELETE API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};
