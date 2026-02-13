import React, { useState, useEffect, useRef } from 'react';

const RotatingPlatformLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls
  const [personMass, setPersonMass] = useState(70); 
  const [initialOmega, setInitialOmega] = useState(2.0);
  const [armPosition, setArmPosition] = useState(0.8); // Distance of weights from center (meters)

  const stateRef = useRef({
    omega: 2.0,
    theta: 0,
    history: [],
    L_const: 0
  });

  const resetSim = () => {
    const s = stateRef.current;
    s.theta = 0;
    s.omega = initialOmega;
    s.history = [];
    
    // Calculate constant Angular Momentum: L = I * omega
    // I_total = I_platform + I_person
    const I_platform = 20; // Constant inertia of the base
    const I_person = personMass * (armPosition * armPosition);
    s.L_const = (I_platform + I_person) * initialOmega;
    
    setIsRunning(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    if (!canvas || !gCanvas) return;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.04;
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;

      if (isRunning) {
        // Physics: I is dynamic based on armPosition slider
        const I_platform = 20;
        const I_person = personMass * (armPosition * armPosition);
        const I_total = I_platform + I_person;
        
        // omega = L / I (L is conserved)
        s.omega = s.L_const / I_total;
        s.theta += s.omega * dt;

        s.history.push(s.omega);
        if (s.history.length > 400) s.history.shift();
      }

      // --- SIMULATION ---
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      
      // GRID
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, height); ctx.stroke(); }

      // HUD TERMS
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(10, 10, 280, 120);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`L (CONSERVED MOMENTUM): ${s.L_const.toFixed(2)} kg·m²/s`, 20, 30);
      ctx.fillText(`I (DYNAMIC INERTIA): ${(20 + personMass * armPosition**2).toFixed(2)} kg·m²`, 20, 55);
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`ω (ANGULAR VELOCITY): ${s.omega.toFixed(2)} rad/s`, 20, 85);

      // PLATFORM
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(s.theta);
      
      // The Disk
      ctx.strokeStyle = '#448aff'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
      
      // Person (Center)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      
      // Arms/Weights (Dynamic Position)
      const armLengthPx = armPosition * 150; 
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-armLengthPx, 0); ctx.lineTo(armLengthPx, 0); ctx.stroke();
      
      // Hand Weights (m_person influence)
      ctx.fillStyle = '#ff5252';
      ctx.beginPath(); ctx.arc(-armLengthPx, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(armLengthPx, 0, 10, 0, Math.PI * 2); ctx.fill();
      
      // Velocity Vectors
      if (isRunning) {
        ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        const v_mag = s.omega * armPosition * 20;
        ctx.beginPath(); ctx.moveTo(armLengthPx, 0); ctx.lineTo(armLengthPx, -v_mag); ctx.stroke();
        ctx.fillStyle = '#00e676'; ctx.fillText("v Vector", armLengthPx + 5, -v_mag);
      }
      ctx.restore();

      // --- GRAPH ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height-20); gCtx.lineTo(gCanvas.width, gCanvas.height-20); gCtx.stroke();
      gCtx.fillStyle = '#69f0ae'; gCtx.fillText("ω (ANGULAR VELOCITY) vs TIME", 10, 20);

      if (s.history.length > 2) {
        gCtx.beginPath(); gCtx.strokeStyle = '#448aff'; gCtx.lineWidth = 3;
        s.history.forEach((h, i) => {
          const x = (i / 400) * gCanvas.width;
          const y = (gCanvas.height - 20) - (h * 40);
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, personMass, initialOmega, armPosition]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex' }}>
      
      <aside style={{ width: '320px', background: '#0a0a0a', padding: '25px', borderRight: '2px solid #222', height: '100vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '30px' }}>PLATFORM LAB</h2>
        
        <div style={{ padding: '15px', background: '#111', borderRadius: '4px', borderLeft: '4px solid #448aff', marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Initial Spin (ω₀): {initialOmega} rad/s</label>
          <input type="range" min="0.5" max="5" step="0.1" value={initialOmega} onChange={(e) => setInitialOmega(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ padding: '15px', background: '#111', borderRadius: '4px', borderLeft: '4px solid #ff5252', marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>ARM POSITION (r): {armPosition} m</label>
          <p style={{ fontSize: '10px', color: '#666', margin: '5px 0' }}>Move slider while spinning to change ω!</p>
          <input type="range" min="0.1" max="1.0" step="0.01" value={armPosition} onChange={(e) => setArmPosition(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <button onClick={resetSim} style={{ width: '100%', padding: '15px', background: '#00e676', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', color: '#000' }}>START SPINNING</button>
        <button onClick={() => setIsRunning(false)} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', marginTop: '10px' }}>STOP</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '5px', fontSize: '1.4rem' }}>Angular Momentum Conservation</h1>
          <p style={{ color: '#555', fontSize: '12px' }}>$I_1 \omega_1 = I_2 \omega_2$ | The Ice Skater Effect</p>
        </header>

        <section style={{ height: '520px', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          <canvas ref={canvasRef} width="950" height="520" style={{ width: '100%', height: '100%' }} />
        </section>

        <section style={{ height: '300px', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          <canvas ref={graphRef} width="950" height="300" style={{ width: '100%', height: '100%' }} />
        </section>
      </main>

    </div>
  );
};

export default RotatingPlatformLab;
