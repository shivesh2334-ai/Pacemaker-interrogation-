export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:{message:'POST required'}});
  if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({error:{message:'Origin rejected'}});
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({error:{message:'AI is not configured. Set ANTHROPIC_API_KEY on the server. Manual analysis remains available.'}});
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!b || typeof b.system !== 'string' || !Array.isArray(b.messages) || b.messages.length !== 1 || b.messages[0].role !== 'user') return res.status(400).json({error:{message:'Invalid request'}});
    if (JSON.stringify(b).length > 4300000) return res.status(413).json({error:{message:'Report exceeds upload limit'}});
    const body = {model:process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',max_tokens:2500,system:b.system,messages:b.messages};
    if (b.tools?.length) body.tools = [{type:'web_search_20250305',name:'web_search',max_uses:3}];
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify(body),signal:AbortSignal.timeout(55000)});
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({error:{message:'AI provider request failed. Check server configuration or retry later.'}});
    if (data.stop_reason === 'max_tokens') return res.status(502).json({error:{message:'AI response was incomplete. Retry with a smaller report.'}});
    return res.status(200).json({content:data.content});
  } catch { return res.status(502).json({error:{message:'AI request could not be completed'}}); }
}
