import React, { useEffect, useRef } from 'react';

interface NetworkAnimationProps {
  className?: string;
}

/**
 * A subtle network animation for the FSN background
 * Creates nodes and connections that pulse with light
 */
const NetworkAnimation: React.FC<NetworkAnimationProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Node class for the network
    class Node {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      pulsePhase: number;
      pulseFrequency: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        // Make the radius more consistent
        this.radius = 1.0;
        // More consistent movement speeds
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        // More consistent pulsing
        this.pulsePhase = (x * y) % (Math.PI * 2); // Deterministic but varies by position
        this.pulseFrequency = 0.015; // Fixed frequency for all nodes
      }

      update() {
        // Move the node
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > (canvas?.width || window.innerWidth)) this.vx *= -1;
        if (this.y < 0 || this.y > (canvas?.height || window.innerHeight)) this.vy *= -1;

        // Update pulse phase
        this.pulsePhase += this.pulseFrequency;
        if (this.pulsePhase > Math.PI * 2) this.pulsePhase = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Calculate pulse intensity with more consistent glow
        const pulseIntensity = (Math.sin(this.pulsePhase) + 1) * 0.5;
        
        // Draw node with more consistent appearance
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.25 + pulseIntensity * 0.25})`;
        ctx.fill();
        
        // Add a subtle glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.05 + pulseIntensity * 0.1})`;
        ctx.fill();
      }
    }

    // Create a more consistent number of nodes
    const canvasWidth = canvas?.width || window.innerWidth;
    const canvasHeight = canvas?.height || window.innerHeight;
    // Use a fixed density with a min/max range to ensure consistency
    const nodeCount = Math.min(80, Math.max(40, Math.floor(canvasWidth * canvasHeight / 25000)));
    const nodes: Node[] = [];
    
    // Create a more even distribution of nodes using a grid-based approach
    const gridSize = Math.ceil(Math.sqrt(nodeCount));
    const cellWidth = canvasWidth / gridSize;
    const cellHeight = canvasHeight / gridSize;
    
    let nodeIndex = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (nodeIndex < nodeCount) {
          // Add some randomness within each grid cell for natural appearance
          const x = (i + 0.3 + Math.random() * 0.4) * cellWidth;
          const y = (j + 0.3 + Math.random() * 0.4) * cellHeight;
          nodes.push(new Node(x, y));
          nodeIndex++;
        }
      }
    }

    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw nodes
      nodes.forEach(node => {
        node.update();
        node.draw(ctx);
      });
      
      // Draw connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only connect nodes within a certain distance
          if (distance < 120) {
            const pulseAverage = (Math.sin(nodes[i].pulsePhase) + Math.sin(nodes[j].pulsePhase) + 2) / 4;
            // Make the connection opacity more consistent
            const opacity = (1 - distance / 120) * 0.15 * pulseAverage;
            
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      
      // Continue animation
      requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fsn-network-canvas ${className || ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        opacity: 0.25,
        mixBlendMode: 'screen' // Enhances glow effect consistently
      }}
    />
  );
};

export default NetworkAnimation;