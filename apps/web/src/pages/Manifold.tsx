import React, { useMemo } from "react";

/**
 * Manifold page wrapper.
 * Loads the Manifold microapp through the backend proxy so it can be embedded safely.
 */
export default function Manifold() {
  const src = useMemo(() => {
    const qs = new URLSearchParams({
      embed: "0",
      from: "web",
    });
    return `/manifold-proxy?${qs.toString()}`;
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src={src}
        title="Manifold"
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
