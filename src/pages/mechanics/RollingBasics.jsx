import React, { useState, useEffect, useRef } from 'react';

const RollingMotionLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Controls State
  const [radius, setRadius] = useState(60);     // px
  const [velocity, setVelocity] = useState(3.0); // m/s (Linear)
  const [showPointPaths, setShowPointPaths] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    x: 100,
    theta: 0,
    history: [] // To track the Cycloid path
  });

  const resetSim = () => {
    const s = stateRef.current;
    s.x = radius + 20;
    s.theta = 0;
    s.history = [];
    setIsRunning(false);
  };

  const drawVector = (ctx, x, y, magX, magY, color, label) => {
    const scale = 15;
    const endX = x + magX * scale;
    const endY = y + magY * scale;
    if (Math.abs(magX) < 0.5 && Math.abs(magY) < 0.5) return;

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
      const groundY = 350;
      const dt = 0.1 * animSpeed;
      
      // Rolling without slipping: v = R * omega
      const omega = velocity / (radius / 20); 

      if (isRunning) {
        s.x += velocity * 5 * dt;
        s.theta += omega * dt;

        // Path of a point on the rim (Cycloid)
        const pointX = s.x + radius * Math.sin(s.theta);
        const pointY = (groundY - radius) + radius * Math.cos(s.theta);
        s.history.push({ x: pointX, y: pointY });

        if (s.x > canvas.width + radius) s.x = -radius;
        if (s.history.length > 800) s.history.shift();
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Technical Grid
      ctx.strokeStyle = '#111';
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      // Ground Line
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

      // Cycloid Path
      if (showPointPaths && s.history.length > 2) {
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.4)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        s.history.forEach((h, i) => {
          if (i === 0) ctx.moveTo(h.x, h.y); else ctx.lineTo(h.x, h.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const centerY = groundY - radius;

      // Draw Wheel
      ctx.save();
      ctx.translate(s.x, centerY);
      ctx.rotate(s.theta);
      
      // Wheel Rim
      ctx.strokeStyle = '#448aff';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      
      // Spokes
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
      for(let i=0; i<8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, radius); ctx.stroke();
      }
      
      // Reference Point on Rim
      ctx.fillStyle = '#ff5252';
      ctx.beginPath(); ctx.arc(0, radius, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Velocity Vectors at key points
      // 1. Center of Mass Velocity (v_cm)
      drawVector(ctx, s.x, centerY, velocity * 2, 0, '#00e5ff', 'v_cm');
      
      // 2. Top Point Velocity (2 * v_cm)
      drawVector(ctx, s.x - radius * Math.sin(s.theta), centerY - radius * Math.cos(s.theta), velocity * 4, 0, '#69f0ae', 'v_top (2v)');
      
      // 3. Contact Point (Instantaneous Zero)
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText("v=0 (Contact)", s.x - 30, groundY + 15);

      // --- GRAPH ---
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (isRunning) {
        gCtx.fillStyle = '#00e5ff';
        gCtx.font = 'bold 12px monospace';
        gCtx.fillText(`LINEAR VELOCITY: ${velocity.toFixed(2)} m/s`, 20, 30);
        gCtx.fillText(`ANGULAR VELOCITY (ω): ${(velocity/(radius/20)).toFixed(2)} rad/s`, 20, 50);
        gCtx.fillText(`NO-SLIP CONDITION: v = Rω [ACTIVE]`, 20, 70);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, radius, velocity, showPointPaths, animSpeed]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '60px 20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold', margin: 0 }}>Rolling Without Slipping Lab</h1>
        <div style={{ height: '3px', width: '100px', background: '#00e5ff', margin: '10px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', maxWidth: '1450px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <canvas ref={canvasRef} width="1050" height="450" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
            <canvas ref={graphRef} width="1010" height="120" />
          </div>
        </div>

        <aside style={{ 
          background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #333', 
          display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '85vh', overflowY: 'auto' 
        }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
            {isRunning ? 'PAUSE' : 'START ROLLING'}
          </button>
          <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>WHEEL RADIUS (R): {radius}px</label>
            <input type="range" min="30" max="100" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>LINEAR VELOCITY (v): {velocity} m/s</label>
            <input type="range" min="1" max="10" step="0.5" value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>SHOW CYCLOID PATH</label>
            <input type="checkbox" checked={showPointPaths} onChange={(e) => setShowPointPaths(e.target.checked)} style={{ marginTop: '10px' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ANIMATION SPEED: {animSpeed}x</label>
            <input type="range" min="0.1" max="2.0" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RollingMotionLab;
