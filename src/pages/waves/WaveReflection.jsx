import React, { useState, useEffect, useRef } from 'react';

const WaveReflection = () => {
  const canvasRef = useRef(null);
  
  // Physics & UI State
  const [boundaryType, setBoundaryType] = useState('fixed'); // 'fixed' or 'free'
  const [amplitude, setAmplitude] = useState(80);
  const [pulseWidth, setPulseWidth] = useState(45);
  const [speed, setSpeed] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComponents, setShowComponents] = useState(false);
  
  const timeRef = useRef(0);

  // Theme matching pitools framework
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
    purple: '#b388ff',
    string: 'rgba(255, 255, 255, 0.9)',
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += speed;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, boundaryType, amplitude, pulseWidth, speed, showComponents]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear & Draw Grid
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const cy = height / 2; // Center Y (Equilibrium)
    const L = 750; // X position of the boundary
    
    // Calculate pulse position
    // We use a cycle of 2200 to allow the wave to fully enter and exit before looping
    const cycle = 2200; 
    const t = timeRef.current % cycle; 
    
    // The center of the incident (incoming) pulse
    const incidentCenter = t - 300; 
    
    // The center of the reflected (ghost) pulse coming from the right
    const reflectedCenter = (2 * L) - incidentCenter;

    // Gaussian pulse function: f(x) = A * e^(-0.5 * ((x-c)/w)^2)
    const getPulse = (x, center, amp) => {
      const exponent = -0.5 * Math.pow((x - center) / pulseWidth, 2);
      return amp * Math.exp(exponent);
    };

    if (showComponents) {
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // 1. Incident Wave Component (Blue) - continues past boundary mathematically
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(41, 121, 255, 0.6)';
      for (let x = 0; x <= width; x++) {
        const y = cy - getPulse(x, incidentCenter, amplitude);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Reflected Wave Component (Red) - comes from the right
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 42, 42, 0.6)';
      const refAmp = boundaryType === 'fixed' ? -amplitude : amplitude;
      for (let x = 0; x <= width; x++) {
        const y = cy - getPulse(x, reflectedCenter, refAmp);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Legend for components
      ctx.fillStyle = theme.blue;
      ctx.font = '12px monospace';
      ctx.fillText("--- Incident Pulse (Incoming)", 20, 30);
      ctx.fillStyle = theme.red;
      ctx.fillText(`--- Reflected Pulse (${boundaryType === 'fixed' ? 'Inverted' : 'Upright'})`, 20, 50);
    }

    // Equilibrium dashed line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Draw the actual string (Superposition of incident and reflected)
    ctx.beginPath();
    ctx.strokeStyle = theme.yellow;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 214, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    
    let ringY = cy; // Keep track of the boundary Y position for the free end ring

    for (let x = 0; x <= L; x++) {
      const yInc = getPulse(x, incidentCenter, amplitude);
      const yRef = getPulse(x, reflectedCenter, boundaryType === 'fixed' ? -amplitude : amplitude);
      
      const yTotal = cy - (yInc + yRef);
      if (x === L) ringY = yTotal; // Capture exact height at the pole
      
      if (x === 0) ctx.moveTo(x, yTotal); else ctx.lineTo(x, yTotal);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Boundaries
    if (boundaryType === 'fixed') {
      // Fixed Wall
      ctx.fillStyle = '#222';
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.fillRect(L, cy - 100, 40, 200);
      ctx.strokeRect(L, cy - 100, 40, 200);
      
      // Bolts
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(L + 20, cy - 70, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(L + 20, cy + 70, 6, 0, Math.PI * 2); ctx.fill();

      // Clamp point
      ctx.fillStyle = theme.yellow;
      ctx.beginPath(); ctx.arc(L, cy, 5, 0, Math.PI * 2); ctx.fill();

    } else if (boundaryType === 'free') {
      // Free Pole
      ctx.fillStyle = '#444';
      ctx.fillRect(L + 5, cy - 120, 10, 240); // The metal rod
      
      // The sliding ring
      ctx.strokeStyle = '#aaa';
      ctx.fillStyle = theme.bg;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(L + 5, ringY, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // String tying point
      ctx.fillStyle = theme.yellow;
      ctx.beginPath(); ctx.arc(L - 3, ringY, 4, 0, Math.PI * 2); ctx.fill();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ 
        width: '360px', minWidth: '360px', padding: '25px', boxSizing: 'border-box', overflowY: 'auto',
        backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '16px', letterSpacing: '1px', marginBottom: '25px' }}>WAVE REFLECTION</h2>
        
        <div style={{ padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '4px', marginBottom: '30px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          Observe how a wave pulse reflects when it hits a boundary. <br/><br/>
          • <strong>Fixed End:</strong> Pulse reflects inverted (180° phase shift).<br/>
          • <strong>Free End:</strong> Pulse reflects upright (0° phase shift).
        </div>

        {/* BOUNDARY TOGGLE */}
        <div style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>BOUNDARY TYPE</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setBoundaryType('fixed')}
              style={modeBtnStyle(boundaryType === 'fixed', theme.red, theme)}
            >
              FIXED (CLOSED) END
            </button>
            <button 
              onClick={() => setBoundaryType('free')}
              style={modeBtnStyle(boundaryType === 'free', theme.green, theme)}
            >
              FREE (OPEN) END
            </button>
          </div>
        </div>

        {/* SLIDERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>PULSE AMPLITUDE</span><span style={{ color: theme.yellow, fontWeight: 'bold' }}>{amplitude}</span>
            </label>
            <input type="range" min="20" max="150" step="5" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} style={sliderStyle(theme.yellow)} />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>PULSE WIDTH</span><span style={{ color: theme.yellow, fontWeight: 'bold' }}>{pulseWidth}</span>
            </label>
            <input type="range" min="15" max="100" step="5" value={pulseWidth} onChange={(e) => setPulseWidth(Number(e.target.value))} style={sliderStyle(theme.yellow)} />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>WAVE SPEED</span><span style={{ color: theme.yellow, fontWeight: 'bold' }}>{speed}</span>
            </label>
            <input type="range" min="1" max="12" step="1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={sliderStyle(theme.yellow)} />
          </div>
        </div>

        {/* COMPONENT TOGGLE */}
        <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: `1px solid ${theme.border}`, marginBottom: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showComponents} 
              onChange={(e) => setShowComponents(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: theme.purple, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: showComponents ? theme.purple : theme.text, transition: '0.3s', fontWeight: showComponents ? 'bold' : 'normal' }}>
              SHOW MATH COMPONENTS
            </span>
          </label>
          <div style={{ fontSize: '10px', color: theme.subText, marginTop: '8px', paddingLeft: '26px' }}>
            Visualizes the incident wave and "ghost" reflected wave superimposed at the boundary.
          </div>
        </div>

        {/* FIRE PULSE / PLAY */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <button 
            onClick={() => { timeRef.current = 100; setIsPlaying(true); }} // Reset to start
            style={{ 
              flex: 1, padding: '14px', cursor: 'pointer', fontSize: '11px', 
              transition: 'all 0.2s', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)', border: `1px solid #555`, color: '#fff' 
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          >
            FIRE PULSE
          </button>

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ 
              flex: 1, padding: '14px', cursor: 'pointer', fontSize: '11px', 
              transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px',
              background: isPlaying ? 'rgba(255, 214, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)', 
              border: `1px solid ${isPlaying ? theme.yellow : theme.green}`, 
              color: isPlaying ? theme.yellow : theme.green, 
              boxShadow: `0 0 10px ${isPlaying ? 'rgba(255, 214, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
            }}
          >
            {isPlaying ? 'PAUSE' : 'RESUME'}
          </button>
        </div>

      </div>

      {/* CANVAS CONTAINER */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas ref={canvasRef} width={950} height={600} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

// UI Helpers
const modeBtnStyle = (isActive, color, theme) => ({
  flex: 1, padding: '12px 5px', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px', fontWeight: 'bold',
  backgroundColor: isActive ? `${color}22` : 'transparent',
  border: `1px solid ${isActive ? color : theme.border}`,
  color: isActive ? color : theme.subText,
  boxShadow: isActive ? `0 0 10px ${color}33` : 'none'
});

const sliderStyle = (color) => ({
  width: '100%', accentColor: color, cursor: 'pointer', height: '4px', outline: 'none', background: '#333', borderRadius: '2px'
});

export default WaveReflection;