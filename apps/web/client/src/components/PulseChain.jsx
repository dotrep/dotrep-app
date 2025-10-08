import React, { useState, useEffect, useRef } from 'react';
import './PulseChain.css';

const PulseChain = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef();

  // Sample data with different categories and colors
  const sampleData = [
    { id: 1, type: 'Sent secure message', category: 'XP', xp: 85, timestamp: 'July 10 • 2:15 PM', color: '#ffffff' },
    { id: 2, type: 'Vault Upload', category: 'Vault', xp: 75, timestamp: 'July 10 • 11:30 AM', color: '#00f0ff' },
    { id: 3, type: 'Broadcasted at 9.00 MHz', category: 'Signal', xp: 95, timestamp: 'July 9 • 8:45 PM', color: '#00ff88' },
    { id: 4, type: 'Added NFT #001', category: 'NFT', xp: 100, timestamp: 'July 9 • 3:20 PM', color: '#b366ff' },
    { id: 5, type: 'Profile Enhancement', category: 'XP', xp: 60, timestamp: 'July 9 • 10:15 AM', color: '#ffffff' },
    { id: 6, type: 'Signal Discovery', category: 'Signal', xp: 80, timestamp: 'July 8 • 6:30 PM', color: '#00ff88' },
    { id: 7, type: 'Vault Security Check', category: 'Vault', xp: 65, timestamp: 'July 8 • 1:45 PM', color: '#00f0ff' },
    { id: 8, type: 'NFT Collection Milestone', category: 'NFT', xp: 90, timestamp: 'July 8 • 9:20 AM', color: '#b366ff' }
  ];

  useEffect(() => {
    // Initialize nodes with organic positioning
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const initialNodes = sampleData.map((data, index) => {
      // Create organic constellation layout
      const angle = (index / sampleData.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const radius = 80 + Math.random() * 120;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      return {
        ...data,
        x,
        y,
        baseX: x,
        baseY: y,
        radius: 6 + (data.xp / 20), // Size based on XP
        opacity: 0,
        scale: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: []
      };
    });

    // Create connections between nearby nodes
    initialNodes.forEach((node, i) => {
      initialNodes.forEach((otherNode, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );
          if (distance < 150 && Math.random() > 0.4) {
            node.connections.push(j);
          }
        }
      });
    });

    setNodes(initialNodes);

    // Animate nodes appearing
    initialNodes.forEach((_, index) => {
      setTimeout(() => {
        setNodes(prev => prev.map((node, i) => 
          i === index ? { ...node, opacity: 1, scale: 1 } : node
        ));
      }, index * 200);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      // Draw connections first with flowing animation
      nodes.forEach((node, nodeIndex) => {
        node.connections.forEach(connectionIndex => {
          const connectedNode = nodes[connectionIndex];
          if (connectedNode) {
            // Create flowing gradient animation
            const flowOffset = Math.sin(time * 1.5 + nodeIndex * 0.5) * 0.3;
            const gradient = ctx.createLinearGradient(
              node.x, node.y, connectedNode.x, connectedNode.y
            );
            
            gradient.addColorStop(0, `${node.color}20`);
            gradient.addColorStop(0.3 + flowOffset, `${node.color}80`);
            gradient.addColorStop(0.7 + flowOffset, `${connectedNode.color}80`);
            gradient.addColorStop(1, `${connectedNode.color}20`);

            // Animated line thickness and glow
            const pulseIntensity = 0.5 + Math.sin(time * 2 + nodeIndex) * 0.3;
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5 * pulseIntensity;
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 8 * pulseIntensity;
            ctx.globalAlpha = 0.6 + pulseIntensity * 0.4;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connectedNode.x, connectedNode.y);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
          }
        });
      });

      // Draw nodes
      nodes.forEach((node, index) => {
        if (node.opacity === 0) return;

        const pulseSize = Math.sin(time * 3 + node.pulsePhase) * 3;
        const currentRadius = node.radius * node.scale + pulseSize;
        const glowIntensity = 0.7 + Math.sin(time * 2 + node.pulsePhase) * 0.3;

        // Multiple layered glow effects
        for (let i = 0; i < 3; i++) {
          const glowRadius = currentRadius * (4 - i);
          const alphaValue = Math.floor(glowIntensity * (3 - i) * 40);
          const glowAlpha = Math.min(255, Math.max(0, alphaValue)).toString(16).padStart(2, '0');
          
          const glowGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, glowRadius
          );
          glowGradient.addColorStop(0, `${node.color}${glowAlpha}`);
          glowGradient.addColorStop(0.5, `${node.color}${Math.floor(alphaValue * 0.5).toString(16).padStart(2, '0')}`);
          glowGradient.addColorStop(1, `${node.color}00`);

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main node
        const nodeGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius
        );
        nodeGradient.addColorStop(0, node.color);
        nodeGradient.addColorStop(0.7, `${node.color}cc`);
        nodeGradient.addColorStop(1, `${node.color}66`);

        ctx.fillStyle = nodeGradient;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = node.opacity;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePos({ x: e.clientX, y: e.clientY });

    // Check for node hover
    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2)
      );
      return distance < node.radius + 10;
    });

    setHoveredNode(hoveredNode || null);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Vault': return '🗄️';
      case 'Signal': return '📡';
      case 'NFT': return '⚒️';
      case 'XP': return '⭐';
      default: return '⚡';
    }
  };

  return (
    <div className="pulse-chain">
      <div className="pulse-chain-header">
        <h4>PULSE CHAIN CONSTELLATION</h4>
        <span className="chain-description">Visual Activity Timeline</span>
      </div>
      
      <div className="pulse-chain-canvas-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        {hoveredNode && (
          <div 
            className="pulse-chain-tooltip"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y - 10,
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-icon">{getCategoryIcon(hoveredNode.category)}</span>
              <span className="tooltip-category">{hoveredNode.category}</span>
            </div>
            <div className="tooltip-type">{hoveredNode.type}</div>
            <div className="tooltip-details">
              <span className="tooltip-xp">+{hoveredNode.xp} XP</span>
              <span className="tooltip-time">{hoveredNode.timestamp}</span>
            </div>
          </div>
        )}
      </div>

      <div className="pulse-chain-legend">
        <div className="legend-item vault">
          🔵 Vault
        </div>
        <div className="legend-item signal">
          🟢 Signal
        </div>
        <div className="legend-item nft">
          🟣 NFT
        </div>
        <div className="legend-item xp">
          ⚪ XP
        </div>
      </div>
    </div>
  );
};

export default PulseChain;