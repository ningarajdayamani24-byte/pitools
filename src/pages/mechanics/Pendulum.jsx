import React, { useState, useEffect, useRef } from 'react';

const PendulumLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls State
  const [mass, setMass] = useState(2.0);        // kg
  const [length, setLength] = useState(300);    // px (Length of string)
  const [gravity, setGravity] = useState(9.8);  // m/s^2
  const [initAngle, setInitAngle] = useState(45); // Degrees
  const [damping, setDamping] = useState(0.02); // Friction

  const stateRef = useRef({
    angle: (45 * Math.PI) / 180,
    angularVel: 0,
    angularAccel: 0,
    history: [] 
  });

  const resetSim = () => {
    setIsRunning(false);
    const s = stateRef.current;
    s.angle = (initAngle * Math.PI) / 180;
    s.angularVel = 0;
    s.history = [];
  };

  const drawVector = (ctx, x, y, magX, magY, color, label) => {
    const scale = 40;
    const endX = x + magX * scale;
    const endY = y + magY * scale;
    if (Math.abs(magX) < 0.01 && Math.abs(magY) < 0.01) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const head = 8;
    const angle = Math.atan2(endY - y, endX - x);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - head * Math.cos(angle - Math.PI / 6), endY - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - head * Math.cos(angle + Math.PI / 6), endY - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(label, endX + 5, endY);
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.15;
      const pivotX = 500;
      const pivotY = 50;

      if (isRunning) {
        // Physics: alpha = -(g/L) * sin(theta) - damping * omega
        s.angularAccel = -(gravity / (length / 50)) * Math.sin(s.angle) - damping * s.angularVel;
        s.angularVel += s.angularAccel * dt;
        s.angle += s.angularVel * dt;

        s.history.push({ a: s.angle, v: s.angularVel });
        if (s.history.length > 600) s.history.shift();
      }

      // --- SIMULATION RENDER ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Grid
      ctx.strokeStyle = '#111';
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const bobX = pivotX + length * Math.sin(s.angle);
      const bobY = pivotY + length * Math.cos(s.angle);

      // String
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

      // Pivot
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill();

      // Bob (Mass)
      ctx.save();
      ctx.fillStyle = 'rgba(68, 138, 255, 0.3)';
      ctx.strokeStyle = '#448aff';
      ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.beginPath(); ctx.arc(bobX, bobY, 20 + mass*2, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();
      ctx.restore();

      // HUD Labels
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText(`θ: ${(s.angle * 180 / Math.PI).toFixed(1)}°`, bobX + 25, bobY);
      ctx.fillText(`ω: ${s.angularVel.toFixed(2)} rad/s`, bobX + 25, bobY + 15);

      // Vectors
      const vX = Math.cos(s.angle) * s.angularVel;
      const vY = -Math.sin(s.angle) * s.angularVel;
      drawVector(ctx, bobX, bobY, vX, vY, '#00e5ff', 'v');

      // --- GRAPH RENDER ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (s.history.length > 2) {
        // Angle Plot (Red)
        gCtx.beginPath(); gCtx.strokeStyle = '#ff5252'; gCtx.lineWidth = 2;
        s.history.forEach((h, i) => {
          const x = (i / 600) * gCanvas.width;
          const y = (gCanvas.height/2) - h.a * 40;
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, length, gravity, mass, damping]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '80px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>Simple Pendulum Lab</h1>
        <div style={{ height: '3px', width: '80px', background: '#00e5ff', margin: '10px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <canvas ref={canvasRef} width="1000" height="500" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
          
          <div style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
            <span style={{ color: '#ff5252', fontSize: '11px', fontWeight: 'bold' }}>━ ANGULAR DISPLACEMENT VARIATION (θ)</span>
            <canvas ref={graphRef} width="960" height="200" />
          </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '85vh', overflowY: 'auto' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '18px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
            {isRunning ? 'PAUSE' : 'START SWING'}
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>INITIAL ANGLE: {initAngle}°</label>
            <input type="range" min="1" max="90" value={initAngle} onChange={(e) => setInitAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>STRING LENGTH: {length}px</label>
            <input type="range" min="100" max="450" value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>GRAVITY: {gravity} m/s²</label>
            <input type="range" min="1" max="20" step="0.1" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>DAMPING (FRICTION): {damping}</label>
            <input type="range" min="0" max="0.2" step="0.01" value={damping} onChange={(e) => setDamping(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default PendulumLab;
