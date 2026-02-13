import React, { useState, useEffect, useRef } from 'react';

const InclinedRollingLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [shape, setShape] = useState('cylinder'); 
  
  // Controls
  const [angle, setAngle] = useState(30);       
  const [mu, setMu] = useState(0.15); 
  const [radius, setRadius] = useState(50);
  const [v0, setV0] = useState(0); // Initial Velocity
  const [animSpeed, setAnimSpeed] = useState(1.0);

  const stateRef = useRef({
    s: 850,           
    v: 0,             
    omega: 0,         
    theta: 0,         
    history: [],
    rimPath: [],
    comPath: [],
    isSlipping: true
  });

  const shapeFactors = { sphere: 0.4, cylinder: 0.5, ring: 1.0 };

  const resetSim = () => {
    const s = stateRef.current;
    s.s = 850; 
    s.v = v0; // Start with initial velocity
    s.omega = 0; // Rotational velocity usually starts at 0 for a slide
    s.theta = 0;
    s.history = []; s.rimPath = []; s.comPath = []; s.isSlipping = true;
    setIsRunning(false);
  };

  const drawVector = (ctx, x, y, magX, magY, color, label) => {
    const scale = 12;
    const endX = x + magX * scale;
    const endY = y + magY * scale;
    if (Math.abs(magX) < 0.5 && Math.abs(magY) < 0.5) return;
    
    ctx.save();
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowBlur = 12; ctx.shadowColor = color;
    ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
    
    const head = 10; 
    const angleVec = Math.atan2(endY - y, endX - x);
    ctx.beginPath(); ctx.moveTo(endX, endY);
    ctx.lineTo(endX - head * Math.cos(angleVec - Math.PI/6), endY - head * Math.sin(angleVec - Math.PI/6));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - head * Math.cos(angleVec + Math.PI/6), endY - head * Math.sin(angleVec + Math.PI/6));
    ctx.stroke();
    
    ctx.fillStyle = color; ctx.font = 'bold 12px monospace';
    ctx.fillText(label, endX + 8, endY);
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
      const dt = 0.05 * animSpeed;
      const g = 9.81;
      const rad = (angle * Math.PI) / 180;
      const R_m = radius / 50;
      const c = shapeFactors[shape];

      const slopeBottomX = 100;
      const slopeBottomY = canvas.height - 80;
      const maxSlopeLen = 850;

      if (isRunning) {
        const v_slip = s.v - s.omega * R_m;
        const F_g_par = g * Math.sin(rad);
        const F_norm = g * Math.cos(rad);

        if (Math.abs(v_slip) > 0.05) {
          s.isSlipping = true;
          const friction = mu * F_norm;
          const accel = F_g_par - friction;
          const alpha = (friction * R_m) / (c * R_m * R_m);
          s.v += accel * dt;
          s.omega += alpha * dt;
        } else {
          s.isSlipping = false;
          const accel = F_g_par / (1 + c);
          s.v += accel * dt;
          s.omega = s.v / R_m;
        }

        s.s -= s.v * 10 * dt; 
        s.theta -= s.omega * dt;

        if (s.s < 0) { s.s = 0; s.v = 0; setIsRunning(false); }

        const distFromTop = maxSlopeLen - s.s;
        const curX = (slopeBottomX + maxSlopeLen * Math.cos(rad)) - distFromTop * Math.cos(rad) - radius * Math.sin(rad);
        const curY = (slopeBottomY - maxSlopeLen * Math.sin(rad)) + distFromTop * Math.sin(rad) - radius * Math.cos(rad);

        s.comPath.push({x: curX, y: curY});
        s.rimPath.push({ x: curX + radius * Math.sin(s.theta + rad), y: curY + radius * Math.cos(s.theta + rad) });
        s.history.push({ v: s.v, wr: s.omega * R_m });

        if (s.history.length > 500) s.history.shift();
        if (s.rimPath.length > 600) s.rimPath.shift();
      }

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // GRID
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const topX = slopeBottomX + maxSlopeLen * Math.cos(rad);
      const topY = slopeBottomY - maxSlopeLen * Math.sin(rad);
      
      // INCLINE
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(slopeBottomX, slopeBottomY); ctx.lineTo(topX, topY); ctx.lineTo(topX, slopeBottomY); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = '#333'; ctx.stroke();

      // ANGLE HUD
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(topX, topY, 60, Math.PI - rad, Math.PI); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter';
      ctx.fillText(`${angle}°`, topX - 85, topY + 20);

      const distFromTop = maxSlopeLen - s.s;
      const curX = topX - distFromTop * Math.cos(rad) - radius * Math.sin(rad);
      const curY = topY + distFromTop * Math.sin(rad) - radius * Math.cos(rad);

      // PATHS
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'; ctx.beginPath();
      s.comPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();
      ctx.strokeStyle = '#ff5252'; ctx.setLineDash([3, 3]); ctx.beginPath();
      s.rimPath.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke(); ctx.setLineDash([]);

      // VECTORS
      if (isRunning && s.s > 0) {
        drawVector(ctx, curX, curY, 0, g * 4, '#ff5252', 'mg'); 
        drawVector(ctx, curX, curY, -g * Math.cos(rad) * 4 * Math.sin(rad), -g * Math.cos(rad) * 4 * Math.cos(rad), '#fff', 'N'); 
        const fMag = s.isSlipping ? mu * g * Math.cos(rad) : (g * Math.sin(rad) * c) / (1 + c);
        drawVector(ctx, curX + radius * Math.sin(rad), curY + radius * Math.cos(rad), fMag * 5 * Math.cos(rad), -fMag * 5 * Math.sin(rad), '#69f0ae', 'f'); 
      }

      // WHEEL
      ctx.save(); ctx.translate(curX, curY); ctx.rotate(s.theta);
      ctx.strokeStyle = '#448aff'; ctx.lineWidth = (shape === 'ring') ? 8 : 4;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      if (shape !== 'ring') { ctx.fillStyle = 'rgba(68, 138, 255, 0.1)'; ctx.fill(); }
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, radius); ctx.stroke(); }
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(0, radius, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // VELOCITY HUD
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`Linear v: ${s.v.toFixed(2)} m/s`, curX - 40, curY - radius - 20);
      ctx.fillStyle = '#ff5252';
      ctx.fillText(`Rotational ωR: ${(s.omega * R_m).toFixed(2)} m/s`, curX - 40, curY - radius - 5);
      ctx.fillStyle = s.isSlipping ? '#ff5252' : '#69f0ae';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(s.isSlipping ? "STATUS: SLIDING" : "STATUS: ROLLING", curX - 60, curY - radius - 40);

      // GRAPH
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      if (s.history.length > 2) {
        const drawH = (key, color) => {
          gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 3;
          s.history.forEach((h, i) => {
            const x = (i / 500) * gCanvas.width;
            const y = gCanvas.height - (h[key] * 12) - 10;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
          }); gCtx.stroke();
        };
        drawH('v', '#00e5ff'); drawH('wr', '#ff5252');
      }

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, radius, angle, mu, animSpeed, shape, v0]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '4px', margin: 0, fontWeight: 'bold' }}>Inclined Rolling Dashboard</h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', flex: 1, minHeight: 0 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
          <div style={{ minHeight: '480px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width="1100" height="480" style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ minHeight: '280px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', gap: '30px', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
              <span style={{color: '#00e5ff'}}>━ LINEAR v (Translation)</span>
              <span style={{color: '#ff5252'}}>━ ROTATIONAL ωR (Rotation)</span>
            </div>
            <canvas ref={graphRef} width="1000" height="240" style={{ width: '100%' }} />
          </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '25px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['sphere', 'cylinder', 'ring'].map(type => (
              <button key={type} onClick={() => setShape(type)} style={{ padding: '12px', background: shape === type ? '#00e5ff' : '#1a1a1a', color: shape === type ? '#000' : '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '11px' }}>{type.toUpperCase()}</button>
            ))}
          </div>
          
          <button onClick={() => { if(!isRunning) resetSim(); setIsRunning(!isRunning); }} style={{ width: '100%', padding: '18px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#000', fontSize: '14px' }}>
            {isRunning ? 'PAUSE' : 'RELEASE FROM TOP'}
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESET LAB</button>
          
          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>INITIAL VELOCITY ($v_0$): {v0} m/s</label>
            <input type="range" min="0" max="10" step="0.5" value={v0} onChange={(e) => setV0(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>SLOPE ANGLE: {angle}°</label>
            <input type="range" min="10" max="45" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>FRICTION (μ): {mu}</label>
            <input type="range" min="0.01" max="0.6" step="0.01" value={mu} onChange={(e) => setMu(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>RADIUS (R): {radius}px</label>
            <input type="range" min="30" max="80" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default InclinedRollingLab;
