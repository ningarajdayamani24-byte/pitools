import React, { useState, useEffect, useRef } from 'react';

const RaftCoMSim = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Simulation Controls
  const [massPerson, setMassPerson] = useState(70);    
  const [massRaft, setMassRaft] = useState(200);      
  const [personVel, setPersonVel] = useState(1.5);    
  const [raftLength, setRaftLength] = useState(350);  

  const stateRef = useRef({
    personX: 0,       
    raftX: 300,       
    comX: 0,          
    history: []       
  });

  const resetSim = () => {
    setIsRunning(false);
    const s = stateRef.current;
    s.personX = 0;
    s.raftX = 300;
    const globalPersonX = s.raftX + s.personX;
    const globalRaftMid = s.raftX + raftLength / 2;
    s.comX = (massPerson * globalPersonX + massRaft * globalRaftMid) / (massPerson + massRaft);
    s.history = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.05;

      if (isRunning) {
        const vRaftGlobal = -(massPerson * personVel) / (massPerson + massRaft);
        s.raftX += vRaftGlobal * 50 * dt; 
        s.personX += personVel * 50 * dt;

        if (s.personX >= raftLength || s.personX < 0) {
            setIsRunning(false);
        }

        s.history.push({ pX: s.raftX + s.personX, rX: s.raftX });
        if (s.history.length > 600) s.history.shift();
      }

      // --- SIMULATION RENDER (PURE BLACK) ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neutral Technical Grid
      ctx.strokeStyle = '#111111'; 
      for(let i=0; i<canvas.width; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      const pGlobalX = s.raftX + s.personX;
      const rMidX = s.raftX + raftLength / 2;

      // 1. RAFT
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = '#448aff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15; ctx.shadowColor = '#448aff';
      ctx.fillRect(s.raftX, 280, raftLength, 30);
      ctx.strokeRect(s.raftX, 280, raftLength, 30);

      // Raft CoM Marker
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#448aff';
      ctx.beginPath(); ctx.arc(rMidX, 295, 3, 0, Math.PI*2); ctx.fill();
      ctx.font = '10px monospace';
      ctx.fillText("RAFT CoM", rMidX - 25, 320);

      // 2. PERSON
      ctx.fillStyle = 'rgba(255, 82, 82, 0.3)';
      ctx.strokeStyle = '#ff5252';
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff5252';
      ctx.fillRect(pGlobalX - 15, 230, 30, 50);
      ctx.strokeRect(pGlobalX - 15, 230, 30, 50);
      
      // Person CoM Marker
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff5252';
      ctx.beginPath(); ctx.arc(pGlobalX, 255, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillText("PERSON CoM", pGlobalX - 30, 220);

      // 3. SYSTEM CENTER OF MASS (FIXED)
      ctx.shadowBlur = 20; ctx.shadowColor = '#00e5ff';
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(s.comX, 295, 7, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 12px monospace';
      ctx.fillText("SYSTEM CoM (STATIC)", s.comX - 60, 350);

      // --- GRAPH RENDER (ENLARGED) ---
      gCtx.fillStyle = '#000000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      
      if (s.history.length > 2) {
        gCtx.beginPath(); gCtx.strokeStyle = '#ff5252'; gCtx.lineWidth = 2;
        s.history.forEach((h, i) => {
            const x = (i / 600) * gCanvas.width;
            const y = (gCanvas.height/2) - (h.pX - 350) * 0.5;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();

        gCtx.beginPath(); gCtx.strokeStyle = '#448aff'; gCtx.lineWidth = 2;
        s.history.forEach((h, i) => {
            const x = (i / 600) * gCanvas.width;
            const y = (gCanvas.height/2) - (h.rX - 350) * 0.5;
            if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, massPerson, massRaft, personVel, raftLength]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '100px 20px', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
            Center of Mass: Floating Raft Lab
        </h1>
        <div style={{ height: '3px', width: '100px', background: '#00e5ff', margin: '15px auto' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', maxWidth: '1400px', margin: '0 auto', height: 'fit-content' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <canvas ref={canvasRef} width="1000" height="400" style={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} />
            
            <div style={{ background: '#050505', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '30px', marginBottom: '15px' }}>
                    <span style={{ color: '#ff5252', fontSize: '11px', fontWeight: 'bold' }}>━ PERSON POSITION</span>
                    <span style={{ color: '#448aff', fontSize: '11px', fontWeight: 'bold' }}>━ RAFT POSITION</span>
                </div>
                <canvas ref={graphRef} width="960" height="280" />
            </div>
        </div>

        {/* SIDEBAR WITH OVERFLOW FIX */}
        <aside style={{ background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '85vh', overflowY: 'auto' }}>
          <button onClick={() => { if(!isRunning) resetSim(); setIsRunning(!isRunning); }} style={{ width: '100%', padding: '15px', background: isRunning ? '#ff1744' : '#00e676', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', color: '#000' }}>
              {isRunning ? 'PAUSE' : 'START WALKING'}
          </button>
          
          <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>RESET</button>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #ff5252', borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>PERSON MASS: {massPerson}kg</label>
            <input type="range" min="40" max="150" value={massPerson} onChange={(e) => setMassPerson(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff5252' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #448aff', borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>RAFT MASS: {massRaft}kg</label>
            <input type="range" min="100" max="1000" value={massRaft} onChange={(e) => setMassRaft(Number(e.target.value))} style={{ width: '100%', accentColor: '#448aff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff', borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>SPEED: {personVel}m/s</label>
            <input type="range" min="0.5" max="4" step="0.1" value={personVel} onChange={(e) => setPersonVel(Number(e.target.value))} style={{ width: '100%', accentColor: '#00e5ff' }} />
          </div>

          <div style={{ padding: '15px', background: '#111', borderLeft: '4px solid #fff', borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>RAFT LENGTH: {raftLength}px</label>
            <input type="range" min="200" max="500" value={raftLength} onChange={(e) => setRaftLength(Number(e.target.value))} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default RaftCoMSim;
