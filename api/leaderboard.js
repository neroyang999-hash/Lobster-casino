export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/leaderboard
    if (path === '/api/leaderboard' && request.method === 'GET') {
      const data = await env.KV.get('leaderboard');
      const leaderboard = data ? JSON.parse(data) : [];
      return new Response(JSON.stringify(leaderboard), { headers: corsHeaders });
    }

    // POST /api/leaderboard
    if (path === '/api/leaderboard' && request.method === 'POST') {
      const body = await request.json();
      const { playerId, balance, avatar } = body;
      
      let leaderboard = await env.KV.get('leaderboard');
      leaderboard = leaderboard ? JSON.parse(leaderboard) : [];
      
      const existingIndex = leaderboard.findIndex(p => p.id === playerId);
      if (existingIndex >= 0) {
        if (balance > leaderboard[existingIndex].balance) {
          leaderboard[existingIndex].balance = balance;
          leaderboard[existingIndex].avatar = avatar;
        }
      } else {
        leaderboard.push({ id: playerId, balance, avatar });
      }
      
      leaderboard.sort((a, b) => b.balance - a.balance);
      leaderboard = leaderboard.slice(0, 20);
      
      await env.KV.put('leaderboard', JSON.stringify(leaderboard));
      return new Response(JSON.stringify(leaderboard), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404, 
      headers: corsHeaders 
    });
  }
};
