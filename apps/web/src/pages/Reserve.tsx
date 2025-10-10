import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const NAME_RE = /^[a-z][a-z0-9._-]{2,23}$/;

export default function Reserve() {
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");

  const valid = useMemo(()=> NAME_RE.test(name), [name]);

  async function check() {
    setMessage("");
    setAvailable(null);
    if (!valid) return;
    setChecking(true);
    try {
      const r = await fetch(`/api/rep/check?name=${encodeURIComponent(name)}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.reason || "error");
      setAvailable(j.available);
      setMessage(j.available ? `Great—${j.name}.rep is available` : `${j.name}.rep is taken`);
    } catch (e:any) {
      setMessage("Could not check availability.");
    } finally {
      setChecking(false);
    }
  }

  async function reserve() {
    setMessage("");
    if (!valid) return;
    try {
      const r = await fetch(`/api/rep/reserve`, {
        method:"POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.reason || "reserve_error");
      setMessage(`🎉 Reserved ${j.name}.rep (mock).`);
      setAvailable(false);
    } catch (e:any) {
      setMessage(e.message === "taken" ? "Name was taken before reservation." : "Reserve failed.");
    }
  }

  return (
    <div style={{minHeight:"100vh", background:"#0b1116", color:"#eaf6ff"}}>
      <div style={{maxWidth:900, margin:"0 auto", padding:"48px 24px"}}>
        <Link to="/" style={{color:"#1fb6ff"}}>← Back</Link>
        <h1 style={{fontSize:42, margin:"16px 0 8px", letterSpacing:"-0.02em"}}>Reserve your <span style={{color:"#11ffd2"}}>.rep</span></h1>
        <p style={{opacity:.75, marginBottom:18}}>Pick a handle. You can link wallets/socials later.</p>

        <div style={{display:"grid", gap:12, maxWidth:560}}>
          <label style={{fontWeight:700}}>Name (3–24 chars, a-z 0-9 . _ - ; must start with a letter)</label>
          <div style={{display:"flex", gap:10}}>
            <input
              value={name}
              onChange={(e)=> setName(e.target.value.toLowerCase())}
              placeholder="yourname"
              style={{
                flex:1, background:"#0f1820", color:"#eaf6ff", border:"1px solid #193042",
                padding:"12px 14px", borderRadius:10, outline:"none"
              }}
            />
            <div style={{alignSelf:"center", opacity:.7}}>.rep</div>
          </div>

          <div style={{display:"flex", gap:10}}>
            <button
              disabled={!valid || checking}
              onClick={check}
              className="btn btn-ghost"
              style={{border:"1px solid rgba(17,255,210,.35)", color:"#11ffd2", background:"rgba(17,255,210,.08)", padding:"10px 14px", borderRadius:10, fontWeight:700}}
            >
              {checking ? "Checking…" : "Check availability"}
            </button>
            <button
              disabled={!valid}
              onClick={reserve}
              className="btn btn-primary"
              style={{background:"linear-gradient(180deg,#3c7dff,#2065ff)", color:"#fff", padding:"10px 14px", borderRadius:10, fontWeight:700, border:0}}
            >
              Reserve
            </button>
          </div>

          <div style={{minHeight:24, color: available===true ? "#11ffd2" : available===false ? "#ff9a5c" : "#9fb9c7"}}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
