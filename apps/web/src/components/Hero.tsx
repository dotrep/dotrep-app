import React from "react";
import "../styles/rep-hero.css";

export default function Hero(){
  return (
    <section className="hero">
      {/* Left: .rep ring + copy */}
      <div className="left">
        <div className="ring">
          <div className="ring__pulse" />
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="rep-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ff7a1a"/>
                <stop offset="45%" stopColor="#ff9852"/>
                <stop offset="52%" stopColor="#2bb3ff"/>
                <stop offset="100%" stopColor="#2bb3ff"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44"
              stroke="url(#rep-grad)" strokeWidth="8" fill="#0b1216"/>
          </svg>
        </div>

        <div className="copy">
          <h1>
            Your onchain<br/> reputation.<br/>
            <span className="accent">Alive on Base.</span>
          </h1>

          <div className="ctas">
            <a className="btn btn-primary" href="/reserve">Reserve your .rep</a>
            <a className="btn btn-ghost" href="/discover">Discover .rep</a>
          </div>

          <div className="claim">Identity isn’t minted. It’s earned.</div>
          <div className="footer-line">Composed on Base, verified by <strong>.rep</strong></div>
        </div>
      </div>

      {/* Right: mascot + backplate + halo */}
      <div className="mascot-wrap">
        <div className="mascot-backplate" aria-hidden="true" />
        <div className="mascot-halo" aria-hidden="true" />
        <img className="mascot" src="/chameleon.png" alt=".rep chameleon mascot" />
      </div>
    </section>
  );
}
