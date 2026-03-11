export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { createClient } = require('redis');
  
  // Vercel Redis 使用 REDIS_URL 格式：redis://default:密码@主机:端口
  const redis = createClient({
    url: process.env.REDIS_URL
  });
  
  await redis.connect();

  if (req.method === 'GET') {
    const data = await redis.get('leaderboard');
    await redis.disconnect();
    return res.status(200).json(data ? JSON.parse(data) : []);
  }

  if (req.method === 'POST') {
    const { playerId, balance, avatar } = req.body;
    let leaderboard = await redis.get('leaderboard');
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
    
    await redis.set('leaderboard', JSON.stringify(leaderboard));
    await redis.disconnect();
    return res.status(200).json(leaderboard);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
