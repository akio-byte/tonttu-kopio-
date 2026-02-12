
import React, { useEffect, useRef } from 'react';

const Aurora: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawAuroraLayer = (
      color: string,
      amplitude: number,
      frequency: number,
      speed: number,
      offsetY: number,
      thickness: number,
      opacity: number
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(50px)';

      for (let x = 0; x <= canvas.width; x += 10) {
        // Multi-layered wave for organic feel
        const wave1 = Math.sin(x * frequency + time * speed) * amplitude;
        const wave2 = Math.sin(x * frequency * 1.5 - time * speed * 0.5) * (amplitude * 0.4);
        const wave3 = Math.cos(x * frequency * 0.7 + time * speed * 0.3) * (amplitude * 0.2);
        
        const y = offsetY + wave1 + wave2 + wave3;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.008;

      const baseH = canvas.height * 0.35;
      const pulse = Math.sin(time * 0.5) * 0.1 + 0.9;

      // Deep Purple Base
      drawAuroraLayer('rgba(139, 92, 246, 0.4)', 60, 0.001, 0.2, baseH - 20, 150, 0.3 * pulse);
      
      // Main Emerald Green
      drawAuroraLayer('rgba(16, 185, 129, 0.7)', 100, 0.0015, 0.4, baseH, 120, 0.5 * pulse);
      
      // Ethereal Blue/Cyan
      drawAuroraLayer('rgba(6, 182, 212, 0.5)', 80, 0.002, -0.3, baseH + 40, 140, 0.4 * pulse);
      
      // Top Violet Fringe
      drawAuroraLayer('rgba(167, 139, 250, 0.4)', 40, 0.001, 0.1, baseH - 60, 80, 0.2 * pulse);

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-70 no-print" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default Aurora;
