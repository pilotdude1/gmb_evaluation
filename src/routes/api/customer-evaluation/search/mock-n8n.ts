// Mock n8n workflow for testing purposes
// This simulates the n8n webhook response without requiring actual n8n setup

export async function mockN8nWebhook(payload: any): Promise<Response> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate successful webhook response
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Mock workflow triggered successfully',
      sessionId: payload.sessionId,
      receivedData: {
        searchType: payload.search_type,
        marketVertical: payload.market_vertical,
        geographic: payload.geographic,
        batchSize: payload.batch_settings?.max_results,
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

