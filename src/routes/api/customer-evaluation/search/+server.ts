import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Parse request body
    const formData = await request.json();

    // Validate required fields
    if (!formData.marketVertical || !formData.city || !formData.state) {
      return json(
        {
          error: 'Missing required fields: marketVertical, city, state',
        },
        { status: 400 }
      );
    }

    // Generate unique session ID for this search
    const sessionId = crypto.randomUUID();

    // Prepare n8n webhook payload
    const n8nPayload = {
      sessionId,
      userId: user.id,
      userEmail: user.email,
      search_type: formData.campaignEnabled ? 'campaign' : 'one_off',
      market_vertical: formData.marketVertical,
      sub_category: formData.subCategory,
      geographic: {
        city: formData.city,
        state: formData.state,
        radius_miles: formData.radius,
      },
      quality_filters: {
        min_reviews: formData.minReviews,
        min_rating: formData.minRating,
        exclude_closed: formData.excludeClosed,
        exclude_chains: formData.excludeChains,
        exclude_existing: formData.excludeExisting,
        require_website: formData.hasWebsite,
        require_recent_posts: formData.recentPosts,
        require_photos: formData.hasPhotos,
        require_review_responses: formData.respondsReviews,
      },
      batch_settings: {
        max_results: formData.batchSize,
        processing_speed: 'standard',
      },
      campaign_info: formData.campaignEnabled
        ? {
            name: formData.campaignName,
            save_template: true,
            schedule: null,
          }
        : null,
      timestamp: new Date().toISOString(),
    };

    // Store search request in Supabase
    const { data: searchRecord, error: dbError } = await supabase
      .from('customer_evaluation_searches')
      .insert({
        id: sessionId,
        user_id: user.id,
        search_params: n8nPayload,
        status: 'initiated',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return json(
        {
          error: 'Failed to save search request',
        },
        { status: 500 }
      );
    }

    // Trigger n8n workflow
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

      let n8nResponse: Response;

      if (!n8nWebhookUrl) {
        // Use mock n8n for development/testing
        console.log('No N8N_WEBHOOK_URL configured, using mock workflow');
        const { mockN8nWebhook } = await import('./mock-n8n');
        n8nResponse = await mockN8nWebhook(n8nPayload);
      } else {
        // Use real n8n webhook
        n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload),
        });

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
        }
      }

      // Update search status to 'processing'
      await supabase
        .from('customer_evaluation_searches')
        .update({ status: 'processing' })
        .eq('id', sessionId);

      return json({
        success: true,
        sessionId,
        message: 'Search initiated successfully',
        estimatedTime: getEstimatedTime(formData.batchSize),
        n8nTriggered: true,
      });
    } catch (n8nError) {
      console.error('n8n webhook error:', n8nError);

      // Update search status to 'failed'
      await supabase
        .from('customer_evaluation_searches')
        .update({
          status: 'failed',
          error_message: n8nError.message,
        })
        .eq('id', sessionId);

      return json(
        {
          success: false,
          sessionId,
          error: 'Failed to trigger n8n workflow',
          details: n8nError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

// Helper function to estimate processing time
function getEstimatedTime(batchSize: number): string {
  const estimates = {
    25: '2-3 minutes',
    50: '3-5 minutes',
    75: '5-7 minutes',
    100: '7-10 minutes',
  };
  return estimates[batchSize] || '3-5 minutes';
}
