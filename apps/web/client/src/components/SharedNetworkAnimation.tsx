import React, { useEffect, useRef } from 'react';

// Singleton pattern to maintain the same animation state across pages
export class NetworkAnimationState {
  private static instance: NetworkAnimationState;
  public nodes: Node[] = [];
  public initialized: boolean = false;
  public celebrationMode: boolean = false;

  // Constructor is private to prevent direct construction calls
  private constructor() {}

  public static getInstance(): NetworkAnimationState {
    if (!NetworkAnimationState.instance) {
      NetworkAnimationState.instance = new NetworkAnimationState();
    }
    return NetworkAnimationState.instance;
  }
  
  // Trigger celebration mode when a name is claimed
  public setCelebrationMode(celebrate: boolean): void {
    this.celebrationMode = celebrate;
    
    if (celebrate) {
      // Automatically turn off celebration after 3 seconds
      setTimeout(() => {
        this.celebrationMode = false;
      }, 3000);
    }
  }
}

// Node class for the network
class Node {
  x: number;
  y: number;
  radius: number = 1.0;
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseFrequency: number = 0.035;

  constructor(x: number, y: number, seedIndex: number) {
    this.x = x;
    this.y = y;
    
    // Create more varied velocity patterns for better distribution
    const angle = (seedIndex * 0.3) % (Math.PI * 2);
    const speed = 0.0875 + (Math.sin(seedIndex * 0.7) * 0.025);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.pulsePhase = (seedIndex * 0.5) % (Math.PI * 2);
  }

  update(celebrationMode: boolean = false) {
    // Much gentler speed enhancement during celebration
    const speedMultiplier = celebrationMode ? 1.3 : 1.0;
    
    // Move the node with a gentler speed boost
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;

    // Improved bouncing logic to maintain better distribution
    const padding = 10;
    if (this.x < padding) {
      this.x = padding;
      this.vx = Math.abs(this.vx); // Maintain velocity magnitude
    } else if (this.x > window.innerWidth - padding) {
      this.x = window.innerWidth - padding;
      this.vx = -Math.abs(this.vx); // Maintain velocity magnitude
    }
    
    if (this.y < padding) {
      this.y = padding;
      this.vy = Math.abs(this.vy); // Maintain velocity magnitude
    } else if (this.y > window.innerHeight - padding) {
      this.y = window.innerHeight - padding;
      this.vy = -Math.abs(this.vy); // Maintain velocity magnitude
    }

    // Update pulse phase with gentler frequency increase during celebration
    this.pulsePhase += this.pulseFrequency * (celebrationMode ? 1.3 : 1.0);
    if (this.pulsePhase > Math.PI * 2) this.pulsePhase = 0;
  }

  draw(ctx: CanvasRenderingContext2D, celebrationMode: boolean = false) {
    // Calculate pulse intensity with gentler transitions
    const pulseIntensity = (Math.sin(this.pulsePhase) + 1) * 0.5;
    
    // Smoother brightness and size transitions during celebration
    // Reduce the multiplier difference for less dramatic changes
    const brightnessBoost = celebrationMode ? 1.35 : 1.0;
    const sizeMultiplier = celebrationMode ? 1.2 : 1.0;
    
    // Draw node with more consistent appearance
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * sizeMultiplier, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${(0.8 + pulseIntensity * 0.2) * brightnessBoost})`;
    ctx.fill();
    
    // Add a bright outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 1.5) * sizeMultiplier, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${(0.4 + pulseIntensity * 0.3) * brightnessBoost})`;
    ctx.fill();
    
    // Add an additional glow layer with strong brightness
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 3) * sizeMultiplier, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${(0.2 + pulseIntensity * 0.2) * brightnessBoost})`;
    ctx.fill();
    
    // Add celebration-specific effects with consistent seed for less randomness
    if (celebrationMode) {
      // Use node position as seed for consistency instead of random
      const nodeSeed = Math.abs(Math.sin(this.x * 0.1) * Math.cos(this.y * 0.1));
      
      // Add expandable ring effect on some nodes (using seed instead of random)
      if (nodeSeed < 0.1) {
        ctx.beginPath();
        // Smaller, more controlled ring size
        const ringSize = 8 + pulseIntensity * 15; 
        ctx.arc(this.x, this.y, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * pulseIntensity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      
      // Add occasional gentle glow on some nodes (using seed instead of random)
      if (nodeSeed > 0.92) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * pulseIntensity})`;
        ctx.fill();
      }
    }
  }
}

