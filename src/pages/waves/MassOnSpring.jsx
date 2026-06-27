import React, { useState, useEffect, useRef } from 'react';

const MassOnSpring = () => {
  // --- STATE (UI Controls) ---
  const [mass, setMass] = useState(2.0);      // kg
  const [springK, setSpringK] = useState(25); // N/m
  const [damping, setDamping] = useState(0);  // kg/s
  const [initialY, setInitialY] = useState(1.5); // Initial displacement (meters)
  const [isRunning, setIsRunning] = useState(false);

  // --- REFS (High-Performance Engine) ---
  const canvasRef = useRef(null);
  
  // HUD DOM Refs (Zero lag updates)
  const timeRef = useRef(null);
  const posRef = useRef(null);
  const velRef = useRef(null);
  const keRef = useRef(null);
  const peRef = useRef(null);
  const teRef = useRef(null);

  // Physics State & Params (Bypasses React renders)
  const isRunningRef = useRef(false);
  const params = useRef({ mass, springK, damping, initialY });
  
  const sim = useRef({
    t: 0,
    y: initialY, 
    v: 0,        
    history: [], 
    lastFrameTime: performance.now()
  });

  // Sync React state to our high-speed params
  useEffect(() => {
    params.current = { mass, springK, damping, initialY };
  }, [mass, springK, damping, initialY]);

  // --- SCENE LAYOUT CONSTANTS ---
  const PIXELS_PER_METER = 100;
  const EQUILIBRIUM_Y = 280; // Shifted up slightly for more graph room
  const SPRING_X = 150;
  const ENERGY_X = 320;
  const TIME_GRAPH_X = 520;
  const POS_GRAPH_X = 860;

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const { mass, springK, damping, initialY } = params.current;
      
      // Calculate delta time
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      // --- PHYSICS INTEGRATION ---
      if (isRunningRef.current) {
        const forceSpring = -springK * sim.current.y;
        const forceDamping = -damping * sim.current.v;
        const netForce = forceSpring + forceDamping;
        
        const acceleration = netForce / mass;
        sim.current.v += acceleration * dt;
        sim.current.y += sim.current.v * dt;
        sim.current.t += dt;

        sim.current.history.unshift({ time: sim.current.t, y: sim.current.y });
        sim.current.history = sim.current.history.filter(
          p => (sim.current.t - p.time) * 100 <= 300 // Keep 300px worth of history
        );
      }

      // --- ENERGIES ---
      const PE = 0.5 * springK * Math.pow(sim.current.y, 2); 
      const KE = 0.5 * mass * Math.pow(sim.current.v, 2);
      const TotalEnergy = Math.max(PE + KE, 0); // Prevent tiny negative floats

      // --- DOM UPDATES (Fast HUD) ---
      if (timeRef.current) timeRef.current.innerText = `${sim.current.t.toFixed(2)} s`;
      if (posRef.current) posRef.current.innerText = `${sim.current.y.toFixed(2)} m`;
      if (velRef.current) velRef.current.innerText = `${sim.current.v.toFixed(2)} m/s`;
      if (keRef.current) keRef.current.innerText = `${KE.toFixed(1)} J`;
      if (peRef.current) peRef.current.innerText = `${PE.toFixed(1)} J`;
      if (teRef.current) teRef.current.innerText = `${TotalEnergy.toFixed(1)} J`;

      // --- DRAWING PHASE ---
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      ctx.clearRect(0, 0, W, H);

      // Grid Background
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // Section Dividers
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ENERGY_X - 40, 0); ctx.lineTo(ENERGY_X - 40, H);
      ctx.moveTo(TIME_GRAPH_X - 20, 0); ctx.lineTo(TIME_GRAPH_X - 20, H);
      ctx.moveTo(POS_GRAPH_X - 20, 0); ctx.lineTo(POS_GRAPH_X - 20, H);
      ctx.stroke();

      // Equilibrium Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, EQUILIBRIUM_Y); ctx.lineTo(W, EQUILIBRIUM_Y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#666'; ctx.font = '12px monospace';
      ctx.fillText("Equilibrium (y = 0)", 10, EQUILIBRIUM_Y - 10);

      // ==========================================
      // A. PHYSICAL SYSTEM
      // ==========================================
      const drawY = EQUILIBRIUM_Y + (sim.current.y * PIXELS_PER_METER);
      
      ctx.fillStyle = '#444'; ctx.fillRect(SPRING_X - 40, 0, 80, 20); // Ceiling
      
      ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(SPRING_X, 20);
      const coils = 14;
      const springLen = drawY - 20 - 25; 
      for (let i = 1; i <= coils; i++) {
        const sx = SPRING_X + (i % 2 === 0 ? 25 : -25);
        const sy = 20 + (springLen / coils) * i;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.fillStyle = '#111'; ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
      ctx.shadowBlur = 15; ctx.shadowColor = '#00e5ff';
      ctx.fillRect(SPRING_X - 25, drawY - 25, 50, 50);
      ctx.strokeRect(SPRING_X - 25, drawY - 25, 50, 50);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00e5ff'; ctx.textAlign = 'center'; ctx.font = '14px monospace';
      ctx.fillText(`${mass.toFixed(1)}kg`, SPRING_X, drawY + 5);

      // Projection Line
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(SPRING_X + 30, drawY); ctx.lineTo(TIME_GRAPH_X, drawY); ctx.stroke();
      ctx.setLineDash([]);


      // ==========================================
      // B. ENERGY BAR CHARTS
      // ==========================================
      // Dynamic Scaling: Bars scale relative to the Initial Maximum Energy so they are always tall
      const InitialSystemEnergy = Math.max(0.5 * springK * Math.pow(initialY, 2), 0.1); 
      const scaleE = (val) => Math.min((val / InitialSystemEnergy) * 200, 200); 
      
      const drawBar = (x, val, color, label) => {
        const h = scaleE(val) || 0;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x, EQUILIBRIUM_Y + 120 - 200, 30, 200); 
        ctx.fillStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color;
        ctx.fillRect(x, EQUILIBRIUM_Y + 120 - h, 30, h); 
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.fillText(label, x + 15, EQUILIBRIUM_Y + 140);
      };

      drawBar(ENERGY_X, KE, '#00e676', 'K');
      drawBar(ENERGY_X + 50, PE, '#ef4444', 'U');
      drawBar(ENERGY_X + 100, TotalEnergy, '#fff', 'ME');

      // ==========================================
      // C. GRAPH (DISPLACEMENT vs TIME)
      // ==========================================
      if (sim.current.history.length > 0) {
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3;
        ctx.shadowBlur = 8; ctx.shadowColor = '#00e5ff';
        ctx.beginPath();
        for (let i = 0; i < sim.current.history.length; i++) {
          const p = sim.current.history[i];
          const gx = TIME_GRAPH_X + (sim.current.t - p.time) * 100;
          const gy = EQUILIBRIUM_Y + (p.y * PIXELS_PER_METER);
          if (i === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(TIME_GRAPH_X, drawY, 5, 0, Math.PI*2); ctx.fill();
      }

      // ==========================================
      // D. GRAPH (ENERGY vs POSITION) -> Auto-Scaled Parabolas
      // ==========================================
      const POS_GRAPH_CENTER = POS_GRAPH_X + 150; 
      const POS_GRAPH_BASELINE = EQUILIBRIUM_Y + 160;
      const PARABOLA_MAX_HEIGHT = 250; // Forces graph to be tall and visible

      // Axes for Energy Graph
      ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      // Y-axis (Energy)
      ctx.beginPath(); ctx.moveTo(POS_GRAPH_CENTER, POS_GRAPH_BASELINE + 10); ctx.lineTo(POS_GRAPH_CENTER, POS_GRAPH_BASELINE - PARABOLA_MAX_HEIGHT - 20); ctx.stroke();
      // X-axis (Position)
      ctx.beginPath(); ctx.moveTo(POS_GRAPH_X + 10, POS_GRAPH_BASELINE); ctx.lineTo(POS_GRAPH_X + 290, POS_GRAPH_BASELINE); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#888'; ctx.font = '11px monospace';
      ctx.fillText("position", POS_GRAPH_CENTER + 8, POS_GRAPH_BASELINE + 15);
      ctx.fillText("energy", POS_GRAPH_CENTER + 8, POS_GRAPH_BASELINE - PARABOLA_MAX_HEIGHT - 10);

      if (TotalEnergy > 0.01) {
        // Auto-scaling factors to guarantee parabolas ALWAYS stretch to fit the box perfectly
        const A = Math.sqrt((2 * TotalEnergy) / springK); // Amplitude
        const scaleX = 130 / A; // Scale horizontal (130px width on each side)
        const scaleY = PARABOLA_MAX_HEIGHT / TotalEnergy; // Scale vertical (Full height)
        
        // Draw ME Line (White)
        const me_H = TotalEnergy * scaleY;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(POS_GRAPH_X + 10, POS_GRAPH_BASELINE - me_H); ctx.lineTo(POS_GRAPH_X + 290, POS_GRAPH_BASELINE - me_H); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillText("ME", POS_GRAPH_X + 10, POS_GRAPH_BASELINE - me_H - 8);

        // Draw Potential Energy U (Red Parabola opening up)
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
        for (let y = -A; y <= A; y += A/50) {
          const u = 0.5 * springK * y * y;
          const plotX = POS_GRAPH_CENTER + (y * scaleX);
          const plotY = POS_GRAPH_BASELINE - (u * scaleY);
          if (y === -A) ctx.moveTo(plotX, plotY);
          else ctx.lineTo(plotX, plotY);
        }
        ctx.stroke();

        // Draw Kinetic Energy K (Green Parabola opening down)
        ctx.beginPath();
        ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2.5;
        for (let y = -A; y <= A; y += A/50) {
          const u = 0.5 * springK * y * y;
          const k = Math.max(0, TotalEnergy - u);
          const plotX = POS_GRAPH_CENTER + (y * scaleX);
          const plotY = POS_GRAPH_BASELINE - (k * scaleY);
          if (y === -A) ctx.moveTo(plotX, plotY);
          else ctx.lineTo(plotX, plotY);
        }
        ctx.stroke();

        // Draw Current State Dots (with nice white borders)
        const currentPlotX = POS_GRAPH_CENTER + (sim.current.y * scaleX);
        const currentPlotPE_Y = POS_GRAPH_BASELINE - (PE * scaleY);
        const currentPlotKE_Y = POS_GRAPH_BASELINE - (KE * scaleY);
        
        // U Dot
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(currentPlotX, currentPlotPE_Y, 6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillText("U", currentPlotX + 12, currentPlotPE_Y + 12);
        
        // K Dot
        ctx.fillStyle = '#00e676'; ctx.beginPath(); ctx.arc(currentPlotX, currentPlotKE_Y, 6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillText("K", currentPlotX + 12, currentPlotKE_Y - 8);
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    // Kick off the loop
    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // --- CONTROLS LOGIC ---
  const handleTogglePlay = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    isRunningRef.current = nextState;
    if (nextState) {
      sim.current.lastFrameTime = performance.now();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    sim.current.t = 0;
    sim.current.y = params.current.initialY;
    sim.current.v = 0;
    sim.current.history = [];
  };

  const handleSliderDrop = (val) => {
    setInitialY(val);
    if (!isRunningRef.current) {
      sim.current.y = val;
      sim.current.v = 0;
      sim.current.t = 0;
      sim.current.history = [];
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '350px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          MASS ON A SPRING
        </h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>SYSTEM CONTROLS</h4>
          <ControlRow label="Mass (m)" val={mass} min={0.5} max={10} step={0.5} set={setMass} color="#00e5ff" unit="kg" />
          <ControlRow label="Spring Const (k)" val={springK} min={10} max={100} step={5} set={setSpringK} color="#facc15" unit="N/m" />
          <ControlRow label="Damping (b)" val={damping} min={0} max={5} step={0.1} set={setDamping} color="#ef4444" unit="kg/s" />
          <div style={{ borderTop: '1px solid #333', margin: '15px 0' }} />
          <ControlRow label="Initial Drop" val={initialY} min={-1.5} max={1.5} step={0.1} set={handleSliderDrop} color="#a855f7" unit="m" />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleTogglePlay} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START OSCILLATION"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333', marginBottom: '15px' }}>
           <div style={{fontSize:'12px', color:'#fff', marginBottom:'12px', fontWeight:'bold'}}>KINEMATICS</div>
           <div style={hudRowStyle}><span>Time (t)</span><span ref={timeRef} style={{color:'#fff'}}>0.00 s</span></div>
           <div style={hudRowStyle}><span>Position (y)</span><span ref={posRef} style={{color:'#00e5ff'}}>0.0 m</span></div>
           <div style={hudRowStyle}><span>Velocity (v)</span><span ref={velRef} style={{color:'#00e676'}}>0.0 m/s</span></div>
        </div>

        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={{fontSize:'12px', color:'#fff', marginBottom:'12px', fontWeight:'bold'}}>ENERGY</div>
           <div style={hudRowStyle}><span>Kinetic (K)</span><span ref={keRef} style={{color:'#00e676'}}>0.0 J</span></div>
           <div style={hudRowStyle}><span>Potential (U)</span><span ref={peRef} style={{color:'#ef4444'}}>0.0 J</span></div>
           <div style={{ borderTop:'1px solid #333', marginTop:'6px', paddingTop:'6px', ...hudRowStyle }}>
              <span>Total ME</span><span ref={teRef} style={{color:'#fff', fontWeight:'bold'}}>0.0 J</span>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         <div style={{ position: 'absolute', top: 30, left: SPRING_X - 60, color: '#00e5ff', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>PHYSICAL SYSTEM</div>
         <div style={{ position: 'absolute', top: 30, left: ENERGY_X - 10, color: '#facc15', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>ENERGY BARS</div>
         <div style={{ position: 'absolute', top: 30, left: TIME_GRAPH_X + 20, color: '#00e5ff', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>DISPLACEMENT vs TIME</div>
         <div style={{ position: 'absolute', top: 30, left: POS_GRAPH_X + 20, color: '#ef4444', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>ENERGY vs POSITION</div>
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '110px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val.toFixed(1)} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '12px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s'
});

const hudRowStyle = {
  display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#aaa'
};

export default MassOnSpring;