export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expecting /mock/:token/*
    if (pathParts[0] !== 'mock' || !pathParts[1]) {
      return new Response('Not Found', { status: 404 });
    }
    
    const token = pathParts[1];
    
    // Fetch from Supabase REST API securely using Service Role Key (since RLS is locked down)
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response('Edge configuration missing', { status: 500 });
    }
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/mock_endpoints?id=eq.${token}&select=payload`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        return new Response('Database error', { status: 500 });
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        return new Response('Mock not found', { status: 404 });
      }
      
      // Return the mock payload as the response
      return new Response(JSON.stringify(data[0].payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (err) {
      return new Response(err.message, { status: 500 });
    }
  },
};
