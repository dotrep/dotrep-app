import React, { useEffect, useRef, useState } from 'react';
import { fnv1a } from '../lib/hash';

interface Node {
  wallet: string;
  name: string | null;
  xp: number;
  signalActive: boolean;
  beaconClaimed: boolean;
}

function posFromWallet(wallet: string, w: number, h: number) {
  const hash = fnv1a(wallet);
  const angle = ((hash % 3600) / 3600) * Math.PI * 2;
  const rNorm = ((hash >>> 8) % 1000) / 1000;
  const r = (0.22 + 0.63 * Math.sqrt(rNorm)) * Math.min(w, h) / 2;
  return { x: Math.cos(angle) * r + w / 2, y: Math.sin(angle) * r + h / 2 };
}

function colorFromXP(xp: number) {
  if (xp >= 500) return 'rgba(0,190,255,0.95)';
  if (xp >= 200) return 'rgba(255,140,0,0.95)';
  if (xp >= 100) return 'rgba(80,230,140,0.95)';
  return 'rgba(140,155,255,0.9)';
}

export default function ConstellationCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hover, setHover] = useState<Node | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/constellation/signal-map', { credentials: 'include' });
      const j = await res.json();
      if (j.ok) setNodes(j.data);
    } catch (e) {
      console.error('Failed to load constellation:', e);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let t0 = performance.now();
    const stars = Array.from({ length: 220 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.5 + Math.random() * 0.5,
    }));

    function draw(t: number) {
      const dt = (t - t0) / 1000;
      t0 = t;
      const w = (c!.width = c!.clientWidth);
      const h = (c!.height = c!.clientHeight);

      // parallax background
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bg.addColorStop(0, '#05111a');
      bg.addColorStop(1, '#00070d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // starfield
      stars.forEach((s, i) => {
        const px = s.x * w + Math.sin(i * 13.37 + t * 0.0005) * 8 * s.z;
        const py = s.y * h + Math.cos(i * 7.91 + t * 0.0006) * 8 * s.z;
        ctx.globalAlpha = 0.35 * s.z;
        ctx.fillStyle = '#aee7ff';
        ctx.fillRect(px, py, 1, 1);
      });
      ctx.globalAlpha = 1;

      // connective filaments
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(0,190,255,0.10)';
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const pa = posFromWallet(a.wallet, w, h),
            pb = posFromWallet(b.wallet, w, h);
          const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
          if (d < Math.min(w, h) * 0.18) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // nodes + pulses
      nodes.forEach((n, idx) => {
        const { x, y } = posFromWallet(n.wallet, w, h);
        const base = Math.max(2, Math.min(6, 2 + (n.xp || 0) / 120));
        const pulse = n.signalActive ? 1 + 0.25 * Math.sin(t / 450 + idx * 0.73) : 1;
        const r = base * pulse;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, colorFromXP(n.xp));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // hover label
      if (hover) {
        const { x, y } = posFromWallet(hover.wallet, ref.current!.width, ref.current!.height);
        const label = `${hover.name ?? hover.wallet.slice(0, 8)} • ${hover.xp} XP`;
        ctx.font = '12px Inter, system-ui, sans-serif';
        const pad = 8;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x + 10, y - 24, tw + pad * 2, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(label, x + 10 + pad, y - 9);
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [nodes, hover]);

  function pick(mx: number, my: number) {
    const c = ref.current!;
    const w = (c.width = c.clientWidth),
      h = (c.height = c.clientHeight);
    for (const n of nodes) {
      const { x, y } = posFromWallet(n.wallet, w, h);
      if (Math.hypot(mx - x, my - y) <= 10) return n;
    }
    return null;
  }

  async function claimBeacon() {
    if (claiming) return;
    setClaiming(true);
    setMessage('');
    try {
      const res = await fetch('/api/constellation/beacon', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✨ +${data.xpAwarded} XP claimed!`);
        await load();
      } else {
        if (data.error === 'already_claimed') {
          setMessage('Already claimed today!');
        } else {
          setMessage('Failed to claim beacon');
        }
      }
    } catch (e) {
      setMessage('Error claiming beacon');
    } finally {
      setClaiming(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={ref}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: 'calc(100vh - 80px)',
          borderRadius: '12px',
        }}
        onMouseMove={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          setHover(pick(e.clientX - r.left, e.clientY - r.top));
        }}
      />
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
        <button
          onClick={claimBeacon}
          disabled={claiming}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 212, 170, 0.4)',
            background: 'rgba(0, 0, 0, 0.3)',
            color: '#00d4aa',
            fontSize: '0.875rem',
            cursor: claiming ? 'not-allowed' : 'pointer',
            opacity: claiming ? 0.6 : 1,
          }}
          title="Claim daily Beacon (+25 XP)"
        >
          {claiming ? 'Claiming...' : 'Claim Beacon ✨'}
        </button>
        {message && (
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: 'rgba(0, 212, 170, 0.2)',
              border: '1px solid rgba(0, 212, 170, 0.4)',
              color: '#00d4aa',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', zIndex: 10, color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', textAlign: 'center' }}>
        <p>Hover over stars to see details. Click "Claim Beacon" for daily +25 XP boost. Active: {nodes.length} signal{nodes.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
