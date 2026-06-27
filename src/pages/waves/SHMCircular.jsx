import React, { useState, useEffect, useRef } from 'react';

const SHMCircular = () => {
  // --- STATE (Only for UI Controls) ---
  const [amplitude, setAmplitude] = useState(80);
  const [omega, setOmega] = useState(2.0);
  const [waveSpeed, setWaveSpeed] = useState(100);
  const [showVectors, setShowVectors] = useState(true);
  const [showProjections, setShowProjections] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  // --- REFS (For High-Performance Animation) ---
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // Real-time HUD DOM references (bypasses React re-renders for zero lag)
  const timeRef = useRef(null);
  const yRef = useRef(null);
  const vyRef = useRef(null);
  const ayRef = useRef(null);

  // Simulation State (Persists across frames)
  const sim = useRef({ t: 0, history: [] });
  const lastTimeRef = useRef(performance.now());

  // --- SCENE GEOMETRY ---
  const ORIGIN_X = 200;
  const ORIGIN_Y = 280;
  const SPRING_X = 450;
  const GRAPH_START_X = 600;
  const GRAPH_WIDTH = 550;

  // --- MAIN ANIMATION LOOP ---
  useEffect(() => {
    // Reset lastTime when the effect runs to prevent massive time jumps
    lastTimeRef.current = performance.now();

    const updateAndDraw = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      
      // Calculate Delta Time safely
      let dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      // Cap dt to prevent physics explosions if the browser tab was hidden
      if (dt > 0.05) dt = 0.05;
      if (dt < 0) dt = 0;

      // Only advance physics if running
      if (isRunning) {
        sim.current.t += dt;
        const currentY = amplitude * Math.sin(omega * sim.current.t);
        
        // Update wave trace history
        sim.current.history.unshift({ time: sim.current.t, y: currentY });
        
        // Prune old history points to prevent memory leaks
        sim.current.history = sim.current.history.filter(
          pt => (sim.current.t - pt.time) * waveSpeed <= GRAPH_WIDTH
        );
      }

      // --- KINEMATICS CALCULATIONS ---
      const t = sim.current.t;
      const angle = omega * t;
      const yPos = amplitude * Math.sin(angle);
      const xPos = amplitude * Math.cos(angle); 
      const v_y = amplitude * omega * Math.cos(angle);
      const v_x = -amplitude * omega * Math.sin(angle);
      const a_y = -amplitude * omega * omega * Math.sin(angle);
      const a_x = -amplitude * omega * omega * Math.cos(angle);

      // Update HUD directly via DOM
      if (timeRef.current) timeRef.current.innerText = `${t.toFixed(2)} s`;
      if (yRef.current) yRef.current.innerText = `${yPos.toFixed(1)} m`;
      if (vyRef.current) vyRef.current.innerText = `${v_y.toFixed(1)} m/s`;
      if (ayRef.current) ayRef.current.innerText = `${a_y.toFixed(1)} m/s²`;

      // --- DRAWING PHASE ---
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;

      // 1. Clear & Draw Grid
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#151515';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i = 0; i < W; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 40) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // 2. Draw Axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ORIGIN_X - 160, ORIGIN_Y); ctx.lineTo(W, ORIGIN_Y); 
      ctx.moveTo(ORIGIN_X, ORIGIN_Y - 160); ctx.lineTo(ORIGIN_X, ORIGIN_Y + 160); 
      ctx.stroke();

      // Vertical guides
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(SPRING_X, 0); ctx.lineTo(SPRING_X, H);
      ctx.stroke();
      
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(GRAPH_START_X, 0); ctx.lineTo(GRAPH_START_X, H);
      ctx.stroke();

      // 3. Projections (Ghost Lines)
      if (showProjections) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ORIGIN_X + xPos, ORIGIN_Y - yPos); 
        ctx.lineTo(GRAPH_START_X, ORIGIN_Y - yPos);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ORIGIN_X, ORIGIN_Y);
        ctx.lineTo(ORIGIN_X + xPos, ORIGIN_Y - yPos);
        ctx.stroke();
      }

      // 4. Circular Motion
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(ORIGIN_X, ORIGIN_Y, amplitude, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#00e5ff';
      ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
      ctx.beginPath(); ctx.arc(ORIGIN_X + xPos, ORIGIN_Y - yPos, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Helper function for drawing vectors
      const drawArrow = (x, y, dx, dy, color) => {
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        const headLen = 8;
        const a = Math.atan2(dy, dx);
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - headLen * Math.cos(a - Math.PI / 6), y + dy - headLen * Math.sin(a - Math.PI / 6));
        ctx.lineTo(x + dx - headLen * Math.cos(a + Math.PI / 6), y + dy - headLen * Math.sin(a + Math.PI / 6));
        ctx.fill();
      };

      // Circle Vectors
      if (showVectors) {
        drawArrow(ORIGIN_X + xPos, ORIGIN_Y - yPos, v_x * 0.5, -v_y * 0.5, '#00e676');
        drawArrow(ORIGIN_X + xPos, ORIGIN_Y - yPos, a_x * 0.05, -a_y * 0.05, '#ef4444');
      }

      // 5. Mass on Spring
      ctx.fillStyle = '#555';
      ctx.fillRect(SPRING_X - 30, 40, 60, 15);
      
      ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(SPRING_X, 55);
      const numCoils = 12;
      const springBottom = ORIGIN_Y - yPos - 25;
      const springHeight = Math.max(springBottom - 55, 10); // Prevent negative height if amplitude is massive
      for(let i = 1; i <= numCoils; i++) {
        const sx = SPRING_X + (i % 2 === 0 ? 15 : -15);
        const sy = 55 + (springHeight / numCoils) * i;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.fillStyle = '#111'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
      ctx.shadowBlur = 10; ctx.shadowColor = '#facc15';
      ctx.fillRect(SPRING_X - 25, ORIGIN_Y - yPos - 25, 50, 50);
      ctx.strokeRect(SPRING_X - 25, ORIGIN_Y - yPos - 25, 50, 50);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#facc15'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('m', SPRING_X, ORIGIN_Y - yPos + 5);

      // Spring Vectors
      if (showVectors) {
        drawArrow(SPRING_X + 35, ORIGIN_Y - yPos, 0, -v_y * 0.5, '#00e676');
        drawArrow(SPRING_X - 35, ORIGIN_Y - yPos, 0, -a_y * 0.05, '#ef4444');
      }

      // 6. Transverse Wave Graph
      if (sim.current.history.length > 0) {
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3;
        ctx.shadowBlur = 10; ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        for (let i = 0; i < sim.current.history.length; i++) {
          const pt = sim.current.history[i];
          const x = GRAPH_START_X + (t - pt.time) * waveSpeed;
          const y = ORIGIN_Y - pt.y;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Tracer Dot
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(GRAPH_START_X, ORIGIN_Y - yPos, 6, 0, Math.PI * 2); ctx.fill();
      }

      // Schedule next frame
      requestRef.current = requestAnimationFrame(updateAndDraw);
    };

    // Start the loop
    requestRef.current = requestAnimationFrame(updateAndDraw);
    
    // Clean up
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, amplitude, omega, waveSpeed, showVectors, showProjections]);

  const handleReset = () => {
    setIsRunning(false);
    sim.current.t = 0;
    sim.current.history = [];
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '350px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          SHM & CIRCULAR MOTION
        </h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>PARAMETERS</h4>
          <ControlRow label="Amplitude (A)" val={amplitude} min={20} max={140} step={1} set={(v)=>{setAmplitude(v); handleReset();}} color="#00e5ff" unit="m" />
          <ControlRow label="Ang. Freq (ω)" val={omega} min={0.5} max={5.0} step={0.1} set={setOmega} color="#a855f7" unit="rad/s" />
          <ControlRow label="Wave Speed (v)" val={waveSpeed} min={50} max={300} step={10} set={setWaveSpeed} color="#facc15" unit="m/s" />
        </div>

        {/* TOGGLES */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize:'13px' }}>VISUALS</h4>
          <label style={toggleStyle}>
             <input type="checkbox" checked={showProjections} onChange={e => setShowProjections(e.target.checked)} />
             <span style={{color:'#ccc'}}>Show Projection Lines</span>
          </label>
          <label style={toggleStyle}>
             <input type="checkbox" checked={showVectors} onChange={e => setShowVectors(e.target.checked)} />
             <span style={{color:'#00e676'}}>Show Velocity (Green)</span>
          </label>
          <label style={toggleStyle}>
             <input type="checkbox" checked={showVectors} onChange={e => setShowVectors(e.target.checked)} />
             <span style={{color:'#ef4444'}}>Show Acceleration (Red)</span>
          </label>
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START SIMULATION"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* KINEMATICS HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={{fontSize:'12px', color:'#fff', marginBottom:'8px', fontWeight:'bold'}}>REAL-TIME DATA</div>
           
           <div style={hudRowStyle}><span>Time (t)</span><span ref={timeRef} style={{color:'#fff'}}>0.00 s</span></div>
           <div style={hudRowStyle}><span>Displacement (y)</span><span ref={yRef} style={{color:'#00e5ff'}}>0.0 m</span></div>
           <div style={hudRowStyle}><span>Velocity (vy)</span><span ref={vyRef} style={{color:'#00e676'}}>0.0 m/s</span></div>
           <div style={hudRowStyle}><span>Acceleration (ay)</span><span ref={ayRef} style={{color:'#ef4444'}}>0.0 m/s²</span></div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         {/* ABSOLUTE LABELS OVER CANVAS */}
         <div style={{ position: 'absolute', top: 550, left: 140, color: '#00e5ff', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>CIRCULAR MOTION</div>
         <div style={{ position: 'absolute', top: 550, left: 370, color: '#facc15', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>HARMONIC OSCILLATOR</div>
         <div style={{ position: 'absolute', top: 550, left: 700, color: '#a855f7', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>TRANSVERSE WAVE y(t)</div>
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '100px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '12px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s'
});

const toggleStyle = {
  display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', cursor:'pointer', fontSize:'11px'
};

const hudRowStyle = {
  display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#aaa'
};

export default SHMCircular;