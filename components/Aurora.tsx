
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

    const drawAurora = (
      color: string,
      amplitude: number,
      frequency: number,
      speed: number,
      offsetY: number,
      thickness: number
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(40px)';

      for (let x = 0; x <= canvas.width; x += 5) {
        const y =
          offsetY +
          Math.sin(x * frequency + time * speed) * amplitude +
          Math.sin(x * frequency * 0.5 + time * speed * 0.7) * (amplitude * 0.5);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.4;
      time += 0.01;

      // Primary Green Aurora
      drawAurora('rgba(74, 222, 128, 0.6)', 80, 0.002, 0.5, canvas.height * 0.3, 100);
      
      // Secondary Teal/Blue Aurora
      drawAurora('rgba(45, 212, 191, 0.4)', 60, 0.003, -0.4, canvas.height * 0.35, 120);
      
      // Faint Purple/Pink Peak
      drawAurora('rgba(192, 132, 252, 0.3)', 40, 0.001, 0.3, canvas.height * 0.25, 80);

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
      className="fixed inset-0 pointer-events-none z-0 opacity-60" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default Aurora;
