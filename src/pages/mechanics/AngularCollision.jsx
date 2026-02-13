import React, { useState, useEffect, useRef } from 'react';

const RotatingPlatformLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls
  const [personMass, setPersonMass] = useState(70); 
  const [initialOmega, setInitialOmega] = useState(2.0);
  const [armPosition, setArmPosition] = useState(0.8); // r in meters

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
    
    // Initial Physics Setup
    const I_platform = 25; 
    const I_person = personMass * Math.pow(armPosition, 2);
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
        // Dynamic Inertia Change: L = I * ω
        const I_total = 25 + (personMass * Math.pow(armPosition, 2));
        s.omega = s.L_const / I_total;
        s.theta += s.omega * dt;

        s.history.push(s.omega);
        if (s.history.length > 400) s.history.shift();
      }

      // --- CLEAR AND DRAW GRID ---
      ctx.fillStyle = '#000'; 
      ctx.fillRect(0, 0, width, height);
      
      // High-Visibility Grid
      ctx.strokeStyle = '#222'; 
      ctx.lineWidth = 1;
      for(let i=0; i<width; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for(let j=0; j<height; j+=50) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      // --- LABELS & TERMS (Simulation Area) ---
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`MOMENTUM (L): ${s.L_const.toFixed(2)} kg·m²/s`, 20, 30);
      ctx.fillText(`INERTIA (I): ${(25 + personMass * armPosition**2).toFixed(2)} kg·m²`, 20, 50);
      ctx.fillText(`RADIUS (r): ${armPosition.toFixed(2)} m`, 20, 70);
      
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`ANGULAR VELOCITY (ω): ${s.omega.toFixed(2)} rad/s`, 20, 100);

      // --- PLATFORM & VECTORS ---
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(s.theta);
      
      // Platform Blue Disk
      ctx.strokeStyle = '#448aff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI * 2); ctx.stroke();
      
      // Person (Center)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
      
      // Arms (Red Lines)
      const rPx = armPosition * 180; 
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-rPx, 0); ctx.lineTo(rPx, 0); ctx.stroke();
      
      // Tangential Velocity Vectors (Green Arrows)
      if (isRunning) {
        const vLen = s.omega * armPosition * 25;
        ctx.strokeStyle = '#00e676'; ctx.lineWidth = 3;
        // Right Vector
        ctx.beginPath(); ctx.moveTo(rPx, 0); ctx.lineTo(rPx, -vLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rPx-5, -vLen+10); ctx.lineTo(rPx, -vLen); ctx.lineTo(rPx+5, -vLen+10); ctx.stroke();
        ctx.fillStyle = '#00e676'; ctx.fillText("v_t (Tangent)", rPx + 10, -vLen);
      }
      ctx.restore();

      // --- GRAPH DRAWING (Labeled) ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#333'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height-40); gCtx.lineTo(gCanvas.width, gCanvas.height-40); gCtx.stroke();
      
      gCtx.fillStyle = '#69f0ae'; gCtx.font = '10px monospace';
      gCtx.fillText("Y: ANGULAR VELOCITY (ω)", 10, 20);
      gCtx.fillText("X: TIME (s)", gCanvas.width - 80, gCanvas.height - 10);

      if (s.history.length > 2) {
        gCtx.beginPath(); gCtx.strokeStyle = '#448aff'; gCtx.lineWidth = 3;
        s.history.forEach((h, i) => {
          const x = (i / 400) * gCanvas.width;
          const y = (gCanvas.height - 40) - (h * 40);
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
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      
      <aside style={{ width: '320px', background: '#0a0a0a', padding: '25px', borderRight: '1px solid #333' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '30px' }}>LAB CONTROLS</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Starting Speed: {initialOmega} rad/s</label>
          <input type="range" min="0.5" max="5" step="0.1" value={initialOmega} onChange={(e) => setInitialOmega(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontSize: '11px', color: '#fff' }}>Change Radius (r): {armPosition.toFixed(2)} m</label>
          <input type="range" min="0.1" max="0.9" step="0.01" value={armPosition} onChange={(e) => setArmPosition(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <button onClick={resetSim} style={{ width: '100%', padding: '15px', background: '#00e676', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#000', borderRadius: '4px' }}>START SPIN</button>
        <button onClick={() => setIsRunning(false)} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', marginTop: '10px', borderRadius: '4px' }}>STOP</button>
      </aside>

      <main style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {/* SIMULATION CANVAS */}
        <div style={{ width: '900px', height: '500px', border: '1px solid #333', background: '#000' }}>
          <canvas ref={canvasRef} width="900" height="500" />
        </div>
        
        {/* GRAPH CANVAS */}
        <div style={{ width: '900px', height: '280px', border: '1px solid #333', background: '#000' }}>
          <canvas ref={graphRef} width="900" height="280" />
        </div>
      </main>

    </div>
  );
};

export default RotatingPlatformLab;
