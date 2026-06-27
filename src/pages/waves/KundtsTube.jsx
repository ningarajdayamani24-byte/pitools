import React, { useState, useEffect, useRef } from 'react';

const KundtsTube = () => {
  const canvasRef = useRef(null);
  
  // Physics State
  const [frequency, setFrequency] = useState(650); // Hz
  const [amplitude, setAmplitude] = useState(80); // Speaker power
  const [speedOfSound, setSpeedOfSound] = useState(343); // m/s
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Visual Toggles
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showNodes, setShowNodes] = useState(false);
  
  const timeRef = useRef(0);
  const particlesRef = useRef([]);

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
    glass: 'rgba(255, 255, 255, 0.15)',
    particle: '#ffd600', // Yellow styrofoam beads
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  // Initialize Particles (Styrofoam Beads)
  useEffect(() => {
    const numParticles = 800;
    const newParticles = [];
    // Tube bounds (hardcoded based on draw function below)
    const startX = 180;
    const endX = 850;
    const floorY = 410;

    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        x: startX + Math.random() * (endX - startX),
        y: floorY - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0
      });
    }
    particlesRef.current = newParticles;
  }, []);

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.05;
        updatePhysics();
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, frequency, amplitude, showEnvelope, showNodes]);

  const updatePhysics = () => {
    const startX = 180;
    const endX = 850; // The solid plunger (Displacement Node)
    const floorY = 410;
    const ceilY = 290;
    
    const lambda = (speedOfSound / frequency) * 400; // Scaled for pixels
    const k = (2 * Math.PI) / lambda;
    
    // Power factor scales 0.0 to 1.0 based on amplitude slider
    const power = amplitude / 100;

    particlesRef.current.forEach(p => {
      // 1. Calculate distance from the solid wall (plunger at right)
      // A solid wall forces a displacement NODE (particles can't move left/right into the wall)
      const distFromWall = endX - p.x;
      
      if (distFromWall < 0 || p.x < startX) {
        // Keep in bounds
        p.x = Math.max(startX, Math.min(p.x, endX));
        p.vx *= -0.5;
      }

      // 2. Standing Wave Math
      // Envelope of displacement (0 at nodes, 1 at antinodes)
      const displacementEnvelope = Math.abs(Math.sin(k * distFromWall));
      
      // Acoustic Radiation Pressure (Acoustic Drift)
      // Pushes particles AWAY from displacement antinodes (high violent motion)
      // and TOWARDS displacement nodes (still air).
      // Math: derivative of the energy density -> sin(2kx)
      const driftForce = Math.sin(2 * k * distFromWall) * 1.5 * power;
      
      // 3. Apply Forces
      p.vx += driftForce;
      
      // Add random jitter (Brownian motion) proportional to the local air violence (displacement envelope)
      // If they are in an antinode, they bounce violently. If at a node, they sit still.
      const jitter = displacementEnvelope * 4.5 * power;
      p.vx += (Math.random() - 0.5) * jitter;
      p.vy -= (Math.random()) * jitter; // Pushes them up into the air
      
      // Gravity
      p.vy += 0.6; 
      
      // Friction / Air Resistance
      p.vx *= 0.85;
      p.vy *= 0.90;

      // 4. Update Position
      p.x += p.vx;
      p.y += p.vy;

      // Floor & Ceiling collisions
      if (p.y > floorY) {
        p.y = floorY;
        p.vy *= -0.3; // Dampened bounce
      }
      if (p.y < ceilY) {
        p.y = ceilY;
        p.vy *= -0.5;
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Clear Background & Grid
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const startX = 180;
    const endX = 850; // The plunger
    const L = endX - startX;
    const floorY = 415;
    const ceilY = 285;
    const cy = (floorY + ceilY) / 2;

    const lambda = (speedOfSound / frequency) * 400; // Pixel scaling
    const k = (2 * Math.PI) / lambda;

    // 1. Draw Glass Tube
    ctx.strokeStyle = theme.glass;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
    // Top & Bottom
    ctx.beginPath(); ctx.moveTo(startX, ceilY); ctx.lineTo(endX, ceilY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(startX, floorY); ctx.lineTo(endX, floorY); ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Draw Plunger (Right Wall)
    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.fillRect(endX, ceilY, 20, floorY - ceilY);
    ctx.strokeRect(endX, ceilY, 20, floorY - ceilY);
    // Plunger Rod
    ctx.fillStyle = '#333';
    ctx.fillRect(endX + 20, cy - 5, 50, 10);

    // 3. Draw Speaker (Left Wall)
    const speakerVibration = (amplitude / 100) * Math.sin(t * 5) * 5;
    const speakerX = startX - 20 + speakerVibration;
    
    ctx.fillStyle = '#222';
    ctx.fillRect(speakerX - 40, ceilY - 20, 40, floorY - ceilY + 40); // Magnet box
    
    // Speaker Cone
    ctx.fillStyle = theme.border;
    ctx.beginPath();
    ctx.moveTo(speakerX - 10, cy - 30);
    ctx.lineTo(speakerX + 20, ceilY + 5);
    ctx.lineTo(speakerX + 20, floorY - 5);
    ctx.lineTo(speakerX - 10, cy + 30);
    ctx.fill();

    // 4. Draw Wave Envelope Overlay (Blue)
    if (showEnvelope) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(41, 121, 255, 0.6)';
      ctx.fillStyle = 'rgba(41, 121, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Draw top envelope
      ctx.moveTo(endX, cy);
      for (let x = endX; x >= startX; x--) {
        const dist = endX - x;
        const envY = cy - 60 * Math.abs(Math.sin(k * dist));
        ctx.lineTo(x, envY);
      }
      
      // Draw bottom envelope
      for (let x = startX; x <= endX; x++) {
        const dist = endX - x;
        const envY = cy + 60 * Math.abs(Math.sin(k * dist));
        ctx.lineTo(x, envY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Particles (Styrofoam Beads)
    ctx.fillStyle = theme.particle;
    ctx.shadowBlur = 5;
    ctx.shadowColor = theme.particle;
    
    particlesRef.current.forEach(p => {
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.shadowBlur = 0;

    // 6. Draw Node Markers
    if (showNodes) {
      ctx.strokeStyle = theme.red;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      // Find where nodes exist (sin(kx) == 0)
      for (let x = endX; x >= startX; x--) {
        const dist = endX - x;
        const val = Math.abs(Math.sin(k * dist));
        
        // If we hit a node (approximate due to pixel stepping)
        if (val < 0.05) {
          ctx.beginPath();
          ctx.moveTo(x, ceilY - 20);
          ctx.lineTo(x, floorY + 20);
          ctx.stroke();
          
          ctx.fillStyle = theme.red;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('NODE', x, ceilY - 25);
        }
      }
      ctx.setLineDash([]);
    }

    // 7. Labels
    ctx.fillStyle = theme.subText;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Wavelength (λ): ${((speedOfSound / frequency)*100).toFixed(1)} cm`, 20, 30);
    
    // Dynamic text next to speaker
    ctx.fillStyle = theme.blue;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${frequency} Hz`, speakerX - 50, ceilY - 30);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ 
        width: '380px', minWidth: '380px', padding: '25px', boxSizing: 'border-box', overflowY: 'auto',
        backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '10px' }}>KUNDT'S TUBE</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '25px' }}>ACOUSTIC LEVITATION</h3>

        <div style={{ padding: '15px', border: `1px solid ${theme.yellow}`, borderRadius: '4px', marginBottom: '35px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(255, 214, 0, 0.05)' }}>
          <strong>CRAZY PHYSICS:</strong> The speaker creates a <strong>Longitudinal Standing Wave</strong>. The air vibrates violently at the <em>antinodes</em>, blowing the styrofoam beads away until they get trapped in the absolute silence of the <em>nodes</em>!
        </div>

        {/* SLIDERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px' }}>
          
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>SPEAKER FREQUENCY</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{frequency} Hz</span>
            </label>
            <input 
              type="range" min="300" max="1000" step="10" 
              value={frequency} 
              onChange={(e) => setFrequency(Number(e.target.value))} 
              style={sliderStyle(theme.blue)} 
            />
            <div style={{ fontSize: '9px', color: theme.subText, marginTop: '8px' }}>
              Change frequency to alter the wavelength and node positions.
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>SPEAKER POWER</span>
              <span style={{ color: theme.yellow, fontWeight: 'bold' }}>{amplitude}%</span>
            </label>
            <input 
              type="range" min="0" max="100" step="1" 
              value={amplitude} 
              onChange={(e) => setAmplitude(Number(e.target.value))} 
              style={sliderStyle(theme.yellow)} 
            />
          </div>

        </div>

        {/* TOGGLES */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '25px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>VISUAL OVERLAYS</h3>
          
          <label style={checkboxStyle(showEnvelope, theme.blue)}>
            <input type="checkbox" checked={showEnvelope} onChange={(e) => setShowEnvelope(e.target.checked)} style={inputStyle(theme.blue)} />
            <span>Show Displacement Envelope</span>
          </label>
          
          <label style={checkboxStyle(showNodes, theme.red)}>
            <input type="checkbox" checked={showNodes} onChange={(e) => setShowNodes(e.target.checked)} style={inputStyle(theme.red)} />
            <span>Mark Displacement Nodes (Still Air)</span>
          </label>
        </div>

        {/* PLAY/PAUSE */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '100%', padding: '14px', cursor: 'pointer', fontSize: '12px', marginTop: 'auto', flexShrink: 0,
            transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '2px',
            background: isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
            border: `1px solid ${isPlaying ? theme.red : theme.green}`, 
            color: isPlaying ? theme.red : theme.green, 
            boxShadow: `0 0 15px ${isPlaying ? 'rgba(255, 42, 42, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
          }}
        >
          {isPlaying ? 'MUTE SPEAKER' : 'POWER SPEAKER'}
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

// Sleek UI Helpers
const sliderStyle = (color) => ({
  width: '100%', accentColor: color, cursor: 'pointer', height: '4px', background: '#222', borderRadius: '2px', outline: 'none'
});

const checkboxStyle = (isChecked, activeColor) => ({
  display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', fontSize: '12px', 
  color: isChecked ? activeColor : '#888', transition: 'color 0.2s ease'
});

const inputStyle = (color) => ({
  width: '16px', height: '16px', accentColor: color, marginRight: '12px', cursor: 'pointer'
});

export default KundtsTube;
