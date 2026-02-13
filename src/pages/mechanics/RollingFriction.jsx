import React, { useState, useEffect, useRef } from 'react';

const RollingLabFinal = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [shape, setShape] = useState('cylinder'); 
  
  // Controls
  const [radius, setRadius] = useState(60);     
  const [initVel, setInitVel] = useState(10.0); 
  const [mu, setMu] = useState(0.12); 
  const [mass, setMass] = useState(5);
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    x: 100, theta: 0, v: 10.0, omega: 0,
    history: [], rimPath: [], comPath: [], isSlipping: true
  });

  const shapeFactors = { sphere: 0.4, cylinder: 0.5, ring: 1.0 };

  const resetSim = () => {
    const s = stateRef.current;
    s.x = radius + 20;
    s.theta = 0; s.v = initVel; s.omega = 0; 
    s.isSlipping = true; s.history = []; s.rimPath = []; s.comPath = [];
    setIsRunning(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const groundY = 380;
      const dt = 0.05 * animSpeed;
      const g = 9.81;
      const R_m = radius / 50; 

      if (isRunning) {
        const v_slip = s.v - s.omega * R_m;
        if (Math.abs(v_slip) > 0.05) {
          s.isSlipping = true;
          const friction = mu * mass * g;
          const accel = -friction / mass;
          const alpha = (friction * R_m) / (shapeFactors[shape] * mass * R_m * R_m);
          s.v += accel * dt;
          s.omega += alpha * dt;
        } else {
          s.isSlipping = false;
          s.v -= 0.005; 
          s.omega = s.v / R_m;
        }

        s.x += s.v * 10 * dt;
        s.theta += s.omega * dt;

        s.rimPath.push({ x: s.x + radius * Math.sin(s.theta), y: (groundY - radius) + radius * Math.cos(s.theta) });
        s.comPath.push({ x: s.x, y: groundY - radius });
        s.history.push({ v: s.v, wr: s.omega * R_m });

        if (s.x > canvas.width + radius) s.x = -radius;
        if (s.rimPath.length > 800) s.rimPath.shift();
        if (s.comPath.length > 800) s.comPath.shift();
        if (s.history.length > 500) s.history.shift();
      }

      // --- SIMULATION RENDER (WITH GRID) ---
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Technical Grid Lines
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

      // Paths
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'; ctx.beginPath();
      s.comPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();

      ctx.strokeStyle = '#ff5252'; ctx.setLineDash([2, 3]); ctx.beginPath();
      s.rimPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke(); ctx.setLineDash([]);

      const centerY = groundY - radius;
      ctx.save(); ctx.translate(s.x, centerY); ctx.rotate(s.theta);
      ctx.strokeStyle = '#448aff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#222'; for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, radius); ctx.stroke(); }
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(0, radius, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // HUD LABELS (Simulation Terms)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
      ctx.fillText(`TRANS. VEL (v): ${s.v.toFixed(2)} m/s`, s.x - 40, centerY - radius - 30);
      ctx.fillText(`ROT. VEL (ωR): ${(s.omega * R_m).toFixed(2)} m/s`, s.x - 40, centerY - radius - 15);
      ctx.fillStyle = s.isSlipping ? '#ff5252' : '#69f0ae';
      ctx.fillText(s.isSlipping ? "STATUS: SLIDING/SKIDDING" : "STATUS: PURE ROLLING", s.x - 65, centerY + radius + 25);

      // --- GRAPH RENDER (With Labels) ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (s.history.length > 2) {
        const drawH = (key, color) => {
          gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
          s.history.forEach((h, i) => {
            const x = (i / 500) * gCanvas.width;
            const y = gCanvas.height - (h[key] * 18) - 20;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
          }); gCtx.stroke();
        };
        drawH('v', '#00e5ff'); drawH('wr', '#ff5252');
        
        gCtx.fillStyle = '#fff'; gCtx.font = '10px monospace';
        gCtx.fillText("LINEAR VELOCITY (v)", 10, 20);
        gCtx.fillText("ANGULAR VELOCITY (ωR)", 10, 35);
      }

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, radius, initVel, mu, mass, animSpeed, shape]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '4px', margin: 0 }}>Advanced Rolling Dynamics Lab</h1>
        <div style={{ height: '3px', width: '120px', background: '#00e5ff', margin: '15px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', maxWidth: '1500px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <section>
            <h3 style={{ color: '#888', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>Physical Simulation Environment</h3>
            <canvas ref={canvasRef} width="1100" height="450" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px', width: '100%' }} />
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <h3 style={{ color: '#888', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>Velocity Variation Analysis</h3>
               <div style={{ display: 'flex', gap: '25px', fontSize: '11px', fontWeight: 'bold' }}>
                  <span style={{color: '#00e5ff'}}>━ LINEAR v</span>
                  <span style={{color: '#ff5252'}}>━ RIM ωR</span>
               </div>
            </div>
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '25px' }}>
               <canvas ref={graphRef} width="1050" height="350" style={{ width: '100%' }} />
            </div>
          </section>

          <div style={{ height: '50px' }}></div>
        </div>

        <aside style={{ 
            background: '#0a0a0a', padding: '25px', borderRadius: '8px', border: '1px solid #333', 
            display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '20px', height: 'fit-content' 
        }}>
          <h3 style={{ fontSize: '13px', margin: '0', color: '#888', textTransform: 'uppercase' }}>Lab Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['sphere', 'cylinder', 'ring'].map(type => (
              <button key={type} onClick={() => setShape(type)} style={{ padding: '12px', background: shape === type ? '#00e5ff' : '#1a1a1a', color: shape === type ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', fontSize: '11px' }}>{type}</button>
            ))}
          </div>

          <button onClick={() => { if(!isRunning) resetSim(); setIsRunning(!isRunning); }} style={{ width: '100%', padding: '18px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000', fontSize: '14px' }}>
            {isRunning ? 'PAUSE' : 'LAUNCH'}
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET LAB</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', display: 'block', marginBottom: '10px' }}>FRICTION (μ): {mu}</label>
            <input type="range" min="0.01" max="0.5" step="0.01" value={mu} onChange={(e) => setMu(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', display: 'block', marginBottom: '10px' }}>INITIAL v: {initVel} m/s</label>
            <input type="range" min="2" max="18" step="0.5" value={initVel} onChange={(e) => setInitVel(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default RollingLabFinal;
