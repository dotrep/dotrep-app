import React from "react";
import "./index.css";

export default function App(){
  return (
    <main className="hero">
      <div className="bg-stars" />
      <div className="canvas">
        {/* Left orb + wordmark */}
        <div className="orb" aria-hidden="true">
          <div className="orb-ring" />
          <div className="orb-core" />
          <div className="wedge" />
          <div className="wedge2" />
          <div className="wordmark">.rep</div>
        </div>

        {/* Right copy */}
        <section className="copy" aria-label="Hero copy">
          <h1 className="h1">
            Your onchain<br/>reputation.<br/>
            <span className="alive">Alive on Base.</span>
          </h1>
        </section>

        {/* CTAs */}
        <div className="ctas">
          <button className="btn blue" onClick={()=>location.href="/reserve"}>Reserve your.rep</button>
          <button className="btn ghost" onClick={()=>location.href="/discover"}>Discover.rep</button>
        </div>

        {/* Tagline */}
        <div className="tag">
          Identity isn’t minted.<br/><small>It’s earned.</small>
        </div>

        {/* Chameleon panel (uses your image in /public) */}
        <aside className="panel" aria-label="Chameleon">
          <img src="/chameleon.png" alt="Chameleon mascot"/>
        </aside>
      </div>
    </main>
  );
}
