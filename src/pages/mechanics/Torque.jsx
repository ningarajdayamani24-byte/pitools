import React, { useState, useEffect, useRef } from 'react';

const RotationalDynamicsLab = () => {
  const canvasRef = useRef(null);
  const graphAlphaRef = useRef(null);
  const graphLinearRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [shape, setShape] = useState('disc'); 
  
  // Controls
  const [appliedForce, setAppliedForce] = useState(15.0); 
  const [mass, setMass] = useState(2.0);                
  const [radius, setRadius] = useState(130);            

  const stateRef = useRef({
    omega: 0, theta: 0, alpha: 0, linearA: 0, history: []
  });

  const shapeData = {
    sphere: { name: "Solid Sphere", beta: 0.4, color: "#ff5252", formula: "I = 2/5 MR²" },
    disc: { name: "Solid Disc", beta: 0.5, color: "#448aff", formula: "I = 1/2 MR²" },
    ring: { name: "Thin Ring", beta: 1.0, color: "#00e5ff", formula: "I = MR²" }
  };

  const resetSim = () => {
    const s = stateRef.current;
    s.omega = 0; s.theta = 0; s.alpha = 0; s.linearA = 0; s.history = [];
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

  const drawVector = (ctx, x, y, angle, mag, color, label) => {
    if (mag < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(mag, 0);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(mag, 0);
    ctx.lineTo(mag - 10, -5);
    ctx.lineTo(mag - 10, 5);
    ctx.fill();
    // Label
    ctx.font = 'bold 12px monospace';
    ctx.fillText(label, mag / 2, -10);
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
      const width = canvasRef.current.offsetWidth;
      const height = canvasRef.current.offsetHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const R_m = radius / 100;
      const beta = shapeData[shape].beta;

      if (isRunning) {
        const torque = R_m * appliedForce;
        const I = beta * mass * (R_m * R_m);
        s.alpha = torque / I;
        s.linearA = s.alpha * R_m;
        
        s.omega += s.alpha * dt;
        s.theta += s.omega * dt;

        s.history.push({ alpha: s.alpha, linearA: s.linearA });
        if (s.history.length > 300) s.history.shift();
      }

      // --- SIMULATION RENDER ---
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, height); ctx.stroke(); }
      for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width, i); ctx.stroke(); }

      // Axis / Pivot Point
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(centerX, centerY, 6, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(s.theta);
      
      // Rotor
      ctx.strokeStyle = shapeData[shape].color;
      ctx.lineWidth = shape === 'ring' ? 8 : 4;
      ctx.shadowBlur = 15; ctx.shadowColor = shapeData[shape].color;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      
      // Reference Point
      ctx.fillStyle = '#ff5252'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(radius, 0, 8, 0, Math.PI * 2); ctx.fill();
      
      // Velocity Vector at Rim (v = omega * R)
      if (isRunning) {
        drawVector(ctx, radius, 0, Math.PI/2, s.omega * 5, '#69f0ae', `v_t`);
      }
      ctx.restore();

      // Force Vector (F_applied)
      const arrowX = centerX + radius;
      drawVector(ctx, arrowX, centerY, Math.PI/2, appliedForce * 3, '#ff5252', 'F_ext');

      // HUD TERMS
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`GEOMETRY: ${shapeData[shape].name}`, 20, 30);
      ctx.fillText(`INERTIA: ${shapeData[shape].formula}`, 20, 50);
      ctx.fillStyle = '#448aff';
      ctx.fillText(`ANGULAR α: ${s.alpha.toFixed(2)} rad/s²`, 20, 80);
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`LINEAR a_t: ${s.linearA.toFixed(2)} m/s²`, 20, 100);
      ctx.fillStyle = '#fff';
      ctx.fillText(`ANGULAR ω: ${s.omega.toFixed(2)} rad/s`, 20, 120);

      // --- GRAPHS ---
      const drawGraph = (gCtx, gCanvas, dataKey, color, label) => {
        gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.offsetWidth, gCanvas.offsetHeight);
        if (s.history.length > 2) {
          gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
          s.history.forEach((h, i) => {
            const x = (i / 300) * gCanvas.offsetWidth;
            const y = gCanvas.offsetHeight - (h[dataKey] * 10) - 20;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
          });
          gCtx.stroke();
          gCtx.fillStyle = color; gCtx.font = '10px monospace';
          gCtx.fillText(label, 10, 20);
        }
      };

      drawGraph(gAlphaCtx, graphAlphaRef.current, 'alpha', '#448aff', 'α (rad/s²)');
      drawGraph(gLinearCtx, graphLinearRef.current, 'linearA', '#69f0ae', 'a_t (m/s²)');

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, shape, appliedForce, mass, radius]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', fontFamily: 'monospace' }}>
      
      <aside style={{ width: '300px', background: '#0a0a0a', borderRight: '1px solid #333', padding: '20px', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '20px' }}>LAB CONTROLS</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {Object.keys(shapeData).map(key => (
            <button key={key} onClick={() => { setShape(key); resetSim(); }} style={{ padding: '10px', background: shape === key ? shapeData[key].color : '#111', color: shape === key ? '#000' : '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{shapeData[key].name.toUpperCase()}</button>
          ))}
        </div>

        <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#000', marginBottom: '10px' }}>{isRunning ? 'STOP' : 'START'}</button>
        <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>RESET</button>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>APPLIED FORCE (F): {appliedForce} N</label>
          <input type="range" min="1" max="50" value={appliedForce} onChange={(e) => setAppliedForce(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>MASS (M): {mass} kg</label>
          <input type="range" min="0.5" max="10" step="0.5" value={mass} onChange={(e) => setMass(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>RADIUS (R): {radius} px</label>
          <input type="range" min="60" max="180" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </aside>

      <main style={{ marginLeft: '300px', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <section>
          <div style={{ height: '500px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ height: '250px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
            <canvas ref={graphAlphaRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ height: '250px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
            <canvas ref={graphLinearRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </section>
        <div style={{ height: '50px' }}></div>
      </main>
    </div>
  );
};

export default RotationalDynamicsLab;
