import React, { useState, useEffect, useRef } from 'react';

const ConicalPendulum = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls State
  const [mass, setMass] = useState(2.0);        
  const [length, setLength] = useState(300);    
  const [angleDeg, setAngleDeg] = useState(30); 
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    rotation: 0,
    history: [] 
  });

  const resetSim = () => {
    const s = stateRef.current;
    s.rotation = 0;
    s.history = [];
    setIsRunning(false);
  };

  const drawVector = (ctx, x, y, magX, magY, color, label) => {
    const scale = 0.5;
    const endX = x + magX * scale;
    const endY = y + magY * scale;
    if (Math.abs(magX) < 1 && Math.abs(magY) < 1) return;

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
    ctx.font = 'bold 11px monospace';
    ctx.fillText(label, endX + 5, endY + 5);
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
      const pivotX = 500;
      const pivotY = 50;
      
      const theta = (angleDeg * Math.PI) / 180;
      const g = 9.81;
      const angularVel = Math.sqrt(g / ((length / 100) * Math.cos(theta)));
      const radius = length * Math.sin(theta);
      const h = length * Math.cos(theta);

      if (isRunning) {
        s.rotation += angularVel * 0.05 * animSpeed;
        const vx = -Math.sin(s.rotation) * radius * angularVel;
        s.history.push({ x: Math.cos(s.rotation) * radius, v: vx });
        if (s.history.length > 500) s.history.shift();
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Grid
      ctx.strokeStyle = '#111';
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const bobX = pivotX + Math.cos(s.rotation) * radius;
      const bobY = pivotY + h + Math.sin(s.rotation) * (radius * 0.25);

      // Angle Arc
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 40, Math.PI/2, Math.PI/2 + theta);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(`${angleDeg}°`, pivotX + 5, pivotY + 60);

      // Orbit Path
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#222';
      ctx.beginPath(); ctx.ellipse(pivotX, pivotY + h, radius, radius * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // String
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();
      
      // Bob
      ctx.save();
      ctx.fillStyle = 'rgba(68, 138, 255, 0.3)'; ctx.strokeStyle = '#448aff'; ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.beginPath(); ctx.arc(bobX, bobY, 15 + mass * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();

      // VECTORS (FBD)
      if (isRunning) {
          // Gravity (mg) - RED
          drawVector(ctx, bobX, bobY, 0, mass * g * 10, '#ff5252', 'mg');
          // Tension (T) - WHITE
          drawVector(ctx, bobX, bobY, (pivotX - bobX) * 0.5, (pivotY - bobY) * 0.5, '#ffffff', 'T');
          // Centripetal Force (Fc) - GREEN
          drawVector(ctx, bobX, bobY, (pivotX - bobX) * 0.4, 0, '#69f0ae', 'Fc');
      }

      // --- GRAPH ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (s.history.length > 2) {
        gCtx.beginPath(); gCtx.strokeStyle = '#ff5252'; gCtx.lineWidth = 2;
        s.history.forEach((h, i) => {
          const x = (i / 500) * gCanvas.width;
          const y = (gCanvas.height/2) - h.x * 0.5;
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();

        gCtx.beginPath(); gCtx.strokeStyle = '#00e5ff'; gCtx.lineWidth = 1.5;
        s.history.forEach((h, i) => {
          const x = (i / 500) * gCanvas.width;
          const y = (gCanvas.height/2) - h.v * 0.3;
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, length, angleDeg, mass, animSpeed]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '60px 20px', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold', margin: 0 }}>Conical Pendulum Lab</h1>
        <div style={{ height: '3px', width: '100px', background: '#00e5ff', margin: '10px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', maxWidth: '1450px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <canvas ref={canvasRef} width="1050" height="450" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', gap: '25px', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}>
              <span style={{ color: '#ff5252' }}>━ X-POSITION (m)</span>
              <span style={{ color: '#00e5ff' }}>━ X-VELOCITY (m/s)</span>
            </div>
            <canvas ref={graphRef} width="1010" height="220" />
          </div>
        </div>

        {/* SIDEBAR FIXED FOR OVERFLOW */}
        <aside style={{ 
          background: '#0a0a0a', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #333', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px', 
          maxHeight: '85vh', 
          overflowY: 'auto',
          position: 'sticky',
          top: '20px'
        }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
            {isRunning ? 'PAUSE' : 'START MOTION'}
          </button>
          <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252', borderRadius: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>MASS (m): {mass}kg</label>
            <input type="range" min="1" max="10" step="0.5" value={mass} onChange={(e) => setMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff', borderRadius: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ANGLE (θ): {angleDeg}°</label>
            <input type="range" min="10" max="70" value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff', borderRadius: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>LENGTH (L): {length}px</label>
            <input type="range" min="200" max="400" value={length} onChange={(e) => setLength(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff', borderRadius: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ANIMATION SPEED: {animSpeed}x</label>
            <input type="range" min="0.1" max="2.0" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ConicalPendulum;
