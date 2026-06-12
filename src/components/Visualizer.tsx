import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { engine } from '../utils/audioEngine';

const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      if (Tone.context.state !== 'running') return;
      
      const values = engine.waveform.getValue();
      
      ctx.beginPath();
      ctx.strokeStyle = '#FF3131';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < values.length; i++) {
        const val = values[i] as number;
        const x = width * (i / values.length);
        const y = (0.5 + (val * 0.5)) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={40} 
      className="w-full h-full"
    />
  );
};

export default Visualizer;
