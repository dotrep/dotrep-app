import express from "express";
import cors from "cors";

const app = express();
const HOST = "0.0.0.0";
const PORT = 3001;

app.use(cors());
app.use(express.json());

const reserved = new Map<string, { name: string; walletAddress: string; timestamp: number }>();
const isValid = (n:string)=> typeof n==="string" && n.length>=3 && n.length<=32 && /^[a-z][a-z0-9-]{2,31}$/.test(n);
const isValidAddress = (addr:string) => typeof addr==="string" && /^0x[a-fA-F0-9]{40}$/.test(addr);

// Check availability
app.get("/rep/check",(req,res)=>{
  const name = String(req.query.name||"").toLowerCase();
  if(!isValid(name)) return res.status(400).json({ ok:false, error:"INVALID_NAME" });
  res.json({ ok:true, name, available:!reserved.has(name) });
});

// Reserve with wallet
app.post("/rep/reserve",(req,res)=>{
  const name = String(req.body?.name||"").toLowerCase();
  const walletAddress = String(req.body?.walletAddress||"");
  
  if(!isValid(name)) return res.status(400).json({ ok:false, error:"INVALID_NAME" });
  if(!isValidAddress(walletAddress)) return res.status(400).json({ ok:false, error:"INVALID_WALLET_ADDRESS" });
  if(reserved.has(name)) return res.status(409).json({ ok:false, error:"ALREADY_RESERVED" });
  
  reserved.set(name, { name, walletAddress, timestamp: Date.now() });
  res.json({ ok:true, name, walletAddress, status:"RESERVED" });
});

app.get("/",(_,res)=>res.json({ ok:true, service:"api", routes:["/rep/check","/rep/reserve"], port:PORT }));

app.listen(PORT, HOST, ()=>console.log(`API on http://${HOST}:${PORT}`));
