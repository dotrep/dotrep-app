export function addHealth(app) {
  app.get('/healthz', (_req,res)=>res.json({ok:true,t:Date.now()}));
}
