import React, { useState, useEffect, useRef } from 'react';

const RotationalInertiaLab = () => {
  const canvasRef = useRef(null);
  const graphAlphaRef = useRef(null);
  const graphLinearRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Scenarios and State
  const [massDist, setMassDist] = useState('solidSphere'); 
  const [simType, setSimType] = useState('constantForce'); 

  // Parameters
  const [radius, setRadius] = useState(1.5); 
  const [pulleyMass, setPulleyMass] = useState(5.0); 
  const [pullingForce, setPullingForce] = useState(30.0); 
  const [m1, setM1] = useState(5.0); 
  const [m2, setM2] = useState(2.0); 

  const stateRef = useRef({
    omega: 0, theta: 0, alpha: 0, linearA: 0, history: [],
    pos1: 150, pos2: 150, pointerPath: []
  });

  const inertiaData = {
    solidSphere: { name: "Solid Sphere", beta: 0.4, color: "#ff5252" },
    sphericalShell: { name: "Spherical Shell", beta: 0.67, color: "#ff4081" },
    solidCylinder: { name: "Solid Cylinder", beta: 0.5, color: "#448aff" },
    cylindricalShell: { name: "Cylindrical Shell", beta: 1.0, color: "#00e5ff" }
  };

  const resetSim = () => {
    const s = stateRef.current;
    s.omega = 0; s.theta = 0; s.alpha = 0; s.linearA = 0; s.history = [];
    s.pos1 = 150; s.pos2 = 150; s.pointerPath = [];
    setIsRunning(false);
  };

  const setupCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  };

  const drawVector = (ctx, x, y, mag, color, label, downward = true) => {
    if (Math.abs(mag) < 1) return;
    const dir = downward ? 1 : -1;
    const length = Math.min(Math.abs(mag) * 2, 80);
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + length * dir); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6, y + (length - 10) * dir);
    ctx.lineTo(x, y + length * dir);
    ctx.lineTo(x + 6, y + (length - 10) * dir);
    ctx.fill();
    ctx.font = 'bold 11px monospace';
    ctx.fillText(label, x + 10, y + (length/2) * dir);
    ctx.restore();
  };

  useEffect(() => {
    const ctx = setupCanvas(canvasRef.current);
    const gAlphaCtx = setupCanvas(graphAlphaRef.current);
    const gLinearCtx = setupCanvas(graphLinearRef.current);
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.05;
      const g = 9.81;
      const width = canvasRef.current.offsetWidth;
      const height = canvasRef.current.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2 - 50;
      
      const R_px = radius * 45; 
      const beta = inertiaData[massDist].beta;
      const I_pulley = beta * pulleyMass * (radius * radius);

      if (isRunning) {
        let netTorque = 0;
        let totalInertia = I_pulley;

        if (simType === 'constantForce') {
          netTorque = pullingForce * radius;
        } else if (simType === 'fallingMass') {
          netTorque = m1 * g * radius;
          totalInertia += m1 * (radius * radius);
        } else if (simType === 'twoMasses') {
          netTorque = (m1 - m2) * g * radius;
          totalInertia += (m1 + m2) * (radius * radius);
        }

        s.alpha = netTorque / totalInertia;
        s.linearA = s.alpha * radius;
        s.omega += s.alpha * dt;
        s.theta += s.omega * dt;

        s.pos1 += s.linearA * 10;
        s.pos2 -= s.linearA * 10;

        const pX = centerX + R_px * Math.cos(s.theta);
        const pY = centerY + R_px * Math.sin(s.theta);
        s.pointerPath.push({x: pX, y: pY});
        if (s.pointerPath.length > 80) s.pointerPath.shift();

        s.history.push({ alpha: s.alpha, linearA: s.linearA });
        if (s.history.length > 300) s.history.shift();
      }

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      
      // GRID LINES
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<width; i+=30) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, height); ctx.stroke(); }
      for(let i=0; i<height; i+=30) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width, i); ctx.stroke(); }

      // Path Trail
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 2;
      ctx.beginPath();
      s.pointerPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();

      // Pulley
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(s.theta);
      ctx.strokeStyle = inertiaData[massDist].color;
      ctx.lineWidth = (massDist.includes('Shell')) ? 10 : 4;
      ctx.shadowBlur = 15; ctx.shadowColor = inertiaData[massDist].color;
      ctx.beginPath(); ctx.arc(0, 0, R_px, 0, Math.PI * 2); ctx.stroke();
      
      // Pointer Dot
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(R_px, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Hanging Masses & Vectors
      ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(centerX + R_px, centerY); ctx.lineTo(centerX + R_px, centerY + s.pos1); ctx.stroke();
      
      if (simType === 'constantForce') {
        drawVector(ctx, centerX + R_px, centerY + 100, pullingForce, '#ff5252', 'F_pull');
      } else {
        ctx.fillStyle = '#448aff'; ctx.fillRect(centerX + R_px - 15, centerY + s.pos1, 30, 30);
        drawVector(ctx, centerX + R_px, centerY + s.pos1 + 30, m1 * g, '#ff5252', 'm1·g');
      }

      if (simType === 'twoMasses') {
        ctx.beginPath(); ctx.moveTo(centerX - R_px, centerY); ctx.lineTo(centerX - R_px, centerY + s.pos2); ctx.stroke();
        ctx.fillStyle = '#ff4081'; ctx.fillRect(centerX - R_px - 15, centerY + s.pos2, 30, 30);
        drawVector(ctx, centerX - R_px, centerY + s.pos2 + 30, m2 * g, '#ff4081', 'm2·g');
      }

      // HUD Readouts
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`α (ANGULAR): ${s.alpha.toFixed(2)} rad/s²`, 20, 30);
      ctx.fillText(`a (LINEAR): ${s.linearA.toFixed(2)} m/s²`, 20, 50);

      // --- GRAPHS ---
      const drawG = (gCtx, gCanvas, key, color, label) => {
        gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.offsetWidth, gCanvas.offsetHeight);
        if (s.history.length > 2) {
          gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
          s.history.forEach((h, i) => {
            const x = (i / 300) * gCanvas.offsetWidth;
            const y = gCanvas.offsetHeight - (h[key] * 10) - 20;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
          }); gCtx.stroke();
          gCtx.fillStyle = color; gCtx.fillText(label, 10, 20);
        }
      };
      drawG(gAlphaCtx, graphAlphaRef.current, 'alpha', '#448aff', 'ANGULAR ACCEL (α)');
      drawG(gLinearCtx, graphLinearRef.current, 'linearA', '#69f0ae', 'LINEAR ACCEL (a)');

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, massDist, simType, radius, pulleyMass, pullingForce, m1, m2]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      
      {/* STICKY SIDEBAR */}
      <aside style={{ 
        width: '340px', 
        background: '#0a0a0a', 
        borderRight: '1px solid #333', 
        padding: '20px', 
        position: 'sticky', 
        top: 0, 
        height: '100vh', 
        overflowY: 'auto' 
      }}>
        <h2 style={{ fontSize: '11px', letterSpacing: '2px', color: '#555', marginBottom: '20px' }}>LAB CONTROLS</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Pulley Radius (m) = {radius}</label>
          <input type="range" min="0.5" max="3" step="0.1" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Pulley Mass (kg) = {pulleyMass}</label>
          <input type="range" min="1" max="20" value={pulleyMass} onChange={(e) => setPulleyMass(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {simType === 'constantForce' ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#888' }}>Pulling Force (N) = {pullingForce}</label>
            <input type="range" min="5" max="100" value={pullingForce} onChange={(e) => setPullingForce(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: '#888' }}>Mass 1 (kg) = {m1}</label>
            <input type="range" min="0.5" max="15" step="0.5" value={m1} onChange={(e) => setM1(Number(e.target.value))} style={{ width: '100%', marginBottom: '10px' }} />
            {simType === 'twoMasses' && (
              <>
                <label style={{ fontSize: '11px', color: '#888' }}>Mass 2 (kg) = {m2}</label>
                <input type="range" min="0.5" max="15" step="0.5" value={m2} onChange={(e) => setM2(Number(e.target.value))} style={{ width: '100%' }} />
              </>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
          <h4 style={{ fontSize: '11px', color: '#448aff', marginBottom: '10px' }}>MASS DISTRIBUTION</h4>
          {Object.keys(inertiaData).map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', padding: '4px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={massDist === key} onChange={() => { setMassDist(key); resetSim(); }} />
              {inertiaData[key].name}
            </label>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '11px', color: '#69f0ae', marginBottom: '10px' }}>SIMULATION TYPE</h4>
          {['constantForce', 'fallingMass', 'twoMasses'].map(type => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', padding: '4px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={simType === type} onChange={() => { setSimType(type); resetSim(); }} />
              {type.toUpperCase().replace('_', ' ')}
            </label>
          ))}
        </div>

        <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#000', marginTop: '20px' }}>{isRunning ? 'PAUSE' : 'START'}</button>
        <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>RESET</button>
      </aside>

      {/* SCROLLABLE MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontSize: '1.4rem' }}>Rotational Inertia Lab</h1>
          <p style={{ color: '#555', fontSize: '12px', margin: '5px 0 0' }}>Advanced Rotational Dynamics & Torque Analysis</p>
        </header>

        <section style={{ height: '520px', border: '1px solid #333', borderRadius: '12px', background: '#000', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ height: '300px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '15px' }}>
            <canvas ref={graphAlphaRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ height: '300px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '15px' }}>
            <canvas ref={graphLinearRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </section>

        <div style={{ height: '100px' }}></div> {/* Bottom Spacing for scrolling */}
      </main>
    </div>
  );
};

export default RotationalInertiaLab;
