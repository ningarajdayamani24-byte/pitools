import React, { useState, useEffect, useRef } from 'react';

const TorqueEquilibriumLab = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  
  // Pivot / Beam Controls
  const [beamMass, setBeamMass] = useState(2.0);
  const [m1, setM1] = useState(5.0); // Left Mass (kg)
  const [d1, setD1] = useState(2.0); // Left Distance (m)
  const [m2, setM2] = useState(5.0); // Right Mass (kg)
  const [d2, setD2] = useState(2.0); // Right Distance (m)

  const stateRef = useRef({
    angle: 0,
    angularVel: 0,
  });

  const setupCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  };

  const drawVector = (ctx, x, y, mag, color, label) => {
    const length = Math.min(mag * 1.5, 100);
    if (length === 0) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + length);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x - 5, y + length - 10);
    ctx.lineTo(x, y + length);
    ctx.lineTo(x + 5, y + length - 10);
    ctx.fill();
    ctx.font = 'bold 11px monospace';
    ctx.fillText(label, x - 20, y + length + 15);
    ctx.restore();
  };

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current);
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const g = 9.81;
      const dt = 0.05;
      const width = canvasRef.current.offsetWidth;
      const height = canvasRef.current.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      
      const beamLengthPx = 600;
      const scaleMtoPx = beamLengthPx / 10; 

      // Physics Logic
      const torqueLeft = m1 * g * d1;
      const torqueRight = m2 * g * d2;
      const netTorque = torqueRight - torqueLeft;
      
      const I = (1/12) * beamMass * 100 + (m1 * d1 * d1) + (m2 * d2 * d2);
      const alpha = netTorque / I;

      if (isRunning) {
        s.angularVel += alpha * dt;
        s.angle += s.angularVel * dt;
        s.angularVel *= 0.92; // Damping
        
        // Limits to prevent full 360 spin for realism
        if (s.angle > 0.6) s.angle = 0.6;
        if (s.angle < -0.6) s.angle = -0.6;
      }

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      
      // --- TECHNICAL GRID LINES ---
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, height); ctx.stroke(); }
      for(let i=0; i<height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width, i); ctx.stroke(); }

      // PIVOT
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - 25, centerY + 50);
      ctx.lineTo(centerX + 25, centerY + 50);
      ctx.closePath();
      ctx.fill();

      // BEAM
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(s.angle);
      
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(-beamLengthPx/2, 0); ctx.lineTo(beamLengthPx/2, 0); ctx.stroke();
      
      // Ruler markings
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      for(let i = -5; i <= 5; i++) {
        const x = i * scaleMtoPx;
        ctx.beginPath(); ctx.moveTo(x, -12); ctx.lineTo(x, 12); ctx.stroke();
      }

      // Masses
      ctx.fillStyle = '#448aff'; ctx.fillRect((-d1 * scaleMtoPx) - 15, -35, 30, 30);
      ctx.fillStyle = '#ff5252'; ctx.fillRect((d2 * scaleMtoPx) - 15, -35, 30, 30);
      ctx.restore();

      // VECTORS
      const rotX1 = centerX + (-d1 * scaleMtoPx) * Math.cos(s.angle);
      const rotY1 = centerY + (-d1 * scaleMtoPx) * Math.sin(s.angle);
      drawVector(ctx, rotX1, rotY1, m1 * 4, '#448aff', `m1·g`);

      const rotX2 = centerX + (d2 * scaleMtoPx) * Math.cos(s.angle);
      const rotY2 = centerY + (d2 * scaleMtoPx) * Math.sin(s.angle);
      drawVector(ctx, rotX2, rotY2, m2 * 4, '#ff5252', `m2·g`);

      // HUD
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
      ctx.fillText(`τ Left: ${torqueLeft.toFixed(2)} Nm`, 30, 40);
      ctx.fillText(`τ Right: ${torqueRight.toFixed(2)} Nm`, 30, 65);
      
      const isBalanced = Math.abs(netTorque) < 0.2;
      ctx.fillStyle = isBalanced ? '#69f0ae' : '#ff5252';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(isBalanced ? "STATUS: BALANCED" : "STATUS: UNBALANCED", 30, 100);

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, m1, d1, m2, d2, beamMass]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      
      <aside style={{ width: '340px', background: '#0a0a0a', borderRight: '1px solid #333', padding: '25px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '12px', letterSpacing: '2px', color: '#555', marginBottom: '30px' }}>TORQUE BALANCING</h2>
        
        <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff', marginBottom: '25px', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '10px', color: '#448aff', margin: '0 0 10px 0' }}>LEFT LOAD (m1)</h4>
          <label style={{ fontSize: '11px', color: '#888' }}>Mass: {m1} kg</label>
          <input type="range" min="1" max="25" step="0.5" value={m1} onChange={(e) => setM1(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />
          <label style={{ fontSize: '11px', color: '#888' }}>Distance: {d1} m</label>
          <input type="range" min="0.2" max="4.8" step="0.1" value={d1} onChange={(e) => setD1(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252', marginBottom: '25px', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '10px', color: '#ff5252', margin: '0 0 10px 0' }}>RIGHT LOAD (m2)</h4>
          <label style={{ fontSize: '11px', color: '#888' }}>Mass: {m2} kg</label>
          <input type="range" min="1" max="25" step="0.5" value={m2} onChange={(e) => setM2(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />
          <label style={{ fontSize: '11px', color: '#888' }}>Distance: {d2} m</label>
          <input type="range" min="0.2" max="4.8" step="0.1" value={d2} onChange={(e) => setD2(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <button onClick={() => { stateRef.current.angle = 0; stateRef.current.angularVel = 0; }} style={{ width: '100%', padding: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESET LEVEL</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontSize: '1.4rem' }}>Torque Equilibrium Lab</h1>
          <p style={{ color: '#555', fontSize: '12px', margin: '5px 0 0' }}>$\sum \tau = 0$ | Static Equilibrium Condition</p>
        </header>

        <section style={{ height: '550px', border: '1px solid #333', borderRadius: '12px', background: '#000', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </section>

        <div style={{ height: '50px' }}></div>
      </main>
    </div>
  );
};

export default TorqueEquilibriumLab;