interface SharedNetworkAnimationProps {
  className?: string;
}

/**
 * A shared network animation that maintains consistency across pages
 */
const SharedNetworkAnimation: React.FC<SharedNetworkAnimationProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animState = NetworkAnimationState.getInstance();

  // Initialize nodes once with randomized starting positions and movement
  const initializeNodes = () => {
    if (animState.initialized) return;
    
    // Fixed node count for consistency
    const nodeCount = 60;
    
    // Create nodes with more randomized distribution
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    for (let i = 0; i < nodeCount; i++) {
      // Randomize starting positions across the screen
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Create node with random seed
      const node = new Node(x, y, i);
      
      // Pre-apply some random movement to avoid the "all start together" effect
      // Simulate a few frames of movement before display
      const preAnimationSteps = 50 + Math.floor(Math.random() * 100);
      for (let j = 0; j < preAnimationSteps; j++) {
        node.update(false);
      }
      
      animState.nodes.push(node);
    }
    
    animState.initialized = true;
  };

  useEffect(() => {
    // Initialize nodes if needed
    initializeNodes();
    
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

    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw nodes with celebration mode if active
      const celebrationActive = animState.celebrationMode;
      
      // Update and draw nodes
      animState.nodes.forEach(node => {
        node.update(celebrationActive);
        node.draw(ctx, celebrationActive);
      });
      
      // Draw connections between nearby nodes
      for (let i = 0; i < animState.nodes.length; i++) {
        for (let j = i + 1; j < animState.nodes.length; j++) {
          const dx = animState.nodes[i].x - animState.nodes[j].x;
          const dy = animState.nodes[i].y - animState.nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only connect nodes within a certain distance
          const connectionDistance = celebrationActive ? 200 : 150;
          
          // Only connect nodes within a certain distance
          if (distance < connectionDistance) {
            const pulseAverage = (Math.sin(animState.nodes[i].pulsePhase) + Math.sin(animState.nodes[j].pulsePhase) + 2) / 4;
            
            // Make the connections much brighter
            const opacity = (1 - distance / connectionDistance) * 0.75 * pulseAverage;
            
            // Simple brightness enhancement during celebration
            const brightnessBoost = celebrationActive ? 1.5 : 1.0;
            
            // Draw the line with a glow effect - smoother transitions
            // First draw a wider, more transparent line for the glow
            ctx.beginPath();
            ctx.moveTo(animState.nodes[i].x, animState.nodes[i].y);
            ctx.lineTo(animState.nodes[j].x, animState.nodes[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 1.2 * brightnessBoost})`;
            // Smaller difference in line width for smoother transitions
            ctx.lineWidth = celebrationActive ? 2.0 : 1.5; 
            ctx.stroke();
            
            // Then draw the main line on top
            ctx.beginPath();
            ctx.moveTo(animState.nodes[i].x, animState.nodes[i].y);
            ctx.lineTo(animState.nodes[j].x, animState.nodes[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 1.8 * brightnessBoost})`;
            ctx.lineWidth = celebrationActive ? 1.0 : 0.7;
            ctx.stroke();
            
            // Just slightly enhance line colors during celebration
            if (celebrationActive) {
              // Draw a subtle brighter line for smoother appearance
              ctx.beginPath();
              ctx.moveTo(animState.nodes[i].x, animState.nodes[i].y);
              ctx.lineTo(animState.nodes[j].x, animState.nodes[j].y);
              ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 1.5})`; // Less dramatic increase
              ctx.lineWidth = 0.5; // Thinner line for subtlety
              ctx.stroke();
            }
          }
        }
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Store animation frame reference for cleanup
    const animationRef = { current: 0 };
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fsn-network-canvas ${className || ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Behind content but visible
        background: '#0A0A0A',
        pointerEvents: 'none'
      }}
    />
  );
};

export default SharedNetworkAnimation;