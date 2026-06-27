import React, { useState, useEffect, useRef } from 'react';

const TransverseVsLongitudinal = () => {
  const canvasRef = useRef(null);
  const [amplitude, setAmplitude] = useState(40);
  const [waveSpeed, setWaveSpeed] = useState(1.5);
  const [wavelength, setWavelength] = useState(200);
  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);

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
    particle: 'rgba(255, 255, 255, 0.7)',
    grid: 'rgba(255, 255, 255, 0.05)',
    eqLine: 'rgba(255, 255, 255, 0.1)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.05 * waveSpeed;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, amplitude, waveSpeed, wavelength]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const numParticles = 80;
    const spacing = width / numParticles;
    const k = (2 * Math.PI) / wavelength;
    const transY = 180; // Center Y for Transverse
    const longY = 500;  // Center Y for Longitudinal

    // Draw axis lines
    ctx.strokeStyle = theme.eqLine;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, transY); ctx.lineTo(width, transY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, longY); ctx.lineTo(width, longY); ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(41, 121, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = theme.blue;
    for (let x = 0; x <= width; x++) {
      const y = transY - amplitude * Math.sin(k * x - t);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const trackers = [20, 50]; // Indices of highlighted particles

    for (let i = 0; i < numParticles; i++) {
      const eqX = i * spacing; // Equilibrium X position
      
      // y(x,t) or s(x,t) = A * sin(kx - wt)
      const displacement = amplitude * Math.sin(k * eqX - t);

      let pColor = theme.particle;
      let pGlow = 0;
      let isTracked = false;

      if (i === trackers[0]) { pColor = theme.red; pGlow = 15; isTracked = true; }
      else if (i === trackers[1]) { pColor = theme.green; pGlow = 15; isTracked = true; }

      const ty = transY - displacement; // Transverse Y
      const lx = eqX + displacement;    // Longitudinal X

      // --- TRACKING GUIDES (Drawn beneath particles) ---
      if (isTracked) {
        // Vertical equilibrium guide
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(eqX, 80);
        ctx.lineTo(eqX, height - 80);
        ctx.stroke();

        // Diagonal Displacement Mapping: Connects Transverse to Longitudinal
        ctx.strokeStyle = pColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(eqX, ty);
        ctx.lineTo(lx, longY);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
      }

      // --- TRANSVERSE PARTICLE ---
      ctx.shadowBlur = pGlow;
      ctx.shadowColor = pColor;
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.arc(eqX, ty, isTracked ? 7 : 3, 0, Math.PI * 2);
      ctx.fill();

      // --- LONGITUDINAL PARTICLE ---
      ctx.strokeStyle = pColor;
      ctx.lineWidth = isTracked ? 3 : 1.5;
      
      // Draw the vertical line for the longitudinal medium
      ctx.beginPath();
      ctx.moveTo(lx, longY - 40);
      ctx.lineTo(lx, longY + 40);
      ctx.stroke();
      
      // Draw a glowing core dot on the longitudinal line
      ctx.beginPath();
      ctx.arc(lx, longY, isTracked ? 5 : 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; // Reset shadow
    }

    ctx.fillStyle = theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillText('TRANSVERSE WAVE (Displacement ⊥ Propagation)', 25, 45);
    ctx.fillText('LONGITUDINAL WAVE (Displacement || Propagation)', 25, 345);
    ctx.shadowBlur = 0;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ width: '350px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '25px' }}>WAVE COMPARISON</h2>
        
        <div style={{ padding: '15px', border: `1px solid ${theme.blue}`, borderRadius: '4px', marginBottom: '35px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(41, 121, 255, 0.05)' }}>
          <strong>PHYSICS NOTE:</strong> Observe the diagonal tracking lines. When the transverse particle moves UP (positive displacement), the corresponding longitudinal particle moves RIGHT.
        </div>

        {/* SLIDERS */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
            <span>AMPLITUDE</span><span style={{ color: theme.blue, fontWeight: 'bold' }}>{amplitude}</span>
          </label>
          <input type="range" min="10" max="80" step="1" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} style={{ width: '100%', accentColor: theme.blue, cursor: 'pointer', height: '4px' }} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
            <span>WAVELENGTH (λ)</span><span style={{ color: theme.blue, fontWeight: 'bold' }}>{wavelength}</span>
          </label>
          <input type="range" min="80" max="400" step="10" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))} style={{ width: '100%', accentColor: theme.blue, cursor: 'pointer', height: '4px' }} />
        </div>

        <div style={{ marginBottom: '40px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
            <span>WAVE SPEED</span><span style={{ color: theme.blue, fontWeight: 'bold' }}>{waveSpeed.toFixed(1)}</span>
          </label>
          <input type="range" min="0.1" max="4" step="0.1" value={waveSpeed} onChange={(e) => setWaveSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: theme.blue, cursor: 'pointer', height: '4px' }} />
        </div>

        {/* PLAY/PAUSE */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '100%', padding: '14px', cursor: 'pointer', fontSize: '12px', marginTop: 'auto', 
            transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '2px',
            background: isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
            border: `1px solid ${isPlaying ? theme.red : theme.green}`, 
            color: isPlaying ? theme.red : theme.green, 
            boxShadow: `0 0 15px ${isPlaying ? 'rgba(255, 42, 42, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = isPlaying ? 'rgba(255, 42, 42, 0.15)' : 'rgba(0, 230, 118, 0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)'}
        >
          {isPlaying ? 'PAUSE ANIMATION' : 'RESUME ANIMATION'}
        </button>
      </div>

      {/* CANVAS CONTAINER */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

export default TransverseVsLongitudinal;