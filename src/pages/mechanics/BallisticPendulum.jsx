import React, { useState, useEffect, useRef } from 'react';

const BallisticPendulum = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFired, setIsFired] = useState(false);
  
  // Controls State
  const [bulletMass, setBulletMass] = useState(0.05); 
  const [bulletVel, setBulletVel] = useState(250);   
  const [blockMass, setBlockMass] = useState(2.0);    
  const [stringLength, setStringLength] = useState(280); 
  const [animSpeed, setAnimSpeed] = useState(1.0); 

  const stateRef = useRef({
    bullet: { x: 50, y: 0, r: 6, v: 250, m: 0.05, glow: '#ff5252' },
    block: { x: 450, y: 0, w: 75, h: 75, m: 2.0, angle: 0, vAngle: 0, glow: '#448aff' },
    maxAngle: 0,
    isStuck: false
  });

  const pivotX = 450;
  const pivotY = 50;

  // Sync state with sliders
  useEffect(() => {
    const s = stateRef.current;
    const initialY = pivotY + stringLength;
    s.bullet.y = initialY + 37.5; 
    s.block.y = initialY;
    
    if (!isRunning) {
        s.bullet.v = bulletVel;
        s.bullet.m = bulletMass;
        s.block.m = blockMass;
    }
  }, [stringLength, bulletVel, bulletMass, blockMass, isRunning]);

  const resetSim = () => {
    setIsRunning(false);
    setIsFired(false);
    const s = stateRef.current;
    const initialY = pivotY + stringLength;
    s.bullet = { x: 50, y: initialY + 37.5, r: 6, v: bulletVel, m: bulletMass, glow: '#ff5252' };
    s.block = { x: 450, y: initialY, w: 75, h: 75, m: blockMass, angle: 0, vAngle: 0, glow: '#448aff' };
    s.maxAngle = 0;
    s.isStuck = false;
  };

  const drawVector = (ctx, x, y, magnitude, color, label) => {
    const scale = 0.6; 
    const arrowLen = magnitude * scale;
    if (Math.abs(arrowLen) < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    ctx.moveTo(x, y);
    ctx.lineTo(x + arrowLen, y);
    const head = 10;
    const dir = arrowLen > 0 ? 1 : -1;
    ctx.lineTo(x + arrowLen - head * dir, y - head);
    ctx.moveTo(x + arrowLen, y);
    ctx.lineTo(x + arrowLen - head * dir, y + head);
    
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter';
    ctx.fillText(label, x + arrowLen + 5, y - 5);
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const L = stringLength;
      const dt = animSpeed * 0.04; 

      if (isRunning) {
        if (isFired && !s.isStuck) {
          s.bullet.x += s.bullet.v * dt; 
          if (s.bullet.x >= pivotX - s.block.w/2) {
            const vFinal = (s.bullet.m * s.bullet.v) / (s.bullet.m + s.block.m);
            s.block.vAngle = (vFinal * 12) / L; 
            s.isStuck = true;
          }
        } else if (s.isStuck) {
          const g = 0.38; 
          const accel = -(g / (L/20)) * Math.sin(s.block.angle);
          s.block.vAngle += accel * animSpeed;
          s.block.angle += s.block.vAngle * animSpeed;
          if (Math.abs(s.block.angle) > s.maxAngle) s.maxAngle = Math.abs(s.block.angle);
        }
      }

      // BACKGROUND - PURE BLACK
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // NEUTRAL GRID LINES - DARK GREY
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const currentX = pivotX + L * Math.sin(s.block.angle);
      const currentY = pivotY + L * Math.cos(s.block.angle);

      // STRING & PIVOT
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(currentX, currentY); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(pivotX, pivotY, 6, 0, Math.PI*2); ctx.fill();

      // BLOCK
      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.rotate(-s.block.angle);
      ctx.fillStyle = 'rgba(68, 138, 255, 0.3)';
      ctx.strokeStyle = '#448aff';
      ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.fillRect(-s.block.w/2, 0, s.block.w, s.block.h);
      ctx.strokeRect(-s.block.w/2, 0, s.block.w, s.block.h);
      if (s.isStuck) {
          const tangVel = s.block.vAngle * L;
          drawVector(ctx, 0, s.block.h/2, tangVel * 1.5, '#448aff', 'V_system');
      }
      ctx.restore();

      // BULLET
      if (!s.isStuck) {
        ctx.fillStyle = '#ff5252';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff5252';
        ctx.beginPath(); ctx.arc(s.bullet.x, s.bullet.y, s.bullet.r, 0, Math.PI*2); ctx.fill();
        drawVector(ctx, s.bullet.x, s.bullet.y, s.bullet.v / 5, '#ff5252', 'V_bullet');
      }

      // HUD
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`CURRENT ANGLE: ${(s.block.angle * 180 / Math.PI).toFixed(1)}°`, 20, 35);
      ctx.fillText(`PEAK ANGLE: ${(s.maxAngle * 180 / Math.PI).toFixed(1)}°`, 20, 55);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, isFired, stringLength, animSpeed]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '100px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
          Ballistic Pendulum Simulation
        </h1>
        <div style={{ height: '3px', width: '120px', background: '#00e5ff', margin: '15px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', maxWidth: '1350px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <canvas ref={canvasRef} width="950" height="550" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
            
            <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}>ANIMATION SPEED: {animSpeed.toFixed(1)}x</label>
                <input type="range" min="0.1" max="2.0" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff', marginTop: '10px' }} />
            </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '25px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { if(!isFired) setIsFired(true); setIsRunning(!isRunning); }} style={{ flex: 2, padding: '16px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
                {!isFired ? 'FIRE PROJECTILE' : isRunning ? 'PAUSE' : 'RESUME'}
            </button>
            <button onClick={resetSim} style={{ flex: 1, padding: '16px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET</button>
          </div>

          <div style={{ padding: '20px', background: '#1a1010', borderLeft: '4px solid #ff5252', borderRadius: '8px' }}>
            <h4 style={{ color: '#ff5252', margin: '0 0 15px 0' }}>BULLET PROPERTIES</h4>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888' }}>MASS (kg): {bulletMass}</label>
            <input type="range" min="0.01" max="0.5" step="0.01" value={bulletMass} onChange={(e) => setBulletMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888' }}>VELOCITY (m/s): {bulletVel}</label>
            <input type="range" min="100" max="600" value={bulletVel} onChange={(e) => setBulletVel(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #448aff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>PENDULUM MASS (kg): {blockMass}</label>
            <input type="range" min="1" max="15" step="1" value={blockMass} onChange={(e) => setBlockMass(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '20px', background: '#111', borderLeft: '4px solid #00e5ff', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#888', marginBottom: '8px' }}>STRING LENGTH (px): {stringLength}</label>
            <input type="range" min="150" max="420" value={stringLength} onChange={(e) => setStringLength(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default BallisticPendulum;
