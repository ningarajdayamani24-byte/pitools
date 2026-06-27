import React, { useState, useEffect, useRef } from 'react';

const PulseInterference = () => {
  // --- STATE (UI Controls) ---
  // Pulse 1 (Left side, moving right)
  const [amp1, setAmp1] = useState(120);    // Amplitude in pixels
  const [width1, setWidth1] = useState(80); // Width parameter
  
  // Pulse 2 (Right side, moving left)
  const [amp2, setAmp2] = useState(120);    // Amplitude in pixels
  const [width2, setWidth2] = useState(80); // Width parameter
  
  // Playback
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);

  // --- REFS (High-Performance Animation Engine) ---
  const canvasRef = useRef(null);
  
  // Physics State (Bypasses React for zero-lag performance)
  const isRunningRef = useRef(true);
  const sim = useRef({
    t: 0,
    lastFrameTime: performance.now()
  });

  const params = useRef({ amp1, width1, amp2, width2, simSpeed });
  
  // Sync React state to our high-speed physics loop
  useEffect(() => {
    params.current = { amp1, width1, amp2, width2, simSpeed };
  }, [amp1, width1, amp2, width2, simSpeed]);

  // --- SCENE & PHYSICS CONSTANTS ---
  const WAVE_SPEED = 250; // Pixels per second
  const EQUILIBRIUM_Y = 400; // Vertical center of canvas
  
  // Gaussian Pulse Math Helper: y = A * e^(-(x - x0)^2 / w^2)
  const calculateGaussian = (x, center, A, w) => {
    return A * Math.exp(-Math.pow(x - center, 2) / Math.pow(w, 2));
  };

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      
      const { amp1, width1, amp2, width2, simSpeed } = params.current;
      
      // Calculate smooth time delta (capped to prevent huge jumps)
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      if (isRunningRef.current) {
        sim.current.t += dt * simSpeed;
        
        // Auto-pause if pulses have completely passed off screen
        const maxTime = (W + 400) / WAVE_SPEED;
        if (sim.current.t > maxTime) {
           setIsRunning(false);
           isRunningRef.current = false;
        }
      }

      // 1. Clear Canvas & Draw Grid
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // 2. Equilibrium Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, EQUILIBRIUM_Y); ctx.lineTo(W, EQUILIBRIUM_Y); ctx.stroke();
      ctx.setLineDash([]);

      // 3. Calculate Pulse Positions
      // Pulse 1 starts slightly off-screen left, Pulse 2 off-screen right
      const x0_1 = -200 + (WAVE_SPEED * sim.current.t); 
      const x0_2 = W + 200 - (WAVE_SPEED * sim.current.t); 

      // Pre-calculate paths for drawing efficiency
      ctx.beginPath();
      const pathNet = new Path2D();
      const path1 = new Path2D();
      const path2 = new Path2D();

      for (let x = 0; x <= W; x += 3) {
        // Calculate individual displacements
        const y1 = calculateGaussian(x, x0_1, amp1, width1);
        const y2 = calculateGaussian(x, x0_2, amp2, width2);
        
        // Superposition (Algebraic Sum)
        const yNet = y1 + y2;

        // Note: Subtracting because Canvas Y-axis goes down
        const plotYNet = EQUILIBRIUM_Y - yNet;
        const plotY1 = EQUILIBRIUM_Y - y1;
        const plotY2 = EQUILIBRIUM_Y - y2;

        if (x === 0) {
          pathNet.moveTo(x, plotYNet);
          path1.moveTo(x, plotY1);
          path2.moveTo(x, plotY2);
        } else {
          pathNet.lineTo(x, plotYNet);
          path1.lineTo(x, plotY1);
          path2.lineTo(x, plotY2);
        }
      }

      // 4. Draw Individual "Ghost" Pulses
      ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      
      // Left Pulse (Cyan)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.stroke(path1);
      
      // Right Pulse (Yellow)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.stroke(path2);
      
      ctx.setLineDash([]);

      // 5. Draw Resultant Superposition Wave
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#a855f7'; // Purple
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a855f7';
      ctx.stroke(pathNet);
      ctx.shadowBlur = 0;

      // Draw particle dots to show the physical medium moving
      for (let x = 50; x < W; x += 50) {
         const y1 = calculateGaussian(x, x0_1, amp1, width1);
         const y2 = calculateGaussian(x, x0_2, amp2, width2);
         const yNet = y1 + y2;
         
         ctx.fillStyle = '#fff';
         ctx.beginPath();
         ctx.arc(x, EQUILIBRIUM_Y - yNet, 4, 0, Math.PI * 2);
         ctx.fill();
      }

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

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    sim.current.t = 0;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '350px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          PULSE INTERFERENCE
        </h2>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleTogglePlay} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START SIMULATION"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* PULSE 1 CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>PULSE 1 (Left ➝ Right)</h4>
          <ControlRow label="Amplitude" val={amp1} min={-200} max={200} step={10} set={setAmp1} color="#00e5ff" unit="px" />
          <ControlRow label="Width" val={width1} min={20} max={200} step={5} set={setWidth1} color="#00e5ff" unit="px" />
        </div>

        {/* PULSE 2 CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize:'13px' }}>PULSE 2 (Right ➝ Left)</h4>
          <ControlRow label="Amplitude" val={amp2} min={-200} max={200} step={10} set={setAmp2} color="#facc15" unit="px" />
          <ControlRow label="Width" val={width2} min={20} max={200} step={5} set={setWidth2} color="#facc15" unit="px" />
        </div>

        {/* SYSTEM CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #888' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize:'13px' }}>SYSTEM SETTINGS</h4>
          <ControlRow label="Sim Speed" val={simSpeed} min={0.1} max={2.0} step={0.1} set={setSimSpeed} color="#888" unit="x" />
        </div>

        {/* EDUCATIONAL INSTRUCTIONS */}
        <div style={{ padding: '15px', border: '1px solid #333', borderRadius: '4px', background: '#0a0a0c' }}>
           <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.5', margin: 0 }}>
             <strong style={{color:'#fff'}}>Constructive Interference:</strong> Both amplitudes are positive. The resulting wave is larger than either individual pulse.<br/><br/>
             <strong style={{color:'#fff'}}>Destructive Interference:</strong> Make one amplitude positive and one negative. They will cancel each other out when they overlap.
           </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         {/* LEGEND OVERLAY */}
         <div style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(0,0,0,0.7)', border: '1px solid #333', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
               <div style={{ width:'20px', height:'3px', borderBottom:'2px dashed #00e5ff' }}></div>
               <span style={{ fontSize:'12px', color:'#00e5ff' }}>Pulse 1</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
               <div style={{ width:'20px', height:'3px', borderBottom:'2px dashed #facc15' }}></div>
               <span style={{ fontSize:'12px', color:'#facc15' }}>Pulse 2</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
               <div style={{ width:'20px', height:'4px', background:'#a855f7', boxShadow:'0 0 8px #a855f7' }}></div>
               <span style={{ fontSize:'12px', color:'#a855f7', fontWeight:'bold' }}>Resultant Superposition</span>
            </div>
         </div>
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '80px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val.toFixed(0)} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '12px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s'
});

export default PulseInterference;