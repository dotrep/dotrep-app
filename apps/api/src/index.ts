import express from "express";
import cors from "cors";

const app = express();
const HOST = "0.0.0.0";
const PORT = 5055; // keep this fixed so Vite proxy is stable

app.use(cors());
app.use(express.json());

const reserved = new Set<string>();
const isValid = (n:string)=> typeof n==="string" && !!n.trim() && n.length>=3 && n.length<=30 && /^[.]?[a-z0-9]+(?:[-_a-z0-9]*[a-z0-9])?$/.test(n);

// Check availability
app.get("/rep/check",(req,res)=>{
  const name = String(req.query.name||"").toLowerCase();
  if(!isValid(name)) return res.status(400).json({ ok:false, error:"INVALID_NAME" });
  res.json({ ok:true, name, available:!reserved.has(name) });
});

// Reserve mock
app.post("/rep/reserve",(req,res)=>{
  const name = String(req.body?.name||"").toLowerCase();
  if(!isValid(name)) return res.status(400).json({ ok:false, error:"INVALID_NAME" });
  if(reserved.has(name)) return res.status(409).json({ ok:false, error:"ALREADY_RESERVED" });
  reserved.add(name);
  res.json({ ok:true, name, status:"RESERVED_MOCK" });
});

app.get("/",(_,res)=>res.json({ ok:true, service:"api", routes:["/rep/check","/rep/reserve"], port:PORT }));

app.listen(PORT, HOST, ()=>console.log(`API on http://${HOST}:${PORT}`));
