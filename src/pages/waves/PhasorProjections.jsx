import React, { useState, useEffect, useRef } from 'react';

const PhasorProjections = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const timeRef = useRef(0);

  // Physics Parameters (Matching screenshot ranges)
  const [amplitude, setAmplitude] = useState(1.1); // A
  const [omega, setOmega] = useState(1.4); // Angular frequency (w)
  
  // UI Toggles (Matching screenshot exact options)
  const [showPos, setShowPos] = useState(true);
  const [showVel, setShowVel] = useState(true);
  const [showAcc, setShowAcc] = useState(true);
  
  const [showPosEq, setShowPosEq] = useState(true);
  const [showVelEq, setShowVelEq] = useState(true);
  const [showAccEq, setShowAccEq] = useState(true);
  
  const [showGrid, setShowGrid] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Canvas scaling
  const width = 900;
  const height = 700;
  const cx = 220; // Center X of the concentric circles
  const cy = height / 2; // Center Y
  const waveStartX = 450; // Where the graph begins
  const pxPerUnit = 40; // Scales the math values to pixels
  const waveSpeed = 80; // Pixels per second horizontal scroll

  // Theme Colors based on screenshot (but neon for dark mode)
  const colors = {
    pos: '#2979ff', // Bright Blue
    vel: '#00e676', // Bright Green
    acc: '#ff2a2a', // Bright Red
    bg: '#0a0a0c',
    sidebar: '#111114',
    grid: '#222222',
    text: '#ffffff',
    textMuted: '#888888',
    border: '#2a2a35'
  };

  const animate = () => {
    if (isPlaying) {
      timeRef.current += 0.016; // Approx 60fps
    }
    drawSimulation();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, amplitude, omega, showPos, showVel, showAcc, showPosEq, showVelEq, showAccEq, showGrid]);

  // Helper to draw an arrowhead vector
  const drawArrow = (ctx, fromX, fromY, toX, toY, color) => {
    const headlen = 12; 
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Main line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));
    ctx.lineTo(toX, toY);
    ctx.fill();
  };

  const drawSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const t = timeRef.current;

    // 1. Clear Canvas 
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid & Axes
    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y <= height; y += pxPerUnit) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      for (let x = 0; x <= width; x += pxPerUnit) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      ctx.stroke();

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(width, cy); // Main X Axis
      ctx.moveTo(cx, 0); ctx.lineTo(cx, height); // Circle Y Axis
      ctx.moveTo(waveStartX, 0); ctx.lineTo(waveStartX, height); // Graph Y Axis
      ctx.stroke();
    }

    // 3. Core Drawing Logic for each property
    const drawSystem = (ampVal, funcY, funcX, color, equationText, showWave, showEq, eqYOffset) => {
      const radius = Math.abs(ampVal * pxPerUnit);
      const currentY = funcY(t) * pxPerUnit;
      const currentX = funcX(t) * pxPerUnit;

      if (showWave) {
        // Draw Concentric Circle
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw Vector Arrow (Phasor)
        drawArrow(ctx, cx, cy, cx + currentX, cy - currentY, color);

        // Draw Connecting Dotted Line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(cx + currentX, cy - currentY);
        ctx.lineTo(waveStartX, cy - currentY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Draw Connecting Node (dot on the axis)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(waveStartX, cy - currentY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Continuous Waveform
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        
        for (let x = waveStartX; x < width; x++) {
          const pixelAge = (x - waveStartX) / waveSpeed; 
          const historicalTime = t - pixelAge;
          const y = funcY(historicalTime) * pxPerUnit;
          if (x === waveStartX) ctx.moveTo(x, cy - y);
          else ctx.lineTo(x, cy - y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
      }

      // Draw Equation Text directly on Canvas
      if (showEq) {
        ctx.fillStyle = color;
        ctx.font = 'bold 22px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        // Position equations at bottom of canvas, spaced out
        ctx.fillText(equationText, waveStartX + 200, height - eqYOffset);
      }
    };

    // Math models matched precisely to your screenshot.
    // Angles shift CCW to maintain perfect 90 and 180 degree relationships.
    
    // Position (Blue): x = A*cos(wt)
    drawSystem(
      amplitude, 
      (time) => amplitude * Math.cos(omega * time), 
      (time) => -amplitude * Math.sin(omega * time), 
      colors.pos, 
      'x = Acos(ωt)', 
      showPos, showPosEq, 100
    );

    // Velocity (Green): v = -wA*sin(wt)
    drawSystem(
      amplitude * omega, 
      (time) => -amplitude * omega * Math.sin(omega * time), 
      (time) => -amplitude * omega * Math.cos(omega * time), 
      colors.vel, 
      'v = -ωAsin(ωt)', 
      showVel, showVelEq, 65
    );

    // Acceleration (Red): a = -w²A*cos(wt)
    drawSystem(
      amplitude * omega * omega, 
      (time) => -amplitude * omega * omega * Math.cos(omega * time), 
      (time) => amplitude * omega * omega * Math.sin(omega * time), 
      colors.acc, 
      'a = -ω²Acos(ωt)', 
      showAcc, showAccEq, 30
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: colors.bg, color: colors.text, fontFamily: '"Courier New", Courier, monospace', margin: 0 }}>
      
      {/* SIDEBAR CONTROLS */}
      <div style={{ width: '340px', backgroundColor: colors.sidebar, padding: '20px', borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto' }}>
        <div>
          <h2 style={{ fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Oscillations</h2>
          <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>Phasor Projections</p>
        </div>

        {/* Sliders */}
        <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}`, borderRadius: '4px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
            <span>Amplitude (A)</span><span>{amplitude.toFixed(1)}</span>
          </label>
          <input type="range" min="0.5" max="2" step="0.1" value={amplitude} onChange={(e) => setAmplitude(parseFloat(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />

          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
            <span>Angular Freq (ω)</span><span>{omega.toFixed(1)}</span>
          </label>
          <input type="range" min="0.5" max="2" step="0.1" value={omega} onChange={(e) => setOmega(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>

        {/* Graph Toggles */}
        <div>
          <div style={{ color: colors.textMuted, fontSize: '12px', letterSpacing: '1px', marginBottom: '15px', textTransform: 'uppercase', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>Graph Visibility</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.pos }}>
              <input type="checkbox" checked={showPos} onChange={() => setShowPos(!showPos)} /> Show Position Graph
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.vel }}>
              <input type="checkbox" checked={showVel} onChange={() => setShowVel(!showVel)} /> Show Velocity Graph
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.acc }}>
              <input type="checkbox" checked={showAcc} onChange={() => setShowAcc(!showAcc)} /> Show Acceleration Graph
            </label>
          </div>
        </div>

        {/* Equation Toggles */}
        <div>
          <div style={{ color: colors.textMuted, fontSize: '12px', letterSpacing: '1px', marginBottom: '15px', textTransform: 'uppercase', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>Equation Visibility</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.pos }}>
              <input type="checkbox" checked={showPosEq} onChange={() => setShowPosEq(!showPosEq)} /> Show Position Equation
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.vel }}>
              <input type="checkbox" checked={showVelEq} onChange={() => setShowVelEq(!showVelEq)} /> Show Velocity Equation
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.acc }}>
              <input type="checkbox" checked={showAccEq} onChange={() => setShowAccEq(!showAccEq)} /> Show Acceleration Equation
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: colors.textMuted, marginTop: '15px' }}>
              <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} /> Show Grid and Axes
            </label>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            style={{ width: '100%', padding: '12px', backgroundColor: isPlaying ? 'rgba(255,255,255,0.05)' : colors.pos, border: `1px solid ${isPlaying ? colors.border : colors.pos}`, color: colors.text, cursor: 'pointer', fontFamily: '"Courier New", Courier, monospace', fontWeight: 'bold' }} 
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'PAUSE SIMULATION' : 'PLAY SIMULATION'}
          </button>
        </div>

      </div>

      {/* CANVAS AREA */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', borderRadius: '4px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} />
      </div>

    </div>
  );
};

export default PhasorProjections;