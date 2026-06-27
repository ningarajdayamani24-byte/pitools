import React, { useState, useEffect, useRef } from 'react';

const PhaseShiftSuperposition = () => {
  const canvasRef = useRef(null);
  const [amplitude, setAmplitude] = useState(1.0);
  const [phase, setPhase] = useState(196); // Degrees
  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);

  const theme = {
    bg: '#0a0a0c',
    panel: '#111114',
    border: '#2a2a35',
    blue: '#2979ff',
    red: '#ff2a2a',
    green: '#00e676',
    yellow: '#ffd600',
    white: '#ffffff',
    grid: 'rgba(255, 255, 255, 0.05)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) timeRef.current += 0.03;
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, amplitude, phase]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const t = timeRef.current;
    const phi = (phase * Math.PI) / 180;
    const R = amplitude * 50;
    const cx = 200, cy = 250;
    const waveStartX = 400;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gridlines
    ctx.strokeStyle = theme.grid;
    for (let i = 0; i < canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for (let i = 0; i < canvas.height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    // Phasors
    const v1 = { x: cx + R * Math.cos(t), y: cy - R * Math.sin(t) };
    const v2 = { x: cx + R * Math.cos(t + phi), y: cy - R * Math.sin(t + phi) };

    // Circle
    ctx.strokeStyle = '#444';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // Phi indicator box
    ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 30, -t, -t-phi, true); ctx.fill();
    ctx.strokeStyle = theme.green; ctx.stroke();
    ctx.fillStyle = theme.green; ctx.fillText('φ', cx + 20, cy - 20);

    // Draw Projection Lines and Vectors
    const drawProjection = (tip, color) => {
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tip.x, tip.y); ctx.stroke(); // Vector
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2); ctx.fill(); // Tip point
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(waveStartX, tip.y); ctx.stroke(); // Projection
      ctx.setLineDash([]);
      return tip.y;
    };

    const y1 = drawProjection(v1, theme.blue);
    const drawProjection2 = (tip, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(waveStartX, tip.y); ctx.stroke();
        ctx.setLineDash([]);
        return tip.y;
    };
    const y2 = drawProjection2(v2, theme.red);

    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    for (let x = 0; x < 500; x++) {
      const timeAtX = t - x / 50;
      const wave1Y = cy - Math.sin(timeAtX) * R;
      const wave2Y = cy - Math.sin(timeAtX + phi) * R;
      const sumY = cy - (Math.sin(timeAtX) + Math.sin(timeAtX + phi)) / 2 * R;

      ctx.strokeStyle = theme.blue; ctx.shadowColor = theme.blue;
      ctx.beginPath(); ctx.moveTo(waveStartX + x, wave1Y); ctx.lineTo(waveStartX + x + 1, wave1Y); ctx.stroke();
      
      ctx.strokeStyle = theme.red; ctx.shadowColor = theme.red;
      ctx.beginPath(); ctx.moveTo(waveStartX + x, wave2Y); ctx.lineTo(waveStartX + x + 1, wave2Y); ctx.stroke();

      ctx.strokeStyle = theme.green; ctx.shadowColor = theme.green;
      ctx.beginPath(); ctx.moveTo(waveStartX + x, sumY); ctx.lineTo(waveStartX + x + 1, sumY); ctx.stroke();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ width: '350px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}` }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '25px' }}>OSCILLATIONS & PHASE SHIFT</h2>
        
        <div style={{ padding: '15px', border: `1px solid ${theme.yellow}`, borderRadius: '4px', marginBottom: '25px', fontSize: '11px' }}>
          <strong>PHASE SHIFT:</strong> Visualizing vector projection as wave functions.
        </div>

        <label style={{ fontSize: '10px' }}>AMPLITUDE</label>
        <input type="range" min="0.5" max="2" step="0.1" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} />

        <label style={{ fontSize: '10px' }}>PHASE SHIFT (φ)</label>
        <input type="range" min="0" max="360" value={phase} onChange={(e) => setPhase(Number(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} />

        <button 
          style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${theme.yellow}`, color: theme.yellow, cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
      </div>
      <canvas ref={canvasRef} width={900} height={500} style={{ flexGrow: 1 }} />
    </div>
  );
};

export default PhaseShiftSuperposition;