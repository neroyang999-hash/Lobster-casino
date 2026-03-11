export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 使用 Vercel Redis
    const { Redis } = require('@upstash/redis');
    const redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });

    const LEADERBOARD_KEY = 'casino:leaderboard';
    const MAX_ENTRIES = 20;

    if (req.method === 'GET') {
      const data = await redis.get(LEADERBOARD_KEY);
      const leaderboard = data || [];
      return res.status(200).json(leaderboard);
    }

    if (req.method === 'POST') {
      const { playerId, balance, avatar } = req.body;
      
      if (!playerId || typeof balance !== 'number') {
        return res.status(400).json({ error: '参数错误' });
      }

      const data = await redis.get(LEADERBOARD_KEY);
      let leaderboard = data || [];

      const existingIndex = leaderboard.findIndex(p => p.id === playerId);
      if (existingIndex >= 0) {
        if (balance > leaderboard[existingIndex].balance) {
          leaderboard[existingIndex] = { 
            id: playerId, 
            balance, 
            avatar,
            date: new Date().toISOString()
          };
        }
      } else {
        leaderboard.push({ 
          id: playerId, 
          balance, 
          avatar,
          date: new Date().toISOString()
        });
      }

      leaderboard.sort((a, b) => b.balance - a.balance);
      leaderboard = leaderboard.slice(0, MAX_ENTRIES);

      await redis.set(LEADERBOARD_KEY, leaderboard);

      return res.status(200).json(leaderboard);
    }

    return res.status(405).json({ error: '方法不允许' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}
