import React, { useState, useEffect, useRef } from 'react';

const BoundaryReflection = () => {
  // --- STATE (UI Controls) ---
  const [mu1, setMu1] = useState(0.5); // Linear mass density of Medium 1
  const [mu2, setMu2] = useState(2.0); // Linear mass density of Medium 2
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);

  // --- REFS (High-Performance Engine) ---
  const canvasRef = useRef(null);
  
  const isRunningRef = useRef(true);
  const sim = useRef({
    t: 0,
    pulses: [], // Stores emission times { t0 }
    lastFrameTime: performance.now()
  });

  const params = useRef({ mu1, mu2, simSpeed });
  
  useEffect(() => {
    params.current = { mu1, mu2, simSpeed };
  }, [mu1, mu2, simSpeed]);

  // --- SCENE CONSTANTS ---
  const EQUILIBRIUM_Y = 400;
  const BASE_VELOCITY = 400; // pixels per second
  const AMPLITUDE = 120;
  const TAU = 0.15; // Pulse width (time duration)

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      const L = W / 2; // Boundary is exactly in the center
      
      const { mu1, mu2, simSpeed } = params.current;
      
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      if (isRunningRef.current) {
        sim.current.t += dt * simSpeed;
      }

      // Physics Math
      const v1 = BASE_VELOCITY / Math.sqrt(mu1);
      const v2 = BASE_VELOCITY / Math.sqrt(mu2);
      
      // Coefficients
      const R = (v2 - v1) / (v2 + v1); // Reflection
      const T = (2 * v2) / (v2 + v1);  // Transmission

      // Clean up old pulses that are off-screen to save memory
      sim.current.pulses = sim.current.pulses.filter(p => {
         const t_elapsed = sim.current.t - p.t0;
         const timeToBoundary = L / v1;
         const timeSinceBoundary = t_elapsed - timeToBoundary;
         // It's offscreen if the transmitted pulse traveled past W, AND reflected passed 0
         return !(timeSinceBoundary * v2 > L + 500 && timeSinceBoundary * v1 > L + 500);
      });

      // --- DRAWING PHASE ---
      ctx.clearRect(0, 0, W, H);

      // Grid Background
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // Equilibrium Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, EQUILIBRIUM_Y); ctx.lineTo(W, EQUILIBRIUM_Y); ctx.stroke();
      ctx.setLineDash([]);

      // Medium Background Highlights
      ctx.fillStyle = 'rgba(0, 229, 255, 0.03)';
      ctx.fillRect(0, 0, L, H);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.03)';
      ctx.fillRect(L, 0, W / 2, H);

      // Draw Boundary Line
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L, H); ctx.stroke();
      ctx.setLineDash([]);

      // Pre-calculate paths for Medium 1 and Medium 2
      ctx.beginPath();
      const path1 = new Path2D();
      const path2 = new Path2D();

      for (let x = 0; x <= W; x += 3) {
        let yTotal = 0;

        for (let p of sim.current.pulses) {
          const t_elapsed = sim.current.t - p.t0;

          if (x <= L) {
            // MEDIUM 1: Incident + Reflected
            // Incident: travels +x
            const u_inc = t_elapsed - (x / v1);
            const y_inc = AMPLITUDE * Math.exp(-Math.pow(u_inc / TAU, 2));
            
            // Reflected: travels -x starting from t = L/v1
            // Distance traveled from boundary is (L - x). Total time = L/v1 + (L-x)/v1
            const u_ref = t_elapsed - ((2 * L - x) / v1);
            const y_ref = R * AMPLITUDE * Math.exp(-Math.pow(u_ref / TAU, 2));

            yTotal += (y_inc + y_ref);
          } else {
            // MEDIUM 2: Transmitted Only
            // Transmitted: travels +x starting from t = L/v1 at boundary
            const timeToBoundary = L / v1;
            const travelTime2 = (x - L) / v2;
            const u_trans = t_elapsed - (timeToBoundary + travelTime2);
            
            const y_trans = T * AMPLITUDE * Math.exp(-Math.pow(u_trans / TAU, 2));
            yTotal += y_trans;
          }
        }

        const drawY = EQUILIBRIUM_Y - yTotal;

        if (x === 0) {
          path1.moveTo(x, drawY);
        } else if (x <= L) {
          path1.lineTo(x, drawY);
          if (x === L || x > L - 3) path2.moveTo(x, drawY); // Connect strings at boundary
        } else {
          path2.lineTo(x, drawY);
        }
      }

      // Draw Medium 1 String (Thickness based on density)
      ctx.lineWidth = Math.max(1, mu1 * 4);
      ctx.strokeStyle = '#00e5ff'; // Cyan
      ctx.shadowBlur = 10; ctx.shadowColor = '#00e5ff';
      ctx.lineJoin = 'round';
      ctx.stroke(path1);

      // Draw Medium 2 String (Thickness based on density)
      ctx.lineWidth = Math.max(1, mu2 * 4);
      ctx.strokeStyle = '#facc15'; // Yellow
      ctx.shadowBlur = 10; ctx.shadowColor = '#facc15';
      ctx.stroke(path2);
      ctx.shadowBlur = 0;

      // Draw Boundary Knot
      let knotY = EQUILIBRIUM_Y;
      // Calculate exact knot Y displacement
      let knotDisp = 0;
      for (let p of sim.current.pulses) {
         const t_elapsed = sim.current.t - p.t0;
         const u_b = t_elapsed - (L / v1);
         knotDisp += T * AMPLITUDE * Math.exp(-Math.pow(u_b / TAU, 2));
      }
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(L, EQUILIBRIUM_Y - knotDisp, 6, 0, Math.PI * 2);
      ctx.fill();

      // Labels for mediums
      ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`MEDIUM 1 (μ = ${mu1.toFixed(1)})`, L / 2, 50);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.fillText(`MEDIUM 2 (μ = ${mu2.toFixed(1)})`, L + L / 2, 50);

      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // --- CONTROLS LOGIC ---
  const handleTogglePlay = () => {
    setIsRunning(prev => {
      const nextState = !prev;
      isRunningRef.current = nextState;
      if (nextState) sim.current.lastFrameTime = performance.now();
      return nextState;
    });
  };

  const handleFirePulse = () => {
    sim.current.pulses.push({ t0: sim.current.t });
  };

  const handleClear = () => {
    sim.current.pulses = [];
  };

  // Math calculated properties for HUD
  const v1 = BASE_VELOCITY / Math.sqrt(mu1);
  const v2 = BASE_VELOCITY / Math.sqrt(mu2);
  const R = (v2 - v1) / (v2 + v1);
  const T = (2 * v2) / (v2 + v1);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '380px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          BOUNDARY REFLECTION
        </h2>

        {/* FIRE CONTROLS */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
           <button 
             onClick={handleFirePulse}
             style={{...btnStyle(true), background: '#a855f7', borderColor: '#a855f7', color: '#fff', padding: '15px', fontSize: '14px'}}
           >
             🔥 FIRE PULSE
           </button>
        </div>

        {/* MEDIUM 1 CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>MEDIUM 1 (Left String)</h4>
          <ControlRow label="Density (μ₁)" val={mu1} min={0.2} max={4.0} step={0.2} set={setMu1} color="#00e5ff" unit="kg/m" />
          <div style={hudRowStyle}><span>Velocity (v₁)</span><span style={{color:'#ccc'}}>{v1.toFixed(0)} m/s</span></div>
        </div>

        {/* MEDIUM 2 CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize:'13px' }}>MEDIUM 2 (Right String)</h4>
          <ControlRow label="Density (μ₂)" val={mu2} min={0.2} max={4.0} step={0.2} set={setMu2} color="#facc15" unit="kg/m" />
          <div style={hudRowStyle}><span>Velocity (v₂)</span><span style={{color:'#ccc'}}>{v2.toFixed(0)} m/s</span></div>
        </div>

        {/* MATH HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333', marginBottom: '20px' }}>
           <div style={{fontSize:'12px', color:'#fff', marginBottom:'12px', fontWeight:'bold'}}>BOUNDARY COEFFICIENTS</div>
           
           <div style={hudRowStyle}>
              <span>Reflected Amp (R)</span>
              <span style={{color: R < 0 ? '#ef4444' : '#00e676', fontWeight: 'bold'}}>{(R * 100).toFixed(1)}%</span>
           </div>
           {R < 0 && <div style={{fontSize: '10px', color: '#ef4444', textAlign: 'right', marginBottom: '8px'}}>Pulse is INVERTED!</div>}
           {R >= 0 && <div style={{fontSize: '10px', color: '#00e676', textAlign: 'right', marginBottom: '8px'}}>Pulse remains UPRIGHT.</div>}

           <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>

           <div style={hudRowStyle}>
              <span>Transmitted Amp (T)</span>
              <span style={{color:'#fff'}}>{(T * 100).toFixed(1)}%</span>
           </div>
        </div>

        {/* SYSTEM CONTROLS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleTogglePlay} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "RESUME"}
          </button>
          <button onClick={handleClear} style={btnStyle(false)}>CLEAR WAVES</button>
        </div>

        {/* EDUCATIONAL HINT */}
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0, lineHeight: 1.5 }}>
             <strong>Light to Heavy (μ₁ &lt; μ₂):</strong> The boundary acts like a fixed point. The reflected wave flips upside down (180° phase shift).<br/><br/>
             <strong>Heavy to Light (μ₁ &gt; μ₂):</strong> The boundary acts like a free end. The reflected wave bounces back upright.
          </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '100px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '50px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val.toFixed(1)} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '12px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s'
});

const hudRowStyle = {
  display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: '#aaa'
};

export default BoundaryReflection;      