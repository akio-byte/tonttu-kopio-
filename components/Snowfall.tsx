
import React, { useEffect, useRef } from 'react';

const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { 
      x: number; 
      y: number; 
      radius: number; 
      speed: number; 
      opacity: number; 
      isSparkle: boolean;
      angle: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    const createParticles = () => {
      particles = [];
      const isMobile = window.innerWidth < 768;
      const count = Math.floor((window.innerWidth * window.innerHeight) / (isMobile ? 12000 : 8000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speed: Math.random() * 0.8 + 0.2,
          opacity: Math.random() * 0.6 + 0.2,
          isSparkle: Math.random() > 0.92,
          angle: Math.random() * Math.PI * 2
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        
        if (p.isSparkle) {
          const glow = Math.abs(Math.sin(Date.now() / 500 + p.angle)) * 0.8;
          ctx.fillStyle = `rgba(255, 255, 200, ${p.opacity + glow})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 255, 150, 0.5)';
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.shadowBlur = 0;
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        
        ctx.fill();

        p.y += p.speed;
        p.x += Math.sin(p.y / 60 + p.angle) * 0.4;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
};

export default Snowfall;
