import "./Whitepaper.css";

const SECTIONS = [
  { id: "abstract", label: "Abstract" },
  { id: "structural-constraint", label: "The Structural Constraint" },
  { id: "trust-trajectory", label: "Trust Is a Trajectory" },
  { id: "core-object", label: "The Core Object" },
];

export default function Whitepaper() {
  return (
    <div className="wp-page">
      <header className="wp-topbar">
        <div className="wp-topbar-inner">
          <nav className="wp-nav">
            {SECTIONS.map((s) => (
              <a key={s.id} className="wp-navlink" href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </nav>

          <a className="wp-pill" href="/" aria-label="Back to dotrep.io">
            dotrep.io
          </a>
        </div>
      </header>

      <main className="wp-main">
        <section className="wp-card wp-hero">
          <h1 className="wp-title">.rep</h1>
          <p className="wp-lede">
            .rep is a coordination primitive for permissionless systems. It
            derives non-transferable trust signals from observable wallet
            behavior to support contextual access decisions under cheap
            identity.
          </p>
          <div className="wp-highlight">
            Two wallets may perform the same actions, yet differ in the trust
            they earn over time.
          </div>
        </section>

        <section id="abstract" className="wp-card">
          <h2>Abstract</h2>
          <p>
            Permissionless systems cannot avoid access decisions. Any system
            that allocates scarce resources— attention, throughput, incentives,
            coordination—must determine eligibility in practice.
          </p>
          <p>
            Under cheap identity, static credentials and cumulative scores
            collapse. Identities can be created faster than trust can be earned,
            and any fixed rule becomes an optimization target.
          </p>
          <p>
            .rep reframes reputation as a property of behavior embedded in time
            and population structure. Trust is not accumulated or owned. It must
            be continuously maintained.
          </p>
        </section>

        <section id="structural-constraint" className="wp-card">
          <h2>The Structural Constraint</h2>
          <p>
            (Paste your Structural Constraint section text here. If you already
            have this in the published app, copy it verbatim and drop it in.)
          </p>
        </section>

        <section id="trust-trajectory" className="wp-card">
          <h2>Trust Is a Trajectory</h2>
          <p>(Paste your “Trust is a Trajectory” section text here.)</p>
        </section>

        <section id="core-object" className="wp-card">
          <h2>The Core Object</h2>
          <p>(Paste your “Core Object” section text here.)</p>
        </section>
      </main>
    </div>
  );
}
