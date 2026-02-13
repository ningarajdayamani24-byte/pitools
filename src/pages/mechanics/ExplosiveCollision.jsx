import React, { useState, useEffect, useRef } from 'react';

const DisintegrationSim = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Logic State
  const [totalMass, setTotalMass] = useState(10);
  const [massRatio, setMassRatio] = useState(0.5); // How mass is split (0.5 = equal)
  const [vInitial, setVInitial] = useState(0);    // Velocity before explosion
  const [explosionEnergy, setExplosionEnergy] = useState(500);
  const [isExploded, setIsExploded] = useState(false);

  const stateRef = useRef({
    // Initial single particle
    parent: { x: 400, y: 120, w: 80, h: 80, m: 10, v: 0, color: 'rgba(255, 255, 255, 0.3)' },
    // Resulting particles
    obj1: { x: 400, y: 120, w: 40, h: 40, m: 5, v: 0, color: 'rgba(255, 82, 82, 0.5)', glow: '#ff5252' },
    obj2: { x: 400, y: 120, w: 40, h: 40, m: 5, v: 0, color: 'rgba(68, 138, 255, 0.5)', glow: '#448aff' },
    history: [] 
  });

  useEffect(() => {
    if (!isRunning && !isExploded) {
      const m1 = totalMass * massRatio;
      const m2 = totalMass * (1 - massRatio);
      stateRef.current.parent.m = totalMass;
      stateRef.current.parent.v = vInitial;
      stateRef.current.obj1.m = m1;
      stateRef.current.obj2.m = m2;
      stateRef.current.obj1.w = 20 + m1 * 4; // Size based on mass
      stateRef.current.obj2.w = 20 + m2 * 4;
      stateRef.current.obj1.h = stateRef.current.obj1.w;
      stateRef.current.obj2.h = stateRef.current.obj2.w;
    }
  }, [totalMass, massRatio, vInitial, isRunning, isExploded]);

  const resetSim = () => {
    setIsRunning(false);
    setIsExploded(false);
    stateRef.current.parent.x = 400 - stateRef.current.parent.w/2;
    stateRef.current.history = [];
  };

  const triggerExplosion = () => {
    if (!isRunning || isExploded) return;
    
    const { obj1, obj2, parent } = stateRef.current;
    const E = explosionEnergy;
    
    // Conservation of Momentum: m1*v1 + m2*v2 = m_total * v_initial
    // Conservation of Energy: 0.5*m1*v1^2 + 0.5*m2*v2^2 = 0.5*m_total*v_initial^2 + E
    // Solving for v1 and v2 relative to center of mass:
    const v_rel = Math.sqrt((2 * E * (obj1.m + obj2.m)) / (obj1.m * obj2.m));
    
    obj1.v = parent.v - (v_rel * (obj2.m / (obj1.m + obj2.m)));
    obj2.v = parent.v + (v_rel * (obj1.m / (obj1.m + obj2.m)));
    
    obj1.x = parent.x;
    obj2.x = parent.x + parent.w - obj2.w;
    setIsExploded(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const update = () => {
      const { obj1, obj2, parent, history } = stateRef.current;
      
      if (isRunning) {
        if (!isExploded) {
          parent.x += parent.v;
          if (parent.x <= 0 || parent.x + parent.w >= canvas.width) parent.v *= -1;
        } else {
          obj1.x += obj1.v;
          obj2.x += obj2.v;
          if (obj1.x <= 0 || obj1.x + obj1.w >= canvas.width) obj1.v *= -1;
          if (obj2.x <= 0 || obj2.x + obj2.w >= canvas.width) obj2.v *= -1;
        }

        history.push({ 
            v1: isExploded ? obj1.v : parent.v, 
            v2: isExploded ? obj2.v : parent.v, 
            p1: isExploded ? obj1.m * obj1.v : (obj1.m * parent.v),
            p2: isExploded ? obj2.m * obj2.v : (obj2.m * parent.v)
        });
        if (history.length > 400) history.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // GRID LINES
      ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.strokeRect(0, 240, canvas.width, 1);
      
      if (!isExploded) {
        ctx.fillStyle = parent.color;
        ctx.strokeStyle = '#fff';
        ctx.fillRect(parent.x, parent.y, parent.w, parent.h);
        ctx.strokeRect(parent.x, parent.y, parent.w, parent.h);
        ctx.fillStyle = '#fff';
        ctx.fillText(`PRE-EXPLOSION MASS: ${parent.m}kg`, parent.x, parent.y - 10);
      } else {
        [obj1, obj2].forEach(obj => {
          ctx.save(); ctx.fillStyle = obj.color; ctx.strokeStyle = obj.glow; ctx.lineWidth = 2;
          ctx.shadowBlur = 15; ctx.shadowColor = obj.glow;
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h); ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
          ctx.restore();
          ctx.fillStyle = '#fff';
          ctx.fillText(`v: ${obj.v.toFixed(1)}`, obj.x, obj.y - 10);
        });
      }

      // --- Draw Graph ---
      gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#333';
      gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      const drawLine = (dataKey, color, dash) => {
        if (history.length < 2) return;
        gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 2;
        gCtx.setLineDash(dash ? [5,5] : []);
        history.forEach((p, i) => {
          const x = (i / 400) * gCanvas.width;
          const y = (gCanvas.height/2) - (p[dataKey] * 2);
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      };
      drawLine('v1', '#ff5252', false); drawLine('v2', '#448aff', false);
      drawLine('p1', '#ff8a80', true); drawLine('p2', '#82b1ff', true);
      
      gCtx.setLineDash([]); gCtx.fillStyle = '#fff';
      gCtx.fillText('v = Velocity (Solid)', 10, 20);
      gCtx.fillText('p = Momentum (Dashed)', 10, 35);

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, isExploded]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '120px 20px 40px', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Explosive Disintegration Simulator
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', maxWidth: '1300px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <canvas ref={canvasRef} width="900" height="300" style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px' }} />
          <div style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
             <canvas ref={graphRef} width="880" height="180" />
          </div>
        </div>

        <aside style={{ background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
            {isRunning ? 'PAUSE' : 'START MOTION'}
          </button>
          
          <button onClick={triggerExplosion} disabled={!isRunning || isExploded} style={{ width: '100%', padding: '15px', background: (!isRunning || isExploded) ? '#222' : '#ff9800', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            TRIGGER EXPLOSION
          </button>

          <button onClick={resetSim} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>RESET LAB</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff', borderRadius: '4px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>TOTAL MASS: {totalMass} kg</label>
            <input type="range" min="5" max="50" value={totalMass} onChange={(e) => setTotalMass(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />
            
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>MASS SPLIT RATIO: {massRatio}</label>
            <input type="range" min="0.1" max="0.9" step="0.1" value={massRatio} onChange={(e) => setMassRatio(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>INITIAL VELOCITY: {vInitial} m/s</label>
            <input type="range" min="-5" max="5" value={vInitial} onChange={(e) => setVInitial(Number(e.target.value))} style={{ width: '100%', marginBottom: '15px' }} />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ff9800' }}>EXPLOSION ENERGY (J): {explosionEnergy}</label>
            <input type="range" min="100" max="2000" step="100" value={explosionEnergy} onChange={(e) => setExplosionEnergy(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default DisintegrationSim;
