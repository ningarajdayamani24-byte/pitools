import React, { useState, useEffect, useRef } from 'react';

const HorizontalDroppingMass = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  
  // Simulation Controls
  const [massBase, setMassBase] = useState(2.0);    
  const [massDropped, setMassDropped] = useState(1.0); 
  const [springK, setSpringK] = useState(40);       
  const [amplitude, setAmplitude] = useState(150); 
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    x: 150,           // Displacement from Equilibrium
    v: 0,           
    accel: 0,
    currentMass: 2.0,
    fallingMassY: 50,
    isFalling: false,
    history: []     
  });

  const pixelsPerMeter = 100;
  const pivotX = 50; 
  const centerY = 200; 
  const equilibriumX = 400; 

  const resetSim = () => {
    setIsRunning(false);
    setIsDropped(false);
    const s = stateRef.current;
    s.x = amplitude; 
    s.v = 0;
    s.currentMass = massBase;
    s.fallingMassY = 50;
    s.isFalling = false;
    s.history = [];
  };

  const triggerDrop = () => {
    if (!isRunning || isDropped) return;
    stateRef.current.isFalling = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.08 * animSpeed;

      if (isRunning) {
        // Horizontal SHM Physics: F = -kx
        const forceSpring = -springK * (s.x / pixelsPerMeter); 
        s.accel = forceSpring / s.currentMass;
        s.v += s.accel * dt * pixelsPerMeter;
        s.x += (s.v / pixelsPerMeter) * dt * pixelsPerMeter;

        if (s.isFalling && !isDropped) {
          s.fallingMassY += 12 * animSpeed;
          if (s.fallingMassY >= centerY - 40) {
            const m1 = s.currentMass;
            const m2 = massDropped;
            s.v = (m1 * s.v) / (m1 + m2); // Momentum conservation
            s.currentMass = m1 + m2;
            setIsDropped(true);
            s.isFalling = false;
          }
        }
        s.history.push({ x: s.x, v: s.v });
        if (s.history.length > 500) s.history.shift();
      }

      // 1. SIMULATION RENDER
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Grid
      ctx.strokeStyle = '#151515'; 
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      // EQ Line
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = '#00e5ff';
      ctx.beginPath(); ctx.moveTo(equilibriumX, centerY - 80); ctx.lineTo(equilibriumX, centerY + 80); ctx.stroke();
      ctx.setLineDash([]);

      const currentMassX = equilibriumX + s.x;
      
      // Spring
      ctx.strokeStyle = '#444'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pivotX, centerY);
      const coils = 25;
      const w = (currentMassX - pivotX) / coils;
      for (let i = 1; i <= coils; i++) {
        ctx.lineTo(pivotX + i * w, centerY + (i % 2 === 0 ? 25 : -25));
      }
      ctx.stroke();

      // Translucent Mass Box
      ctx.save();
      ctx.fillStyle = isDropped ? 'rgba(255, 152, 0, 0.3)' : 'rgba(68, 138, 255, 0.2)';
      ctx.strokeStyle = isDropped ? '#ff9800' : '#448aff';
      ctx.shadowBlur = 15; ctx.shadowColor = ctx.strokeStyle;
      ctx.fillRect(currentMassX - 40, centerY - 40, 80, 80);
      ctx.strokeRect(currentMassX - 40, centerY - 40, 80, 80);
      ctx.restore();

      // HUD Labels inside Simulation
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`Mass: ${s.currentMass.toFixed(1)}kg`, currentMassX - 35, centerY + 55);
      ctx.fillText(`x: ${s.x.toFixed(1)}`, currentMassX - 35, centerY - 45);

      if (s.isFalling && !isDropped) {
        ctx.fillStyle = 'rgba(255, 152, 0, 0.8)';
        ctx.fillRect(currentMassX - 25, s.fallingMassY, 50, 40);
        ctx.fillText("m2 (Dropped)", currentMassX - 25, s.fallingMassY - 5);
      }

      // 2. GRAPH RENDER (Showing Variations)
      gCtx.fillStyle = '#000';
      gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222';
      gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (s.history.length > 2) {
        // Displacement Curve (Red)
        gCtx.beginPath(); gCtx.strokeStyle = '#ff5252'; gCtx.lineWidth = 2;
        s.history.forEach((p, idx) => {
          const xPos = (idx / 500) * gCanvas.width;
          const yPos = (gCanvas.height/2) - (p.x * 0.4);
          if (idx === 0) gCtx.moveTo(xPos, yPos); else gCtx.lineTo(xPos, yPos);
        });
        gCtx.stroke();

        // Velocity Curve (Blue)
        gCtx.beginPath(); gCtx.strokeStyle = '#448aff'; gCtx.lineWidth = 1.5;
        s.history.forEach((p, idx) => {
          const xPos = (idx / 500) * gCanvas.width;
          const yPos = (gCanvas.height/2) - (p.v * 0.3);
          if (idx === 0) gCtx.moveTo(xPos, yPos); else gCtx.lineTo(xPos, yPos);
        });
        gCtx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, isDropped, springK, massBase, massDropped, animSpeed]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '100px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px' }}>Horizontal SHM Variation Lab</h1>
        <div style={{ height: '3px', width: '100px', background: '#00e5ff', margin: '15px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <canvas ref={canvasRef} width="950" height="400" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
            
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                    <span style={{ color: '#ff5252', fontSize: '11px', fontWeight: 'bold' }}>━ DISPLACEMENT VARIATION (x)</span>
                    <span style={{ color: '#448aff', fontSize: '11px', fontWeight: 'bold' }}>━ VELOCITY VARIATION (v)</span>
                </div>
                <canvas ref={graphRef} width="920" height="150" />
            </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '25px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '18px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
              {isRunning ? 'PAUSE' : 'START MOTION'}
          </button>

          <button onClick={triggerDrop} disabled={!isRunning || isDropped} style={{ width: '100%', padding: '15px', background: (!isRunning || isDropped) ? '#222' : '#ff9800', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
              DROP MASS ON TOP
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET LAB</button>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #448aff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>SLIDING MASS (m1)</label>
            <input type="range" min="1" max="10" step="0.5" value={massBase} onChange={(e) => setMassBase(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #ff9800', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>DROPPED MASS (m2)</label>
            <input type="range" min="0.5" max="5" step="0.5" value={massDropped} onChange={(e) => setMassDropped(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff9800' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #00e5ff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>SPRING CONSTANT (k)</label>
            <input type="range" min="10" max="100" value={springK} onChange={(e) => setSpringK(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
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

export default HorizontalDroppingMass;
