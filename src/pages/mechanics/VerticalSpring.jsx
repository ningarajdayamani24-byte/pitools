import React, { useState, useEffect, useRef } from 'react';

const VerticalSpringSHM = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls State
  const [mass, setMass] = useState(2.0);        
  const [springK, setSpringK] = useState(50);   
  const [damping, setDamping] = useState(0.1);  
  const [amplitude, setAmplitude] = useState(80); 
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    y: 0,           // Displacement from dynamic equilibrium
    v: 0,           
    accel: 0,
    history: []     
  });

  // Calculate Equilibrium Position based on physics: mg = ky
  const g_constant = 9.81;
  const pixelsPerMeter = 100; 
  const equilibriumOffset = (mass * g_constant / springK) * pixelsPerMeter;
  const basePosition = 50; // Top attachment point

  const resetSim = () => {
    setIsRunning(false);
    const s = stateRef.current;
    s.y = amplitude; 
    s.v = 0;
    s.history = [];
  };

  const drawVector = (ctx, x, y, magnitude, color, label) => {
    const scale = 2.0; 
    const arrowLen = magnitude * scale;
    if (Math.abs(arrowLen) < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + arrowLen);
    const head = 10;
    const dir = arrowLen > 0 ? 1 : -1;
    ctx.lineTo(x - head, y + arrowLen - head * dir);
    ctx.moveTo(x, y + arrowLen);
    ctx.lineTo(x + head, y + arrowLen - head * dir);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter';
    ctx.fillText(label, x + 15, y + arrowLen);
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
      const dt = 0.1 * animSpeed;
      const currentEqY = basePosition + equilibriumOffset;

      if (isRunning) {
        // Net Force = -ky (displacement from EQ) - bv (damping)
        const forceSpring = -springK * (s.y / pixelsPerMeter); 
        const forceDamping = -damping * (s.v / pixelsPerMeter);
        s.accel = (forceSpring + forceDamping) / mass;
        
        s.v += s.accel * dt * pixelsPerMeter;
        s.y += (s.v / pixelsPerMeter) * dt * pixelsPerMeter;

        s.history.push({ y: s.y, v: s.v });
        if (s.history.length > 400) s.history.shift();
      }

      // --- Draw Simulation ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Grid (Pure Black Background)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      // DYNAMIC EQUILIBRIUM LINE (Moves with m and k)
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(350, currentEqY); ctx.lineTo(650, currentEqY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00e5ff';
      ctx.font = '10px Inter';
      ctx.fillText("DYNAMIC EQUILIBRIUM (mg = kx)", 355, currentEqY - 5);

      // Draw Spring
      const currentMassY = currentEqY + s.y;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(500, basePosition);
      const coils = 25;
      const gap = (currentMassY - basePosition) / coils;
      for (let i = 1; i <= coils; i++) {
        const xSide = 500 + (i % 2 === 0 ? 25 : -25);
        ctx.lineTo(xSide, basePosition + i * gap);
      }
      ctx.stroke();

      // Draw Mass
      ctx.save();
      ctx.fillStyle = 'rgba(68, 138, 255, 0.3)';
      ctx.strokeStyle = '#448aff';
      ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.fillRect(500 - 45, currentMassY, 90, 70);
      ctx.strokeRect(500 - 45, currentMassY, 90, 70);
      ctx.restore();

      // Velocity Vector
      drawVector(ctx, 500 + 60, currentMassY + 35, s.v * 0.5, '#00e5ff', 'V');

      // --- Draw Graph ---
      gCtx.fillStyle = '#000';
      gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222';
      gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();

      const drawLine = (dataKey, color, scale) => {
        if (s.history.length < 2) return;
        gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
        s.history.forEach((point, idx) => {
          const x = (idx / 400) * gCanvas.width;
          const y = (gCanvas.height / 2) - (point[dataKey] * scale);
          if (idx === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      };
      drawLine('y', '#ff5252', 0.6); 
      drawLine('v', '#448aff', 0.4); 

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, springK, mass, damping, animSpeed, equilibriumOffset]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '110px 20px 40px', fontFamily: 'Inter, sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
          Vertical Spring SHM Lab
        </h1>
        <div style={{ height: '3px', width: '100px', background: '#00e5ff', margin: '15px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <canvas ref={canvasRef} width="950" height="550" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
            
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '25px', fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    <span style={{ color: '#ff5252' }}>━ Displacement (y)</span>
                    <span style={{ color: '#448aff' }}>━ Velocity (v)</span>
                </div>
                <canvas ref={graphRef} width="920" height="160" />
            </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '25px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '18px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
              {isRunning ? 'PAUSE' : 'START MOTION'}
          </button>
          <button onClick={resetSim} style={{ width: '100%', padding: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>RESET TO AMPLITUDE</button>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #ff5252', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>SPRING CONSTANT (k): {springK} N/m</label>
            <input type="range" min="20" max="200" value={springK} onChange={(e) => setSpringK(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #448aff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>MASS (m): {mass} kg</label>
            <input type="range" min="1" max="15" step="0.5" value={mass} onChange={(e) => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #00e5ff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>DAMPING (b): {damping}</label>
            <input type="range" min="0" max="3" step="0.1" value={damping} onChange={(e) => setDamping(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #ff9800', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>INITIAL AMPLITUDE (px): {amplitude}</label>
            <input type="range" min="-150" max="150" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9800' }} />
          </div>

          <div style={{ padding: '15px', background: '#0a0a0a' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>TIME SCALE: {animSpeed}x</label>
            <input type="range" min="0.1" max="2.0" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default VerticalSpringSHM;
