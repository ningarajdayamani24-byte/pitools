import React, { useState, useEffect, useRef } from 'react';

const AcousticBeats = () => {
  // --- STATE (UI Controls) ---
  const [freq1, setFreq1] = useState(120); // Hz
  const [freq2, setFreq2] = useState(125); // Hz
  const [volume, setVolume] = useState(0.3); // 0.0 to 1.0
  const [isRunning, setIsRunning] = useState(false);

  // --- REFS ---
  const canvasRef = useRef(null);
  
  // Audio Engine Refs
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const gainRef = useRef(null);

  // Physics & Animation State
  const sim = useRef({
    t: 0,
    lastFrameTime: performance.now()
  });
  const isRunningRef = useRef(false);
  const params = useRef({ freq1, freq2 });

  // Sync parameters for the canvas animation loop
  useEffect(() => {
    params.current = { freq1, freq2 };
    
    // Smoothly update audio frequencies if playing
    if (audioCtxRef.current && isRunning) {
       if (osc1Ref.current) osc1Ref.current.frequency.setTargetAtTime(freq1, audioCtxRef.current.currentTime, 0.05);
       if (osc2Ref.current) osc2Ref.current.frequency.setTargetAtTime(freq2, audioCtxRef.current.currentTime, 0.05);
    }
  }, [freq1, freq2, isRunning]);

  // Handle Master Volume
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(isRunning ? volume : 0, audioCtxRef.current.currentTime, 0.1);
    }
  }, [volume, isRunning]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      
      const { freq1, freq2 } = params.current;
      
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      if (isRunningRef.current) {
        sim.current.t += dt;
      }

      // We want to show exactly 0.5 seconds of time across the screen width
      // This is wide enough to see the beat envelope form clearly.
      const TIME_WINDOW = 0.5; 

      // --- SCENE LAYOUT ---
      const GRAPH_H = H / 3;
      const Y1 = GRAPH_H * 0.5; // Top graph center
      const Y2 = GRAPH_H * 1.5; // Mid graph center
      const Y3 = GRAPH_H * 2.5; // Bottom graph center
      const AMPLITUDE = GRAPH_H * 0.35; // Height of the waves

      // Clear & Draw Grid
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i = 0; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, H); }
      for(let j = 0; j < H; j += 50) { ctx.moveTo(0, j); ctx.lineTo(W, j); }
      ctx.stroke();

      // Draw Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
      ctx.beginPath(); 
      ctx.moveTo(0, Y1); ctx.lineTo(W, Y1);
      ctx.moveTo(0, Y2); ctx.lineTo(W, Y2);
      ctx.moveTo(0, Y3); ctx.lineTo(W, Y3);
      ctx.stroke();
      ctx.setLineDash([]);

      // Section Dividers
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GRAPH_H); ctx.lineTo(W, GRAPH_H);
      ctx.moveTo(0, GRAPH_H * 2); ctx.lineTo(W, GRAPH_H * 2);
      ctx.stroke();

      // Pre-calculate paths for performance
      ctx.beginPath();
      const p1 = new Path2D();
      const p2 = new Path2D();
      const pNet = new Path2D();
      const pEnvTop = new Path2D();
      const pEnvBot = new Path2D();

      for (let x = 0; x <= W; x += 2) {
        // Calculate the physical time this X-pixel represents
        const plotTime = sim.current.t + (x / W) * TIME_WINDOW;
        
        // y(t) = A * sin(2πft)
        const val1 = Math.sin(2 * Math.PI * freq1 * plotTime);
        const val2 = Math.sin(2 * Math.PI * freq2 * plotTime);
        const netVal = val1 + val2; // Superposition

        // The Mathematical Envelope equation: E(t) = 2A * cos(2π * ((f1-f2)/2) * t)
        const envVal = 2 * Math.cos(2 * Math.PI * ((freq1 - freq2) / 2) * plotTime);

        if (x === 0) {
          p1.moveTo(x, Y1 - val1 * AMPLITUDE);
          p2.moveTo(x, Y2 - val2 * AMPLITUDE);
          pNet.moveTo(x, Y3 - (netVal / 2) * AMPLITUDE);
          pEnvTop.moveTo(x, Y3 - Math.abs(envVal / 2) * AMPLITUDE);
          pEnvBot.moveTo(x, Y3 + Math.abs(envVal / 2) * AMPLITUDE);
        } else {
          p1.lineTo(x, Y1 - val1 * AMPLITUDE);
          p2.lineTo(x, Y2 - val2 * AMPLITUDE);
          pNet.lineTo(x, Y3 - (netVal / 2) * AMPLITUDE);
          pEnvTop.lineTo(x, Y3 - Math.abs(envVal / 2) * AMPLITUDE);
          pEnvBot.lineTo(x, Y3 + Math.abs(envVal / 2) * AMPLITUDE);
        }
      }

      // Draw Wave 1 (Cyan)
      ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = '#00e5ff';
      ctx.stroke(p1);
      
      // Draw Wave 2 (Yellow)
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = '#facc15';
      ctx.stroke(p2);
      
      // Draw Superposition Wave (Purple)
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#a855f7';
      ctx.stroke(pNet);
      ctx.shadowBlur = 0;

      // Draw the Beat Envelope (White Dashed)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.stroke(pEnvTop);
      ctx.stroke(pEnvBot);
      ctx.setLineDash([]);

      // Draw Static "Now" Line on the left edge
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(2, H); ctx.stroke();

      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // --- AUDIO ENGINE CONTROL ---
  const togglePlay = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    isRunningRef.current = nextState;

    if (nextState) {
      // Initialize AudioContext on first play (Browser Autoplay Policy requirement)
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        
        // Master Gain (Volume)
        gainRef.current = audioCtxRef.current.createGain();
        gainRef.current.connect(audioCtxRef.current.destination);
        gainRef.current.gain.value = 0; // Start silent

        // Oscillator 1
        osc1Ref.current = audioCtxRef.current.createOscillator();
        osc1Ref.current.type = 'sine';
        osc1Ref.current.frequency.value = freq1;
        osc1Ref.current.connect(gainRef.current);
        osc1Ref.current.start();

        // Oscillator 2
        osc2Ref.current = audioCtxRef.current.createOscillator();
        osc2Ref.current.type = 'sine';
        osc2Ref.current.frequency.value = freq2;
        osc2Ref.current.connect(gainRef.current);
        osc2Ref.current.start();
      }

      // Resume context if it was suspended
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      // Fade in volume
      gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
      sim.current.lastFrameTime = performance.now();
      
    } else {
      // Fade out volume to avoid audio pops
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
    }
  };

  // Math calculated properties
  const beatFreq = Math.abs(freq1 - freq2);
  const avgFreq = (freq1 + freq2) / 2;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '360px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          ACOUSTIC BEATS
        </h2>

        {/* PLAYBACK & AUDIO CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
           <h4 style={{ margin: '0 0 15px 0', color: '#ef4444', fontSize:'13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔊 AUDIO ENGINE
           </h4>
           <button 
              onClick={togglePlay} 
              style={{
                width: '100%', padding: '15px', background: isRunning ? '#ef4444' : '#1a1a1a', 
                color: isRunning ? '#fff' : '#ef4444', border: '1px solid #ef4444', 
                borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', 
                marginBottom: '15px', transition: '0.2s', boxShadow: isRunning ? '0 0 15px rgba(239,68,68,0.5)' : 'none'
              }}
           >
              {isRunning ? "MUTE AUDIO & PAUSE" : "PLAY SOUND & ANIMATE"}
           </button>
           
           <ControlRow label="Master Volume" val={volume} min={0} max={1} step={0.05} set={setVolume} color="#fff" unit="" />
        </div>

        {/* OSCILLATOR CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>WAVE 1 (f₁)</h4>
          <ControlRow label="Frequency" val={freq1} min={100} max={200} step={1} set={setFreq1} color="#00e5ff" unit="Hz" />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize:'13px' }}>WAVE 2 (f₂)</h4>
          <ControlRow label="Frequency" val={freq2} min={100} max={200} step={1} set={setFreq2} color="#facc15" unit="Hz" />
        </div>

        {/* MATH HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={{fontSize:'12px', color:'#fff', marginBottom:'12px', fontWeight:'bold'}}>INTERFERENCE MATH</div>
           <div style={hudRowStyle}>
              <span>Average Freq (Carrier)</span>
              <span style={{color:'#a855f7'}}>{avgFreq.toFixed(1)} Hz</span>
           </div>
           <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>
           <div style={hudRowStyle}>
              <span>Beat Frequency |f₁ - f₂|</span>
              <span style={{color:'#fff', fontWeight: 'bold'}}>{beatFreq.toFixed(1)} Hz</span>
           </div>
        </div>

        {/* EDUCATIONAL HINT */}
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0, lineHeight: 1.5 }}>
             When two sound waves of slightly different frequencies interfere, they alternate between constructive and destructive interference. This creates an "envelope" that makes the volume pulse at the <strong>Beat Frequency</strong>.
          </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas ref={canvasRef} width={1200} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
         
         {/* ABSOLUTE LABELS */}
         <div style={{ position: 'absolute', top: 20, left: 20, color: '#00e5ff', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
            SOURCE 1 (f₁ = {freq1} Hz)
         </div>
         <div style={{ position: 'absolute', top: '34%', left: 20, color: '#facc15', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
            SOURCE 2 (f₂ = {freq2} Hz)
         </div>
         <div style={{ position: 'absolute', top: '68%', left: 20, color: '#a855f7', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
            SUPERPOSITION WITH ENVELOPE (f_beat = {beatFreq} Hz)
         </div>
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '100px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val.toFixed(step < 1 ? 2 : 0)} {unit}</span>
  </div>
);

const hudRowStyle = {
  display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#aaa'
};

export default AcousticBeats;
