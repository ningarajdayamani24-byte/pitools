import React, { useState, useEffect, useRef } from 'react';

const TransverseSuperposition = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const timeRef = useRef(0);

  // Physics and UI State
  const [speed, setSpeed] = useState(1);
  const [lambda1, setLambda1] = useState(2.5);
  const [amp1, setAmp1] = useState(1);
  const [lambda2, setLambda2] = useState(2.5);
  const [amp2, setAmp2] = useState(1);
  
  const [showGrid, setShowGrid] = useState(true);
  const [oppositeDir, setOppositeDir] = useState(true);
  const [showTogether, setShowTogether] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Canvas scaling
  const pixelsPerMeter = 70; 
  const width = 900;
  const height = 700;

  const animate = () => {
    if (isPlaying) {
      timeRef.current += 0.016 * speed; 
    }
    drawWaves();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, speed, lambda1, amp1, lambda2, amp2, showGrid, oppositeDir, showTogether]);

  const drawWaves = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const t = timeRef.current;

    // Clear canvas with dark background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // Draw Cyberpunk Grid
    if (showGrid) {
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Vertical lines
      for (let x = 0; x <= width; x += pixelsPerMeter / 2) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal lines
      for (let y = 0; y <= height; y += pixelsPerMeter / 2) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw Main Axes
      ctx.strokeStyle = '#444444';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const yCenters = showTogether ? [height / 2] : [height / 6, height / 2, (5 * height) / 6];
      yCenters.forEach(y => {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const getWaveY = (x, amplitude, lambda, isMovingLeft) => {
      const k = (2 * Math.PI) / lambda;
      const omega = k * speed;
      const phase = isMovingLeft ? (k * x + omega * t) : (k * x - omega * t);
      return amplitude * Math.sin(phase);
    };

    // Glowing Line Drawer
    const drawPath = (color, yOffset, waveFn) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      
      // Neon Glow Effect
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;

      for (let px = 0; px <= width; px++) {
        const xMeters = px / pixelsPerMeter;
        const yMeters = waveFn(xMeters);
        const py = yOffset - (yMeters * pixelsPerMeter);
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      
      // Reset shadow for performance on other elements
      ctx.shadowBlur = 0; 
    };

    const y1 = showTogether ? height / 2 : height / 6;
    const y2 = showTogether ? height / 2 : height / 2;
    const y3 = showTogether ? height / 2 : (5 * height) / 6;

    // Draw Waves with Neon Colors
    drawPath('#ff2a2a', y1, (x) => getWaveY(x, amp1, lambda1, false)); // Neon Red
    drawPath('#00e5ff', y2, (x) => getWaveY(x, amp2, lambda2, oppositeDir)); // Neon Cyan
    
    // Resultant Wave
    drawPath('#d500f9', y3, (x) => {
      return getWaveY(x, amp1, lambda1, false) + getWaveY(x, amp2, lambda2, oppositeDir);
    }); // Neon Purple/Magenta
  };

  // UI Styling Objects
  const theme = {
    bg: '#0a0a0c',
    sidebar: '#111114',
    text: '#ffffff',
    textMuted: '#888888',
    border: '#2a2a35',
    accentCyan: '#00e5ff',
    accentRed: '#ff2a2a',
    accentPurple: '#d500f9',
    accentYellow: '#ffd600',
    font: '"Courier New", Courier, monospace'
  };

  // UPDATED: Fixed layout conflict for MainLayout wrapper
  const containerStyle = { 
    display: 'flex', 
    minHeight: 'calc(100vh - 80px)', // Adjusts for the navbar height
    backgroundColor: theme.bg, 
    color: theme.text, 
    fontFamily: theme.font, 
    margin: 0
  };
  
  const sidebarStyle = { width: '340px', backgroundColor: theme.sidebar, padding: '20px', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto' };
  const canvasContainerStyle = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '20px' };
  
  const sectionHeaderStyle = (color) => ({ color: color, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '15px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' });
  const labelStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: theme.textMuted };
  const inputStyle = (color) => ({ width: '100%', accentColor: color, cursor: 'pointer', marginBottom: '10px' });
  const buttonStyle = { backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '10px 15px', cursor: 'pointer', fontFamily: theme.font, textTransform: 'uppercase', fontSize: '12px', flex: 1, transition: 'all 0.2s' };

  return (
    <div style={containerStyle}>
      
      {/* LEFT SIDEBAR CONTROLS */}
      <div style={sidebarStyle}>
        <div>
          <h2 style={{ fontSize: '18px', letterSpacing: '2px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Wave Superposition</h2>
          <p style={{ fontSize: '11px', color: theme.textMuted, margin: 0 }}>Net Wave Function</p>
        </div>

        {/* System Controls */}
        <div>
          <div style={sectionHeaderStyle(theme.accentYellow)}>System Controls</div>
          <div style={labelStyle}><span>Wave Speed (v)</span><span>{speed.toFixed(1)} m/s</span></div>
          <input type="range" min="0" max="3" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} style={inputStyle(theme.accentYellow)} />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button style={{...buttonStyle, borderColor: isPlaying ? theme.accentCyan : theme.border, color: isPlaying ? theme.accentCyan : theme.text}} onClick={() => setIsPlaying(true)}>Play</button>
            <button style={{...buttonStyle, borderColor: !isPlaying ? theme.accentYellow : theme.border, color: !isPlaying ? theme.accentYellow : theme.text}} onClick={() => setIsPlaying(false)}>Pause</button>
          </div>
        </div>

        {/* Wave 1 Controls */}
        <div>
          <div style={sectionHeaderStyle(theme.accentRed)}>Wave 1 (Red)</div>
          <div style={labelStyle}><span>Wavelength (λ)</span><span>{lambda1.toFixed(1)} m</span></div>
          <input type="range" min="0.5" max="5" step="0.1" value={lambda1} onChange={(e) => setLambda1(parseFloat(e.target.value))} style={inputStyle(theme.accentRed)} />
          
          <div style={labelStyle}><span>Amplitude (A)</span><span>{amp1.toFixed(1)} m</span></div>
          <input type="range" min="0" max="1.5" step="0.1" value={amp1} onChange={(e) => setAmp1(parseFloat(e.target.value))} style={inputStyle(theme.accentRed)} />
        </div>

        {/* Wave 2 Controls */}
        <div>
          <div style={sectionHeaderStyle(theme.accentCyan)}>Wave 2 (Cyan)</div>
          <div style={labelStyle}><span>Wavelength (λ)</span><span>{lambda2.toFixed(1)} m</span></div>
          <input type="range" min="0.5" max="5" step="0.1" value={lambda2} onChange={(e) => setLambda2(parseFloat(e.target.value))} style={inputStyle(theme.accentCyan)} />
          
          <div style={labelStyle}><span>Amplitude (A)</span><span>{amp2.toFixed(1)} m</span></div>
          <input type="range" min="0" max="1.5" step="0.1" value={amp2} onChange={(e) => setAmp2(parseFloat(e.target.value))} style={inputStyle(theme.accentCyan)} />
        </div>

        {/* View Settings */}
        <div>
          <div style={sectionHeaderStyle(theme.textMuted)}>View Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: theme.textMuted }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} style={{ accentColor: theme.accentYellow }}/> Show Grid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={oppositeDir} onChange={() => setOppositeDir(!oppositeDir)} style={{ accentColor: theme.accentYellow }}/> Move Opposite Directions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showTogether} onChange={() => setShowTogether(!showTogether)} style={{ accentColor: theme.accentYellow }}/> Overlay Waves (Interference)
            </label>
          </div>
        </div>

      </div>

      {/* RIGHT CANVAS AREA */}
      <div style={canvasContainerStyle}>
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height} 
          style={{ 
            display: 'block', 
            borderRadius: '4px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }} 
        />
      </div>

    </div>
  );
};

export default TransverseSuperposition;