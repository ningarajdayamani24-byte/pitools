import React, { useState, useEffect, useRef } from 'react';

const ChladniFigures = () => {
  const canvasRef = useRef(null);
  const [n, setN] = useState(2);
  const [m, setM] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const particles = useRef([]);
  // Increased to 10,000 for high-definition pattern clarity
  const numParticles = 10000; 

  const theme = {
    bg: '#0a0a0c',
    panel: '#111114',
    border: '#2a2a35',
    text: '#ffffff',
    subText: '#888888',
    blue: '#2979ff',
    red: '#ff2a2a',
    green: '#00e676',
    yellow: '#ffd600',
    sand: '#d4d4d8'
  };

  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        vx: 0,
        vy: 0
      });
    }
    particles.current = newParticles;
  }, []);

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) updateParticles();
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [n, m, isPlaying]);

  const updateParticles = () => {
    particles.current.forEach(p => {
      // Force equation: Sine and Cosine waves define nodal lines
      const fx = -Math.sin(n * Math.PI * (p.x + 200) / 400) * Math.cos(m * Math.PI * (p.y + 200) / 400);
      const fy = -Math.cos(n * Math.PI * (p.x + 200) / 400) * Math.sin(m * Math.PI * (p.y + 200) / 400);
      
      const forceMag = 1.2;
      p.vx += fx * forceMag;
      p.vy += fy * forceMag;

      // Friction logic: Higher friction as they settle into nodes
      const nodeDistance = Math.abs(fx) + Math.abs(fy);
      const damping = nodeDistance < 0.2 ? 0.6 : 0.88; 
      
      p.vx *= damping;
      p.vy *= damping;
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounds
      p.x = Math.max(-195, Math.min(195, p.x));
      p.y = Math.max(-195, Math.min(195, p.y));
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Metal Plate Visual
    const gradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, 250);
    gradient.addColorStop(0, '#2d2d35');
    gradient.addColorStop(1, '#111114');
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - 210, cy - 210, 420, 420);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 6;
    ctx.strokeRect(cx - 210, cy - 210, 420, 420);

    // Sand Particles - optimized rendering
    ctx.fillStyle = theme.sand;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    particles.current.forEach(p => {
      ctx.fillRect(cx + p.x, cy + p.y, 1.2, 1.2);
    });
    ctx.shadowBlur = 0;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      <div style={{ width: '380px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>CHLADNI FIGURES</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, marginBottom: '25px' }}>ACOUSTIC RESONANCE ART</h3>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontSize: '11px', color: theme.subText, marginBottom: '15px', display: 'block' }}>RESONANCE PRESETS</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
             {[1, 2, 3, 4].map(num => (
               <button key={num} onClick={() => { setN(num); setM(num); }} style={modeBtnStyle(n===num, theme)}>
                 Mode {num}×{num}
               </button>
             ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: 'auto' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '8px', color: theme.subText }}>MODE N</label>
            <input type="number" value={n} onChange={e => setN(Number(e.target.value))} style={inputStyle(theme)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '8px', color: theme.subText }}>MODE M</label>
            <input type="number" value={m} onChange={e => setM(Number(e.target.value))} style={inputStyle(theme)} />
          </div>
        </div>

        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          style={actionBtnStyle(isPlaying, theme)}
        >
          {isPlaying ? 'STOP VIBRATION' : 'START VIBRATION'}
        </button>
      </div>
      <canvas ref={canvasRef} width={800} height={700} style={{ flexGrow: 1 }} />
    </div>
  );
};

const inputStyle = (theme) => ({
  width: '100%', padding: '10px', background: '#222', border: `1px solid ${theme.border}`, color: 'white', borderRadius: '4px', outline: 'none'
});

const modeBtnStyle = (active, theme) => ({
  padding: '10px', background: active ? 'rgba(41, 121, 255, 0.15)' : 'transparent', 
  border: `1px solid ${active ? theme.blue : theme.border}`, color: active ? theme.blue : theme.subText, cursor: 'pointer', borderRadius: '4px'
});

const actionBtnStyle = (isPlaying, theme) => ({
  width: '100%', padding: '14px', background: isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
  border: `1px solid ${isPlaying ? theme.red : theme.green}`, color: isPlaying ? theme.red : theme.green, 
  cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', marginTop: '20px'
});

export default ChladniFigures;