import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
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

    // Get session ID from query params
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    // Get search progress from database
    const { data: searchRecord, error: dbError } = await supabase
      .from('customer_evaluation_searches')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only access their own searches
      .single();

    if (dbError || !searchRecord) {
      return json({ error: 'Search not found' }, { status: 404 });
    }

    // Get results count if completed
    let resultsCount = 0;
    if (searchRecord.status === 'completed') {
      const { count } = await supabase
        .from('customer_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('search_session_id', sessionId);
      
      resultsCount = count || 0;
    }

    // Return progress information
    return json({
      sessionId,
      status: searchRecord.status,
      currentStep: getStepFromStatus(searchRecord.status),
      foundCount: searchRecord.found_count || 0,
      totalSteps: 6,
      startedAt: searchRecord.created_at,
      updatedAt: searchRecord.updated_at,
      errorMessage: searchRecord.error_message,
      resultsCount,
      isCompleted: searchRecord.status === 'completed',
      isFailed: searchRecord.status === 'failed'
    });

  } catch (error) {
    console.error('Progress API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

// Helper function to convert status to step number
function getStepFromStatus(status: string): number {
  const statusMap = {
    'initiated': 0,
    'processing': 1,
    'scraping': 2,
    'analyzing': 3,
    'storing': 4,
    'triggering_workflows': 5,
    'completed': 6,
    'failed': -1
  };
  return statusMap[status] || 0;
}

// POST endpoint for n8n to update progress
export const POST: RequestHandler = async ({ request }) => {
  try {
    const progressData = await request.json();
    
    // Validate required fields
    if (!progressData.sessionId) {
      return json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Update search progress in database
    const updateData: any = {
      status: progressData.status,
      updated_at: new Date().toISOString()
    };

    if (progressData.foundCount !== undefined) {
      updateData.found_count = progressData.foundCount;
    }

    if (progressData.errorMessage) {
      updateData.error_message = progressData.errorMessage;
    }

    const { error: dbError } = await supabase
      .from('customer_evaluation_searches')
      .update(updateData)
      .eq('id', progressData.sessionId);

    if (dbError) {
      console.error('Progress update error:', dbError);
      return json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return json({ success: true, message: 'Progress updated' });

  } catch (error) {
    console.error('Progress update API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};
