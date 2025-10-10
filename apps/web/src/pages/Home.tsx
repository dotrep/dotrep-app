import React from "react";
import "./../styles/rep-hero.css";

export default function Home() {
  const onReserve = () => {
    // For MVP this can go to /reserve (a simple page or modal later)
    window.location.assign("/reserve");
  };
  const onDiscover = () => {
    window.location.assign("/discover");
  };

  return (
    <main className="hero">
      {/* LEFT: ring + headline */}
      <section className="brand-wrap">
        <img className="ring" src="/rep-ring.svg" alt=".rep gradient ring" />
        <div className="hgroup">
          <h1>
            Your onchain<br/> reputation.<br/>
            <span className="accent">Alive on Base.</span>
          </h1>
          <div className="ctas">
            <button className="btn btn-primary" onClick={onReserve}>
              Reserve your .rep
            </button>
            <button className="btn btn-ghost" onClick={onDiscover}>
              Discover .rep
            </button>
          </div>
          <p className="subcopy">Identity isn’t minted. It’s earned.</p>
          <p className="subcopy">Composed on Base, verified by .rep</p>
        </div>
      </section>

      {/* RIGHT: mascot */}
      <aside className="mascot-wrap">
        <img className="mascot" src="/chameleon.png" alt=".rep chameleon mascot" />
      </aside>
    </main>
  );
}
