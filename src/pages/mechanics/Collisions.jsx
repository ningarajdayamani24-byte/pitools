import React, { useState, useEffect, useRef } from 'react';

const ProCollisionSim = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Logic State
  const [m1, setM1] = useState(5);
  const [v1, setV1] = useState(4);
  const [m2, setM2] = useState(3);
  const [v2, setV2] = useState(-4);
  const [elasticity, setElasticity] = useState(0.8);
  const [collisionCount, setCollisionCount] = useState(0);

  const stateRef = useRef({
    obj1: { x: 150, y: 120, w: 80, h: 80, m: 5, v: 4, color: 'rgba(255, 82, 82, 0.35)', glow: '#ff5252' },
    obj2: { x: 500, y: 120, w: 80, h: 80, m: 3, v: -4, color: 'rgba(68, 138, 255, 0.35)', glow: '#448aff' },
    energyLoss: 0,
    history: [] 
  });

  useEffect(() => {
    stateRef.current.obj1.m = m1;
    if (!isRunning) stateRef.current.obj1.v = v1;
    stateRef.current.obj2.m = m2;
    if (!isRunning) stateRef.current.obj2.v = v2;
  }, [m1, v1, m2, v2, isRunning]);

  const resetSim = () => {
    setIsRunning(false);
    setCollisionCount(0);
    stateRef.current.obj1.x = 150;
    stateRef.current.obj1.v = v1;
    stateRef.current.obj2.x = 500;
    stateRef.current.obj2.v = v2;
    stateRef.current.energyLoss = 0;
    stateRef.current.history = [];
  };

  const drawVector = (ctx, obj) => {
    const arrowLen = obj.v * 15;
    if (Math.abs(arrowLen) < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = obj.glow;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = obj.glow;
    const startX = obj.x + obj.w / 2;
    const startY = obj.y - 15;
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + arrowLen, startY);
    const head = 8;
    const dir = arrowLen > 0 ? 1 : -1;
    ctx.lineTo(startX + arrowLen - head * dir, startY - head);
    ctx.moveTo(startX + arrowLen, startY);
    ctx.lineTo(startX + arrowLen - head * dir, startY + head);
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const update = () => {
      const { obj1, obj2, history } = stateRef.current;
      
      if (isRunning) {
        const ki = 0.5 * obj1.m * obj1.v**2 + 0.5 * obj2.m * obj2.v**2;
        obj1.x += obj1.v;
        obj2.x += obj2.v;

        if (obj1.x + obj1.w >= obj2.x && obj1.v > obj2.v) {
          const e = elasticity;
          const v1Next = ((obj1.m - e * obj2.m) * obj1.v + (obj2.m + e * obj2.m) * obj2.v) / (obj1.m + obj2.m);
          const v2Next = ((obj1.m + e * obj1.m) * obj1.v + (obj2.m - e * obj1.m) * obj2.v) / (obj1.m + obj2.m);
          obj1.v = v1Next;
          obj2.v = v2Next;
          setCollisionCount(c => c + 1);
          const kf = 0.5 * obj1.m * obj1.v**2 + 0.5 * obj2.m * obj2.v**2;
          stateRef.current.energyLoss += Math.abs(ki - kf);
        }

        if (obj1.x <= 0 || obj1.x + obj1.w >= canvas.width) { obj1.v *= -1; setCollisionCount(c => c + 1); }
        if (obj2.x <= 0 || obj2.x + obj2.w >= canvas.width) { obj2.v *= -1; setCollisionCount(c => c + 1); }

        history.push({ v1: obj1.v, v2: obj2.v, p1: obj1.m * obj1.v, p2: obj2.m * obj2.v });
        if (history.length > 400) history.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // GRID LINES
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.strokeRect(0, 200, canvas.width, 1);
      
      [obj1, obj2].forEach(obj => {
        // Translucent Box
        ctx.save(); ctx.fillStyle = obj.color; ctx.strokeStyle = obj.glow; ctx.lineWidth = 2;
        ctx.shadowBlur = 15; ctx.shadowColor = obj.glow;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h); ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        ctx.restore();
        
        // HUD TERMS IN SIMULATION
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.shadowBlur = 4; ctx.shadowColor = '#000';
        ctx.fillText(`v: ${obj.v.toFixed(2)} m/s`, obj.x, obj.y - 45);
        ctx.fillText(`p: ${(obj.m * obj.v).toFixed(2)} kg·m/s`, obj.x, obj.y - 30);
        ctx.fillText(`m: ${obj.m} kg`, obj.x + obj.w + 5, obj.y + 20);

        drawVector(ctx, obj);
      });

      // --- Draw Graph ---
      gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#111';
      for(let i=0; i<gCanvas.width; i+=40) { gCtx.beginPath(); gCtx.moveTo(i,0); gCtx.lineTo(i, gCanvas.height); gCtx.stroke(); }
      gCtx.strokeStyle = '#333';
      gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      const drawLine = (dataKey, color, isDashed = false) => {
        if (history.length < 2) return;
        gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
        if(isDashed) gCtx.setLineDash([5, 5]); else gCtx.setLineDash([]);
        history.forEach((point, idx) => {
          const x = (idx / 400) * gCanvas.width;
          const y = (gCanvas.height / 2) - (point[dataKey] * 3);
          if (idx === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      };

      drawLine('v1', '#ff5252'); 
      drawLine('v2', '#448aff'); 
      drawLine('p1', '#ff8a80', true); 
      drawLine('p2', '#82b1ff', true); 
      
      gCtx.setLineDash([]); gCtx.font = '10px Arial';
      gCtx.fillStyle = '#ff5252'; gCtx.fillText('v1 (Velocity)', 10, 20);
      gCtx.fillStyle = '#ff8a80'; gCtx.fillText('p1 (Momentum)', 120, 20);
      gCtx.fillStyle = '#448aff'; gCtx.fillText('v2 (Velocity)', 10, 35);
      gCtx.fillStyle = '#82b1ff'; gCtx.fillText('p2 (Momentum)', 120, 35);

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, elasticity, collisionCount]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '120px 20px 40px', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
          Interactive Collision & Momentum Simulation
        </h1>
        <div style={{ height: '2px', width: '80px', background: '#ffffff', margin: '10px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', maxWidth: '1300px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <canvas ref={canvasRef} width="900" height="300" style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px' }} />
          <div style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
             <canvas ref={graphRef} width="880" height="180" />
          </div>
          <div style={{ background: '#111', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', color: '#00e5ff', fontWeight: 'bold', fontSize: '13px', border: '1px solid #222' }}>
             <span>RELATIVE VELOCITY: {Math.abs(stateRef.current.obj1.v - stateRef.current.obj2.v).toFixed(2)} m/s</span>
             <span>COLLISIONS: {collisionCount}</span>
             <span>ENERGY LOSS: {stateRef.current.energyLoss.toFixed(1)} J</span>
          </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
            {isRunning ? 'PAUSE' : 'START SIMULATION'}
          </button>
          <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>RESET LAB</button>

          <div style={{ padding: '15px', background: '#1a1010', borderLeft: '4px solid #ff5252', borderRadius: '4px' }}>
            <h4 style={{ color: '#ff5252', margin: '0 0 15px 0' }}>RED OBJECT</h4>
            <label style={{ display: 'block', fontSize: '12px', color: '#eee', fontWeight: 'bold' }}>MASS: {m1} kg</label>
            <input type="range" min="1" max="100" value={m1} onChange={(e) => setM1(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px', accentColor: '#ff5252' }} />
            <label style={{ display: 'block', fontSize: '12px', color: '#eee', fontWeight: 'bold' }}>INITIAL VELOCITY: {v1} m/s</label>
            <input type="range" min="-15" max="15" value={v1} onChange={(e) => setV1(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#10141a', borderLeft: '4px solid #448aff', borderRadius: '4px' }}>
            <h4 style={{ color: '#448aff', margin: '0 0 15px 0' }}>BLUE OBJECT</h4>
            <label style={{ display: 'block', fontSize: '12px', color: '#eee', fontWeight: 'bold' }}>MASS: {m2} kg</label>
            <input type="range" min="1" max="100" value={m2} onChange={(e) => setM2(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px', accentColor: '#448aff' }} />
            <label style={{ display: 'block', fontSize: '12px', color: '#eee', fontWeight: 'bold' }}>INITIAL VELOCITY: {v2} m/s</label>
            <input type="range" min="-15" max="15" value={v2} onChange={(e) => setV2(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#00e5ff', display: 'block', marginBottom: '5px' }}>ELASTICITY (e): {elasticity}</label>
            <input type="range" min="0" max="1" step="0.1" value={elasticity} onChange={(e) => setElasticity(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ProCollisionSim;
