import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin as supabase } from '$lib/server/supabaseAdmin';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-apify-signature');
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Verify the webhook signature for security
      const body = await request.text();
      const expectedSignature = await generateSignature(body, webhookSecret);
      
      if (signature !== expectedSignature) {
        return json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      // Parse the body after verification
      const payload = JSON.parse(body);
      
      return await handleApifyWebhook(payload);
    }
    
    // If no signature required, process directly
    const payload = await request.json();
    return await handleApifyWebhook(payload);
    
  } catch (error) {
    console.error('Apify webhook error:', error);
    return json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
};

async function handleApifyWebhook(payload: any) {
  const { eventType, eventData, resource } = payload;
  
  console.log('Apify webhook received:', { eventType, resource: resource?.id });
  
  try {
    switch (eventType) {
      case 'ACTOR_RUN_SUCCEEDED':
        return await handleRunSucceeded(eventData, resource);
      
      case 'ACTOR_RUN_FAILED':
        return await handleRunFailed(eventData, resource);
      
      case 'ACTOR_RUN_ABORTED':
        return await handleRunAborted(eventData, resource);
      
      default:
        console.log('Unhandled Apify event type:', eventType);
        return json({ message: 'Event type not handled' });
    }
  } catch (error) {
    console.error('Error processing Apify webhook:', error);
    throw error;
  }
}

async function handleRunSucceeded(eventData: any, resource: any) {
  const runId = resource?.id;
  const defaultDatasetId = resource?.defaultDatasetId;
  
  if (!runId || !defaultDatasetId) {
    console.error('Missing required data in webhook payload');
    return json({ error: 'Missing run ID or dataset ID' }, { status: 400 });
  }
  
  try {
    // Download the results from Apify
    const apifyApiToken = process.env.APIFY_API_TOKEN;
    const datasetUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${apifyApiToken}`;
    
    const response = await fetch(datasetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.status}`);
    }
    
    const scrapedData = await response.json();
    
    // Find the corresponding search session
    const sessionId = resource?.userdata?.sessionId || resource?.meta?.sessionId;
    
    if (!sessionId) {
      console.error('No session ID found in Apify run data');
      return json({ error: 'No session ID found' }, { status: 400 });
    }
    
    // Process and store the scraped data
    await processScrapedData(sessionId, scrapedData);
    
    // Update search status to completed
    await supabase
      .from('customer_evaluation_searches')
      .update({
        status: 'completed',
        found_count: scrapedData.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    console.log(`Successfully processed ${scrapedData.length} results for session ${sessionId}`);
    
    return json({ 
      success: true, 
      message: 'Results processed successfully',
      resultCount: scrapedData.length,
      sessionId 
    });
    
  } catch (error) {
    console.error('Error processing successful run:', error);
    
    // Update search status to failed
    await supabase
      .from('customer_evaluation_searches')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', sessionId);
    
    throw error;
  }
}

async function handleRunFailed(eventData: any, resource: any) {
  const runId = resource?.id;
  const sessionId = resource?.userdata?.sessionId || resource?.meta?.sessionId;
  
  console.error('Apify run failed:', { runId, sessionId, eventData });
  
  if (sessionId) {
    await supabase
      .from('customer_evaluation_searches')
      .update({
        status: 'failed',
        error_message: 'Apify scraping run failed'
      })
      .eq('id', sessionId);
  }
  
  return json({ message: 'Run failure recorded' });
}

async function handleRunAborted(eventData: any, resource: any) {
  const runId = resource?.id;
  const sessionId = resource?.userdata?.sessionId || resource?.meta?.sessionId;
  
  console.log('Apify run aborted:', { runId, sessionId });
  
  if (sessionId) {
    await supabase
      .from('customer_evaluation_searches')
      .update({
        status: 'cancelled',
        error_message: 'Scraping run was cancelled'
      })
      .eq('id', sessionId);
  }
  
  return json({ message: 'Run cancellation recorded' });
}

async function processScrapedData(sessionId: string, scrapedData: any[]) {
  // Look up user_id from the originating search session for RLS compliance
  const { data: searchRecord, error: searchError } = await supabase
    .from('customer_evaluation_searches')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  if (searchError || !searchRecord?.user_id) {
    throw new Error(`Unable to resolve user for session ${sessionId}: ${searchError?.message || 'not found'}`);
  }

  const userId = searchRecord.user_id;

  const processedData = scrapedData.map(business => ({
    search_session_id: sessionId,
    user_id: userId,
    business_name: business.title || business.name,
    contact_person: business.contact_person || extractContactPerson(business),
    phone_number: business.phone || business.phoneNumber,
    email_1: extractEmail(business, 0),
    email_2: extractEmail(business, 1),
    email_3: extractEmail(business, 2),
    email_4: extractEmail(business, 3),
    email_5: extractEmail(business, 4),
    website_url: business.website || business.url,
    street: business.address?.street || business.street,
    city: business.address?.city || business.city,
    state: business.address?.state || business.state,
    zip_code: business.address?.zip || business.zipCode,
    business_type: business.categoryName || business.type,
    gmb_rating: parseFloat(business.totalScore || business.rating) || null,
    gmb_reviews_count: parseInt(business.reviewsCount || business.reviews) || 0,
    gmb_claimed: business.claimed || false,
    gmb_place_id: business.placeId,
    raw_data: business // Store original scraped data
  }));
  
  // Batch insert to database
  const { error } = await supabase
    .from('customer_evaluations')
    .insert(processedData);
  
  if (error) {
    console.error('Error inserting scraped data:', error);
    throw new Error(`Database insertion failed: ${error.message}`);
  }
  
  console.log(`Inserted ${processedData.length} business records`);
}

function extractContactPerson(business: any): string | null {
  // Extract contact person from various possible fields
  if (business.owner) return business.owner;
  if (business.manager) return business.manager;
  if (business.contact) return business.contact;
  
  // Try to extract from reviews or other text fields
  const reviewText = business.reviews?.[0]?.text || '';
  const contactMatch = reviewText.match(/(?:ask for|speak to|contact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  
  return contactMatch?.[1] || null;
}

function extractEmail(business: any, index: number): string | null {
  const emails = [];
  
  // Add known email fields
  if (business.email) emails.push(business.email);
  if (business.contactEmail) emails.push(business.contactEmail);
  
  // Extract emails from website or description
  const text = `${business.description || ''} ${business.website || ''}`;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = text.match(emailRegex) || [];
  
  emails.push(...foundEmails);
  
  // Remove duplicates and return the email at the specified index
  const uniqueEmails = [...new Set(emails)];
  return uniqueEmails[index] || null;
}

async function generateSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
