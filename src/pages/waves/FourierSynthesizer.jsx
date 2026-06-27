import React, { useState, useEffect, useRef } from 'react';

const FourierSynthesizer = () => {
  // --- STATE (UI Controls) ---
  const [waveType, setWaveType] = useState('square'); // 'square', 'sawtooth', 'triangle', 'pulse', 'halfsine'
  const [terms, setTerms] = useState(5); // Number of harmonics (circles)
  const [timeSpeed, setTimeSpeed] = useState(1.0);
  const [showCircles, setShowCircles] = useState(true);

  // --- REFS (High-Performance Engine) ---
  const canvasRef = useRef(null);
  const isRunningRef = useRef(true);
  
  const sim = useRef({
    t: 0,
    path: [], // Stores the drawn wave
    lastFrameTime: performance.now()
  });

  const params = useRef({ waveType, terms, timeSpeed, showCircles });
  
  // Sync React state
  useEffect(() => {
    params.current = { waveType, terms, timeSpeed, showCircles };
    // Clear path when switching wave types or changing term count heavily
    sim.current.path = [];
  }, [waveType, terms, timeSpeed, showCircles]);

  // --- SCENE CONSTANTS ---
  const BASE_AMPLITUDE = 100;
  const CENTER_X = 350;
  const CENTER_Y = 400;
  const GRAPH_START_X = 750;
  const GRAPH_WIDTH = 500; // Pixels the wave travels before being culled

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      
      const { waveType, terms, timeSpeed, showCircles } = params.current;
      
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      if (isRunningRef.current) {
        sim.current.t += dt * timeSpeed * 2; // Base speed multiplier
      }

      const currentT = sim.current.t;

      // --- FOURIER MATH & KINEMATICS ---
      let x = CENTER_X;
      let y = CENTER_Y;

      // Draw Grid & Background
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // Dividers
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(GRAPH_START_X - 50, 0); ctx.lineTo(GRAPH_START_X - 50, H);
      ctx.stroke();

      // Axis Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, CENTER_Y); ctx.lineTo(W, CENTER_Y); ctx.stroke();
      ctx.setLineDash([]);

      // Calculate Epicycles (Circles on Circles)
      for (let i = 0; i < terms; i++) {
        let prevX = x;
        let prevY = y;
        let n = 1;
        let radius = 0;
        let phase = 0;

        // Fourier Coefficients for common waveforms
        if (waveType === 'square') {
          n = i * 2 + 1; // Odd harmonics: 1, 3, 5, 7...
          radius = BASE_AMPLITUDE * (4 / (n * Math.PI));
        } 
        else if (waveType === 'sawtooth') {
          n = i + 1; // All harmonics: 1, 2, 3, 4...
          radius = BASE_AMPLITUDE * (2 / (n * Math.PI)) * (n % 2 === 0 ? -1 : 1); // Alternating sign
        } 
        else if (waveType === 'triangle') {
          n = i * 2 + 1; // Odd harmonics
          radius = BASE_AMPLITUDE * (8 / Math.pow(n * Math.PI, 2)) * (i % 2 !== 0 ? -1 : 1);
          phase = -Math.PI / 2; // Offset to start at zero
        }
        else if (waveType === 'pulse') {
          n = i + 1; // All harmonics
          const duty = 0.25; // 25% duty cycle
          radius = BASE_AMPLITUDE * 1.5 * (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
          phase = Math.PI / 2; // Shift to cosine alignment
        }
        else if (waveType === 'halfsine') {
          if (i === 0) {
            n = 1;
            radius = BASE_AMPLITUDE * 0.5; // Fundamental Sine
            phase = 0; 
          } else {
            n = i * 2; // Even harmonics: 2, 4, 6...
            radius = BASE_AMPLITUDE * (-2 / (Math.PI * (n * n - 1)));
            phase = Math.PI / 2; // Shift to cosine alignment
          }
        }

        // Calculate tip of this epicycle
        x += radius * Math.cos(n * currentT + phase);
        y += radius * Math.sin(n * currentT + phase);

        if (showCircles) {
          // Draw the circle
          ctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0.1, 1 - (i / terms))})`; // Fade inner circles
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(prevX, prevY, Math.abs(radius), 0, Math.PI * 2);
          ctx.stroke();

          // Draw the spoke (radius line)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      // Add final tip position to the path history
      if (isRunningRef.current) {
         sim.current.path.unshift(y);
         // Prune array to prevent memory leaks
         if (sim.current.path.length > GRAPH_WIDTH) {
           sim.current.path.pop();
         }
      }

      // 1. Draw Connecting Laser Line
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)'; // Yellow
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(GRAPH_START_X, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the "Pen" tip
      ctx.fillStyle = '#facc15';
      ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(GRAPH_START_X, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Draw the Resulting Waveform Graph
      if (sim.current.path.length > 0) {
        ctx.beginPath();
        
        // Color changes based on wave type
        let waveColor = '#a855f7'; // Square = Purple
        if (waveType === 'sawtooth') waveColor = '#00e676'; // Saw = Green
        if (waveType === 'triangle') waveColor = '#ef4444'; // Tri = Red
        if (waveType === 'pulse') waveColor = '#facc15'; // Pulse = Yellow
        if (waveType === 'halfsine') waveColor = '#00e5ff'; // Half-Sine = Cyan

        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = waveColor;
        ctx.lineJoin = 'round';

        for (let i = 0; i < sim.current.path.length; i++) {
          const graphX = GRAPH_START_X + i; // Move right 1 pixel per history frame
          const graphY = sim.current.path[i];
          if (i === 0) ctx.moveTo(graphX, graphY);
          else ctx.lineTo(graphX, graphY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '360px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          FOURIER WAVE SYNTHESIS
        </h2>

        {/* EDUCATIONAL BLURB */}
        <div style={{ padding: '15px', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid #00e5ff', borderRadius: '4px', marginBottom: '20px' }}>
           <p style={{ fontSize: '12px', color: '#ccc', margin: 0, lineHeight: 1.5 }}>
             <strong style={{color:'#00e5ff'}}>Fourier's Theorem:</strong> Any complex periodic wave can be created by adding together a series of simple sine waves (harmonics) of different sizes and speeds.
           </p>
        </div>

        {/* WAVE SHAPE SELECTOR */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#facc15', fontSize:'13px' }}>1. CHOOSE TARGET WAVEFORM</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
             <WaveBtn active={waveType === 'square'} onClick={() => setWaveType('square')} label="SQUARE" color="#a855f7" />
             <WaveBtn active={waveType === 'sawtooth'} onClick={() => setWaveType('sawtooth')} label="SAWTOOTH" color="#00e676" />
             <WaveBtn active={waveType === 'triangle'} onClick={() => setWaveType('triangle')} label="TRIANGLE" color="#ef4444" />
             <WaveBtn active={waveType === 'pulse'} onClick={() => setWaveType('pulse')} label="PULSE" color="#facc15" />
             <WaveBtn active={waveType === 'halfsine'} onClick={() => setWaveType('halfsine')} label="HALF-SINE" color="#00e5ff" />
          </div>
        </div>

        {/* EPICYCLE CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #a855f7' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#a855f7', fontSize:'13px' }}>2. FOURIER COMPONENTS (N)</h4>
          <ControlRow label="Harmonics Added" val={terms} min={1} max={50} step={1} set={setTerms} color="#a855f7" unit="" />
          <p style={{ fontSize: '10px', color: '#888', margin: '5px 0 0 0' }}>Higher N = More accuracy, sharper corners.</p>
        </div>

        {/* SYSTEM CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #888' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize:'13px' }}>SYSTEM SETTINGS</h4>
          <ControlRow label="Rotation Speed" val={timeSpeed} min={0.1} max={3.0} step={0.1} set={setTimeSpeed} color="#888" unit="x" />
          
          <label style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'15px', cursor:'pointer', fontSize:'11px'}}>
             <input type="checkbox" checked={showCircles} onChange={e => setShowCircles(e.target.checked)} />
             <span style={{color:'#ccc'}}>Show Epicycles (Rotating Phasors)</span>
          </label>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         <div style={{ position: 'absolute', top: 50, left: 350, transform: 'translateX(-50%)', color: '#00e5ff', fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>
            ROTATING PHASORS (EPICYCLES)
         </div>
         <div style={{ position: 'absolute', top: 50, left: GRAPH_START_X + 20, color: '#facc15', fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>
            RESULTING COMPLEX WAVEFORM
         </div>
      </main>
    </div>
  );
};

// --- STYLES ---

const WaveBtn = ({ active, onClick, label, color }) => (
  <button 
    onClick={onClick}
    style={{
      flex: '1 1 30%', padding: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
      background: active ? `${color}22` : '#1a1a1a',
      color: active ? color : '#666',
      border: `1px solid ${active ? color : '#333'}`,
      borderRadius: '4px', transition: '0.2s'
    }}
  >
    {label}
  </button>
);

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '120px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '35px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

export default FourierSynthesizer;