import React, { useState, useEffect, useRef } from 'react';

const StandingWaves = () => {
  const canvasRef = useRef(null);
  
  // State
  const [mode, setMode] = useState('string'); // 'string', 'open', 'closed'
  const [n, setN] = useState(1); // Harmonic number (1, 2, 3, etc.)
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTransverse, setShowTransverse] = useState(true);
  const [showLongitudinal, setShowLongitudinal] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showLength, setShowLength] = useState(true);
  
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
    grid: 'rgba(255, 255, 255, 0.05)',
    pipe: 'rgba(255, 255, 255, 0.15)'
  };

  // Ensure 'n' is valid when switching modes
  useEffect(() => {
    if (mode === 'closed') {
      // Closed air columns only have odd harmonics (1, 3, 5)
      if (n % 2 === 0) setN(1); 
    }
  }, [mode, n]);

  // Animation loop
  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.04;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, mode, n, showTransverse, showLongitudinal, showPressure, showLength]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Clear background & draw grid
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const startX = 150;
    const endX = width - 150;
    const W = endX - startX;
    const cy = 350; // Center Y
    const A = 120; // Amplitude for transverse
    const longA = 35; // Amplitude for longitudinal displacement

    // 1. DRAW PHYSICAL BOUNDARIES (Tube or String Mounts)
    if (mode === 'open' || mode === 'closed') {
      // Draw Glass Tube for Air Columns
      const tubeTop = cy - A - 25;
      const tubeBottom = cy + A + 25;
      ctx.strokeStyle = theme.pipe;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
      
      // Top and Bottom walls
      ctx.beginPath(); ctx.moveTo(startX, tubeTop); ctx.lineTo(endX, tubeTop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(startX, tubeBottom); ctx.lineTo(endX, tubeBottom); ctx.stroke();
      
      // Left Closed Wall
      if (mode === 'closed') {
        ctx.beginPath(); ctx.moveTo(startX, tubeTop); ctx.lineTo(startX, tubeBottom); ctx.stroke();
        // Crosshatch for solid wall
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for(let y=tubeTop; y<tubeBottom; y+=10) {
          ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(startX-15, y+10); ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
    } else if (mode === 'string') {
      // Draw String Anchors
      ctx.fillStyle = '#222';
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      // Left Anchor
      ctx.fillRect(startX - 20, cy - 40, 20, 80);
      ctx.strokeRect(startX - 20, cy - 40, 20, 80);
      // Right Anchor
      ctx.fillRect(endX, cy - 40, 20, 80);
      ctx.strokeRect(endX, cy - 40, 20, 80);
    }

    // Center equilibrium line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(startX - 20, cy); ctx.lineTo(endX + 20, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Mathematical Shape Functions
    const getDisplacementShape = (pos) => {
      if (mode === 'string') return Math.sin(n * Math.PI * pos); // Nodes at both ends
      if (mode === 'open') return Math.cos(n * Math.PI * pos); // Antinodes at both ends
      if (mode === 'closed') return Math.sin(n * (Math.PI / 2) * pos); // Node left, Antinode right
      return 0;
    };

    // Pressure is the spatial derivative of displacement (dP = -B * ds/dx)
    const getPressureShape = (pos) => {
      if (mode === 'open') return -Math.sin(n * Math.PI * pos); // Nodes at both ends
      if (mode === 'closed') return Math.cos(n * (Math.PI / 2) * pos); // Antinode left, Node right
      return 0;
    };

    // 2. DRAW PRESSURE HEATMAP (Air Columns Only)
    if (showPressure && (mode === 'open' || mode === 'closed')) {
      const step = 4; // Width of heatmap strips
      for (let x = startX; x <= endX; x += step) {
        const pos = (x - startX) / W;
        const pressureAmp = getPressureShape(pos);
        const instPressure = pressureAmp * Math.cos(t); // Instantaneous pressure
        
        let r=0, g=0, b=0, alpha=0;
        if (instPressure > 0.05) {
          // Compression (Red)
          r = 255; g = 42; b = 42;
          alpha = instPressure * 0.4;
        } else if (instPressure < -0.05) {
          // Rarefaction (Blue)
          r = 41; g = 121; b = 255;
          alpha = Math.abs(instPressure) * 0.4;
        }
        
        if (alpha > 0) {
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fillRect(x, cy - A - 24, step, (A * 2) + 48);
        }
      }
    }

    // 3. DRAW LONGITUDINAL MEDIUM (Green Lines)
    if (showLongitudinal) {
      const numLines = 75;
      const spacing = W / numLines;
      
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= numLines; i++) {
        const eqX = startX + (i * spacing);
        const pos = i / numLines;
        const shape = getDisplacementShape(pos);
        const displacement = longA * shape * Math.cos(t);
        const currentX = eqX + displacement;
        
        // Dynamic glow based on compression
        ctx.strokeStyle = `rgba(0, 230, 118, ${mode==='string' ? 0.6 : 0.8})`;
        ctx.beginPath();
        ctx.moveTo(currentX, cy - 100);
        ctx.lineTo(currentX, cy + 100);
        ctx.stroke();
      }
    }

    // 4. DRAW TRANSVERSE WAVE (Blue)
    if (showTransverse) {
      // Draw dynamic filled wave
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      for (let x = startX; x <= endX; x++) {
        const pos = (x - startX) / W;
        const y = cy - (A * getDisplacementShape(pos) * Math.cos(t));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(endX, cy);
      ctx.fillStyle = 'rgba(41, 121, 255, 0.1)';
      ctx.fill();

      // Outline
      ctx.beginPath();
      ctx.strokeStyle = theme.blue;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = theme.blue;
      for (let x = startX; x <= endX; x++) {
        const pos = (x - startX) / W;
        const y = cy - (A * getDisplacementShape(pos) * Math.cos(t));
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw faint static envelope bounds
      ctx.strokeStyle = 'rgba(41, 121, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      for (let x = startX; x <= endX; x++) {
        const pos = (x - startX) / W;
        const y = cy - A * Math.abs(getDisplacementShape(pos));
        if (x === startX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let x = startX; x <= endX; x++) {
        const pos = (x - startX) / W;
        const y = cy + A * Math.abs(getDisplacementShape(pos));
        if (x === startX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Node/Anchor points
      ctx.fillStyle = theme.blue;
      for (let x = startX; x <= endX; x += W/200) { // Check along the wave for true nodes
        const pos = (x - startX) / W;
        const shapeVal = Math.abs(getDisplacementShape(pos));
        // If amplitude is approx 0, it's a node (only draw at specific logical intervals to avoid messy overlap)
        if (shapeVal < 0.01) {
            ctx.beginPath(); ctx.arc(x, cy, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // 5. DRAW LENGTH CALCULATION
    if (showLength) {
      const labelY = cy + 200;
      
      // Arrows
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, labelY); ctx.lineTo(endX, labelY);
      ctx.moveTo(startX + 10, labelY - 5); ctx.lineTo(startX, labelY); ctx.lineTo(startX + 10, labelY + 5);
      ctx.moveTo(endX - 10, labelY - 5); ctx.lineTo(endX, labelY); ctx.lineTo(endX - 10, labelY + 5);
      ctx.stroke();

      // Calculate label logic
      let multiplier = 0;
      if (mode === 'string' || mode === 'open') multiplier = n / 2;
      else if (mode === 'closed') multiplier = n / 4;
      const labelText = `L = ${multiplier} λ`;

      // Text Background
      ctx.font = 'bold 26px monospace';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(startX + W/2 - textWidth/2 - 15, labelY - 20, textWidth + 30, 40);

      // Text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, startX + W/2, labelY);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '380px', 
        minWidth: '380px',
        padding: '25px', 
        boxSizing: 'border-box',
        overflowY: 'auto',
        backgroundColor: theme.panel, 
        borderRight: `1px solid ${theme.border}`, 
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '30px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px' }}>STANDING WAVES</h2>

        {/* MODE SELECTION */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>SYSTEM MODE</h3>
          {[
            { id: 'string', label: 'Waves on a String' },
            { id: 'open', label: 'Open Ended Air Column' },
            { id: 'closed', label: 'Closed End Air Column' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                width: '100%', padding: '12px', marginBottom: '10px', textAlign: 'left', fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.2s ease', borderRadius: '4px',
                backgroundColor: mode === m.id ? 'rgba(41, 121, 255, 0.15)' : 'transparent',
                border: `1px solid ${mode === m.id ? theme.blue : theme.border}`,
                color: mode === m.id ? theme.blue : theme.text,
                boxShadow: mode === m.id ? `0 0 10px rgba(41, 121, 255, 0.2)` : 'none'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* HARMONICS SELECTION */}
        <div style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>HARMONICS (n)</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'closed' 
              ? [1, 3, 5, 7].map(num => (
                  <button key={num} onClick={() => setN(num)} style={harmonicBtnStyle(num, n, theme)}>{num}{num===1?'st':num===3?'rd':'th'}</button>
                ))
              : [1, 2, 3, 4].map(num => (
                  <button key={num} onClick={() => setN(num)} style={harmonicBtnStyle(num, n, theme)}>{num}{num===1?'st':num===2?'nd':num===3?'rd':'th'}</button>
                ))
            }
          </div>
        </div>

        {/* VISIBILITY TOGGLES */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '25px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>GRAPH VISIBILITY</h3>
          
          <label style={checkboxStyle(showTransverse, theme.blue)}>
            <input type="checkbox" checked={showTransverse} onChange={(e) => setShowTransverse(e.target.checked)} style={inputStyle(theme.blue)} />
            <span>Show Transverse Wave</span>
          </label>
          
          <label style={checkboxStyle(showLongitudinal, theme.green)}>
            <input type="checkbox" checked={showLongitudinal} onChange={(e) => setShowLongitudinal(e.target.checked)} style={inputStyle(theme.green)} />
            <span>Show Longitudinal Wave</span>
          </label>

          <label style={{...checkboxStyle(showPressure, theme.red), opacity: mode === 'string' ? 0.3 : 1, pointerEvents: mode === 'string' ? 'none' : 'auto'}}>
            <input type="checkbox" checked={showPressure} onChange={(e) => setShowPressure(e.target.checked)} style={inputStyle(theme.red)} disabled={mode === 'string'} />
            <span>Show Pressure Variation (Heatmap)</span>
          </label>

          <label style={checkboxStyle(showLength, '#fff')}>
            <input type="checkbox" checked={showLength} onChange={(e) => setShowLength(e.target.checked)} style={inputStyle('#fff')} />
            <span>Show Length Calculation (L)</span>
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
          {isPlaying ? 'PAUSE ANIMATION' : 'PLAY ANIMATION'}
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

const harmonicBtnStyle = (num, currentN, theme) => ({
  flex: 1,
  padding: '10px 0',
  fontSize: '12px',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  backgroundColor: currentN === num ? 'rgba(255, 214, 0, 0.15)' : 'rgba(255,255,255,0.02)',
  border: `1px solid ${currentN === num ? theme.yellow : theme.border}`,
  color: currentN === num ? theme.yellow : theme.subText,
  boxShadow: currentN === num ? `0 0 10px rgba(255, 214, 0, 0.2)` : 'none'
});

const checkboxStyle = (isChecked, activeColor) => ({
  display: 'flex', 
  alignItems: 'center', 
  marginBottom: '15px', 
  cursor: 'pointer',
  fontSize: '13px', 
  color: isChecked ? activeColor : '#888',
  transition: 'color 0.2s ease'
});

const inputStyle = (color) => ({
  width: '16px', 
  height: '16px', 
  accentColor: color, 
  marginRight: '12px',
  cursor: 'pointer'
});

export default StandingWaves;