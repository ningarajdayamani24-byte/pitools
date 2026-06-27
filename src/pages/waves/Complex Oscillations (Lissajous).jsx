import React, { useState, useEffect, useRef } from 'react';

const LissajousFigures = () => {
  // --- STATE (UI Controls) ---
  const [freqX, setFreqX] = useState(3); // ωx
  const [freqY, setFreqY] = useState(2); // ωy
  const [phaseX, setPhaseX] = useState(90); // degrees
  const [drawSpeed, setDrawSpeed] = useState(1.0);
  const [showOscillators, setShowOscillators] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  // --- REFS (High-Performance Engine) ---
  const canvasRef = useRef(null);
  
  // HUD Refs
  const timeRef = useRef(null);
  const ratioRef = useRef(null);
  const phaseRef = useRef(null);

  // Physics State (Bypasses React renders)
  const isRunningRef = useRef(true);
  const sim = useRef({
    t: 0,
    path: [], // Stores the continuous line
    lastFrameTime: performance.now()
  });

  const params = useRef({ freqX, freqY, phaseX, drawSpeed, showOscillators });
  
  // Sync React state
  useEffect(() => {
    params.current = { freqX, freqY, phaseX, drawSpeed, showOscillators };
  }, [freqX, freqY, phaseX, drawSpeed, showOscillators]);

  // Handle Clearing Path when parameters change (so it doesn't draw a messy web)
  useEffect(() => {
    sim.current.path = [];
  }, [freqX, freqY, phaseX]);

  // --- SCENE CONSTANTS ---
  const CENTER_X = 550;
  const CENTER_Y = 400;
  const AMPLITUDE = 200; // Size of the drawing

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      
      const { freqX, freqY, phaseX, drawSpeed, showOscillators } = params.current;
      const phaseRad = (phaseX * Math.PI) / 180;
      
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      // Only advance physics if running
      if (isRunningRef.current) {
        // UPGRADE: Dynamic sub-stepping based on frequency to prevent aliasing at high Hz
        const maxFreq = Math.max(freqX, freqY, 10);
        const steps = Math.ceil(drawSpeed * maxFreq * 1.5); 
        const subDt = (dt * drawSpeed) / steps;

        for(let i=0; i<steps; i++) {
           sim.current.t += subDt;
           const x = AMPLITUDE * Math.sin(freqX * sim.current.t + phaseRad);
           const y = AMPLITUDE * Math.sin(freqY * sim.current.t);
           
           sim.current.path.push({ x, y });
           // UPGRADE: Increased memory buffer for high-frequency dense webs
           if (sim.current.path.length > 5000) sim.current.path.shift(); 
        }
      }

      // --- HUD UPDATES ---
      if (timeRef.current) timeRef.current.innerText = `${sim.current.t.toFixed(2)} s`;
      if (ratioRef.current) ratioRef.current.innerText = `${freqX} : ${freqY}`;
      if (phaseRef.current) phaseRef.current.innerText = `${phaseX}°`;

      // --- DRAWING PHASE ---
      ctx.clearRect(0, 0, W, H);

      // Grid Background
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // Axes
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CENTER_X - AMPLITUDE - 50, CENTER_Y); ctx.lineTo(CENTER_X + AMPLITUDE + 50, CENTER_Y);
      ctx.moveTo(CENTER_X, CENTER_Y - AMPLITUDE - 50); ctx.lineTo(CENTER_X, CENTER_Y + AMPLITUDE + 50);
      ctx.stroke();

      // 1. Draw the Lissajous Path (The "Art")
      if (sim.current.path.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#a855f7'; // Neon Purple
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#a855f7';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i < sim.current.path.length; i++) {
          const pt = sim.current.path[i];
          if (i === 0) ctx.moveTo(CENTER_X + pt.x, CENTER_Y - pt.y);
          else ctx.lineTo(CENTER_X + pt.x, CENTER_Y - pt.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw the "Laser Head" (current point)
        const currentPt = sim.current.path[sim.current.path.length - 1];
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.arc(CENTER_X + currentPt.x, CENTER_Y - currentPt.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 2. Draw the Driving Oscillators
      if (showOscillators && sim.current.path.length > 0) {
        const currentPt = sim.current.path[sim.current.path.length - 1];
        
        const TOP_Y = 80;
        const LEFT_X = 150;

        ctx.lineWidth = 2;
        
        // X-Oscillator (Top, Horizontal)
        ctx.strokeStyle = '#00e5ff'; // Cyan
        ctx.beginPath(); ctx.moveTo(CENTER_X - AMPLITUDE, TOP_Y); ctx.lineTo(CENTER_X + AMPLITUDE, TOP_Y); ctx.stroke();
        
        ctx.fillStyle = '#00e5ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00e5ff';
        ctx.beginPath(); ctx.arc(CENTER_X + currentPt.x, TOP_Y, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Y-Oscillator (Left, Vertical)
        ctx.strokeStyle = '#facc15'; // Yellow
        ctx.beginPath(); ctx.moveTo(LEFT_X, CENTER_Y - AMPLITUDE); ctx.lineTo(LEFT_X, CENTER_Y + AMPLITUDE); ctx.stroke();
        
        ctx.fillStyle = '#facc15'; ctx.shadowBlur = 10; ctx.shadowColor = '#facc15';
        ctx.beginPath(); ctx.arc(LEFT_X, CENTER_Y - currentPt.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Ghost Projection Lines connecting oscillators to the drawing point
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(CENTER_X + currentPt.x, TOP_Y); ctx.lineTo(CENTER_X + currentPt.x, CENTER_Y - currentPt.y); // Vertical Drop
        ctx.moveTo(LEFT_X, CENTER_Y - currentPt.y); ctx.lineTo(CENTER_X + currentPt.x, CENTER_Y - currentPt.y); // Horizontal Slide
        ctx.stroke();
        ctx.setLineDash([]);
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
      if (nextState) {
        sim.current.lastFrameTime = performance.now();
      }
      return nextState;
    });
  };

  const handleClear = () => {
    sim.current.path = [];
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '360px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          LISSAJOUS FIGURES
        </h2>

        {/* MATH EQUATIONS HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333', marginBottom: '20px', textAlign: 'center' }}>
           <div style={{ color: '#00e5ff', fontSize: '14px', marginBottom: '8px' }}>x(t) = A·sin(<span style={{fontWeight:'bold'}}>ωx</span>·t + <span style={{fontWeight:'bold'}}>φ</span>)</div>
           <div style={{ color: '#facc15', fontSize: '14px' }}>y(t) = A·sin(<span style={{fontWeight:'bold'}}>ωy</span>·t)</div>
        </div>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>X-AXIS OSCILLATOR</h4>
          <ControlRow label="Frequency (ωx)" val={freqX} min={1} max={100} step={1} set={setFreqX} color="#00e5ff" unit="Hz" />
          <ControlRow label="Phase Shift (φ)" val={phaseX} min={0} max={360} step={15} set={setPhaseX} color="#00e5ff" unit="°" />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize:'13px' }}>Y-AXIS OSCILLATOR</h4>
          <ControlRow label="Frequency (ωy)" val={freqY} min={1} max={100} step={1} set={setFreqY} color="#facc15" unit="Hz" />
        </div>

        {/* SYSTEM CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #888' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize:'13px' }}>SYSTEM</h4>
          <ControlRow label="Draw Speed" val={drawSpeed} min={0.1} max={5.0} step={0.1} set={setDrawSpeed} color="#888" unit="x" />
          <label style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'15px', cursor:'pointer', fontSize:'11px'}}>
             <input type="checkbox" checked={showOscillators} onChange={e => setShowOscillators(e.target.checked)} />
             <span style={{color:'#ccc'}}>Show Driving Oscillators & Projections</span>
          </label>
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleTogglePlay} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE DRAWING" : "RESUME DRAWING"}
          </button>
          <button onClick={handleClear} style={btnStyle(false)}>CLEAR TRACE</button>
        </div>

        {/* DATA HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={hudRowStyle}><span>Time (t)</span><span ref={timeRef} style={{color:'#fff'}}>0.00 s</span></div>
           <div style={hudRowStyle}><span>Ratio (ωx : ωy)</span><span ref={ratioRef} style={{color:'#a855f7', fontWeight:'bold'}}>1 : 1</span></div>
           <div style={hudRowStyle}><span>Phase Diff (Δφ)</span><span ref={phaseRef} style={{color:'#00e5ff'}}>90°</span></div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         <div style={{ position: 'absolute', top: 50, left: 450, color: '#00e5ff', fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>X-AXIS HARMONIC OSCILLATOR</div>
         <div style={{ position: 'absolute', top: 380, left: 10, color: '#facc15', fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Y-AXIS HARMONIC OSCILLATOR</div>
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '110px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val} {unit}</span>
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

export default LissajousFigures;