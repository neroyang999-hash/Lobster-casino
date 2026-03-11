export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  const data = await context.env.KV.get('leaderboard');
  const leaderboard = data ? JSON.parse(data) : [];
  return new Response(JSON.stringify(leaderboard), { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  const body = await context.request.json();
  const { playerId, balance, avatar } = body;
  
  let leaderboard = await context.env.KV.get('leaderboard');
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
  
  await context.env.KV.put('leaderboard', JSON.stringify(leaderboard));
  return new Response(JSON.stringify(leaderboard), { headers: corsHeaders });
}
