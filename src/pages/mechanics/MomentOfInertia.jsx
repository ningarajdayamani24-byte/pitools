import React, { useState, useEffect, useRef } from 'react';

const InertiaRaceDashboard = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [angle, setAngle] = useState(20);
  const [mu, setMu] = useState(0.25);
  const [selectedShapes, setSelectedShapes] = useState({
    solidSphere: true, hollowSphere: true, disc: true, ring: true, solidCylinder: true, hollowCylinder: true
  });

  const shapesData = {
    solidSphere: { name: "SOLID SPHERE", beta: 0.4, color: "#ff5252", I: "2/5 mR²", type: 'solid' },
    hollowSphere: { name: "HOLLOW SPHERE", beta: 0.67, color: "#ff4081", I: "2/3 mR²", type: 'hollow' },
    disc: { name: "SOLID DISC", beta: 0.5, color: "#448aff", I: "1/2 mR²", type: 'solid' },
    solidCylinder: { name: "SOLID CYL.", beta: 0.5, color: "#3f51b5", I: "1/2 mR²", type: 'solid' },
    hollowCylinder: { name: "HOLLOW CYL.", beta: 0.8, color: "#69f0ae", I: "~0.8 mR²", type: 'hollow' },
    ring: { name: "RING", beta: 1.0, color: "#00e5ff", I: "mR²", type: 'hollow' }
  };

  const stateRef = useRef({ objects: {} });

  const initObjects = () => {
    const objs = {};
    const keys = Object.keys(shapesData).filter(k => selectedShapes[k]);
    keys.forEach((key, index) => {
      objs[key] = { s: 0, v: 0, omega: 0, theta: 0, offset: index * 80, finished: false, time: 0 };
    });
    stateRef.current.objects = objs;
  };

  const resetSim = () => {
    initObjects();
    setIsRunning(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      const { objects } = stateRef.current;
      const dt = 0.04;
      const g = 9.81;
      const rad = (angle * Math.PI) / 180;
      const R = 24; 
      const R_m = R / 50;

      const slopeStartX = 60;
      const slopeStartY = 80;
      const raceDistance = 900;

      if (isRunning) {
        Object.keys(objects).forEach(key => {
          const obj = objects[key];
          if (obj.finished) return;
          const beta = shapesData[key].beta;
          const mu_min = (beta * Math.tan(rad)) / (1 + beta);
          let a;
          if (mu < mu_min) {
            const fk = mu * g * Math.cos(rad);
            a = g * Math.sin(rad) - fk;
            const alpha = (fk * R_m) / (beta * R_m * R_m);
            obj.v += a * dt; obj.omega += alpha * dt;
          } else {
            a = (g * Math.sin(rad)) / (1 + beta);
            obj.v += a * dt; obj.omega = obj.v / R_m;
          }
          obj.s += obj.v * 15 * dt;
          obj.theta += obj.omega * dt;
          obj.time += dt;
          if (obj.s >= raceDistance) { obj.s = raceDistance; obj.finished = true; }
        });
      }

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // GRID LINES
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const slopeEndX = slopeStartX + raceDistance * Math.cos(rad);
      const slopeEndY = slopeStartY + raceDistance * Math.sin(rad);

      // TRANSLUCENT INCLINE (Triangle Tracks)
      Object.keys(objects).forEach(key => {
          const trackY = slopeStartY + objects[key].offset;
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.moveTo(slopeStartX, trackY);
          ctx.lineTo(slopeEndX, slopeEndY + objects[key].offset);
          ctx.lineTo(slopeEndX, trackY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
      });

      Object.keys(objects).forEach(key => {
        const obj = objects[key];
        const data = shapesData[key];
        const startY = slopeStartY + obj.offset;
        const curX = slopeStartX + obj.s * Math.cos(rad) - R * Math.sin(rad);
        const curY = startY + obj.s * Math.sin(rad) + R * Math.cos(rad);

        // Draw Object
        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(obj.theta);
        ctx.shadowBlur = 15; ctx.shadowColor = data.color;
        
        if (data.type === 'solid') {
            ctx.fillStyle = data.color;
            ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Texture overlay
            ctx.beginPath(); ctx.rect(-2, -R, 4, R*2); ctx.fill();
        } else {
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 7;
            ctx.beginPath(); ctx.arc(0, 0, R - 3.5, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // Translucent core
            ctx.beginPath(); ctx.arc(0, 0, R - 7, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // BIG VISIBLE TERMS
        ctx.font = 'bold 13px monospace';
        ctx.shadowBlur = 0;
        ctx.fillStyle = data.color;
        ctx.fillText(data.name, curX + 40, curY - 15);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`v: ${obj.v.toFixed(2)} m/s`, curX + 40, curY);
        
        if (obj.finished) {
            ctx.fillStyle = '#69f0ae';
            ctx.font = 'black 16px monospace';
            ctx.fillText(`FINISH: ${obj.time.toFixed(2)}s`, curX + 40, curY + 20);
        }
      });

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, angle, mu, selectedShapes]);

  useEffect(() => { initObjects(); }, [selectedShapes]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '6px', margin: 0 }}>Moment of Inertia Race Lab</h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px', flex: 1, minHeight: 0 }}>
        <div style={{ border: '1px solid #333', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
          <canvas ref={canvasRef} width="1150" height="800" style={{ width: '100%', height: '100%' }} />
        </div>

        <aside style={{ background: '#0a0a0a', padding: '25px', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <button onClick={() => { if(!isRunning) resetSim(); setIsRunning(!isRunning); }} style={{ width: '100%', padding: '20px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', color: '#000', fontSize: '1.1rem' }}>
            {isRunning ? 'PAUSE' : 'START RACE'}
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>RESET ALL</button>
          
          <h3 style={{ fontSize: '12px', color: '#555', margin: '10px 0 0', borderBottom: '1px solid #222', paddingBottom: '5px' }}>GEOMETRY SELECT</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.keys(shapesData).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', padding: '10px', background: '#111', borderRadius: '6px', cursor: 'pointer', border: selectedShapes[key] ? `2px solid ${shapesData[key].color}` : '2px solid transparent' }}>
                <input type="checkbox" checked={selectedShapes[key]} onChange={() => setSelectedShapes(prev => ({ ...prev, [key]: !prev[key] }))} />
                <span style={{ color: shapesData[key].color, fontWeight: 'bold' }}>{shapesData[key].name}</span>
              </label>
            ))}
          </div>
          
          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff', borderRadius: '6px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>SLOPE ANGLE: {angle}°</label>
            <input type="range" min="5" max="40" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', marginTop: '10px' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252', borderRadius: '6px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>FRICTION (μ): {mu}</label>
            <input type="range" min="0.01" max="0.6" step="0.01" value={mu} onChange={(e) => setMu(Number(e.target.value))} style={{ width: '100%', marginTop: '10px' }} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default InertiaRaceDashboard;
