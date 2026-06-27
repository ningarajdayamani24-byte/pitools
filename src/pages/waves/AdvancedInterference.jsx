import React, { useState, useEffect, useRef } from 'react';

const AdvancedInterference = () => {
  // --- STATE (UI Controls) ---
  const [numSources, setNumSources] = useState(2);
  const [separation, setSeparation] = useState(100); // Distance between S1 and S2
  const [wavelength, setWavelength] = useState(30);  // Lambda
  const [phaseDiff, setPhaseDiff] = useState(0);     // Degrees
  const [viewMode, setViewMode] = useState('realtime'); // 'realtime' or 'intensity'
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);

  // --- REFS (High-Performance Engine) ---
  const canvasRef = useRef(null);
  const bufferCanvasRef = useRef(null);
  const imgDataRef = useRef(null);
  const mousePosRef = useRef({ x: -1000, y: -1000 }); // Stores mouse position for the probe

  // Physics State
  const isRunningRef = useRef(true);
  const sim = useRef({ t: 0, lastFrameTime: performance.now() });

  const params = useRef({ numSources, separation, wavelength, phaseDiff, viewMode, simSpeed });
  useEffect(() => {
    params.current = { numSources, separation, wavelength, phaseDiff, viewMode, simSpeed };
  }, [numSources, separation, wavelength, phaseDiff, viewMode, simSpeed]);

  // --- SCENE CONSTANTS ---
  const DISPLAY_W = 1200;
  const DISPLAY_H = 800;
  
  // COMPUTE RESOLUTION (Lower than display for 60fps performance)
  // We calculate 300x200 = 60,000 pixels per frame, then scale it up using GPU acceleration
  const COMPUTE_W = 300; 
  const COMPUTE_H = 200;
  const SCALE = DISPLAY_W / COMPUTE_W; // 4x scale

  // Set up the hidden pixel buffer once on mount
  useEffect(() => {
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = COMPUTE_W;
    bufferCanvas.height = COMPUTE_H;
    bufferCanvasRef.current = bufferCanvas;
    
    const bufferCtx = bufferCanvas.getContext('2d');
    imgDataRef.current = bufferCtx.createImageData(COMPUTE_W, COMPUTE_H);
  }, []);

  // --- MASTER ANIMATION LOOP ---
  useEffect(() => {
    let animationId;

    const renderFrame = (time) => {
      if (!canvasRef.current || !bufferCanvasRef.current || !imgDataRef.current) {
        animationId = requestAnimationFrame(renderFrame);
        return;
      }

      const ctx = canvasRef.current.getContext('2d');
      const bufferCtx = bufferCanvasRef.current.getContext('2d');
      const { numSources, separation, wavelength, phaseDiff, viewMode, simSpeed } = params.current;
      
      const dt = Math.min((time - sim.current.lastFrameTime) / 1000, 0.05); 
      sim.current.lastFrameTime = time;

      if (isRunningRef.current) {
        sim.current.t += dt * simSpeed * 5; // Multiplier for visual speed
      }

      const t = sim.current.t;
      const k = (2 * Math.PI) / wavelength; // Wave number
      const omega = 2 * Math.PI; // Angular frequency (normalized)
      const phaseRad = (phaseDiff * Math.PI) / 180;

      // Source positions (in compute coordinates)
      const centerY = COMPUTE_H / 2;
      const s1x = COMPUTE_W / 2;
      const s1y = numSources === 2 ? centerY - (separation / 2) : centerY;
      const s2x = COMPUTE_W / 2;
      const s2y = centerY + (separation / 2);

      // --- PIXEL CRUNCHING LOOP (60,000 pixels) ---
      const data = imgDataRef.current.data;
      let idx = 0;

      for (let y = 0; y < COMPUTE_H; y++) {
        for (let x = 0; x < COMPUTE_W; x++) {
          
          // Distance to sources
          const dx1 = x - s1x; const dy1 = y - s1y;
          const r1 = Math.sqrt(dx1*dx1 + dy1*dy1);
          
          let z = 0;
          let env = 0;

          if (numSources === 1) {
            z = Math.sin(k * r1 - omega * t);
            env = 1; // Constant intensity for 1 source
          } else {
            const dx2 = x - s2x; const dy2 = y - s2y;
            const r2 = Math.sqrt(dx2*dx2 + dy2*dy2);

            if (viewMode === 'realtime') {
              // Real-time moving ripples
              const z1 = Math.sin(k * r1 - omega * t);
              const z2 = Math.sin(k * r2 - omega * t + phaseRad);
              z = z1 + z2; // Range: -2 to 2
            } else {
              // Time-Averaged Intensity (Envelope Math)
              // E = 2 * cos( [k(r1-r2) - phi] / 2 )
              env = Math.abs(2 * Math.cos((k * (r1 - r2) - phaseRad) / 2));
            }
          }

          // --- COLOR MAPPING ---
          if (viewMode === 'realtime') {
             const val = z / 2; // Normalize to -1 to 1
             if (val > 0) {
                // Crests: Black to Cyan
                data[idx++] = 0;
                data[idx++] = 229 * val;
                data[idx++] = 255 * val;
             } else {
                // Troughs: Black to Purple
                data[idx++] = 168 * (-val);
                data[idx++] = 85 * (-val);
                data[idx++] = 247 * (-val);
             }
             data[idx++] = 255; // Alpha
          } else {
             // Intensity Mode: Black to Bright Green
             const val = env / 2; // Normalize to 0 to 1
             data[idx++] = 0;
             data[idx++] = 230 * val; // Green
             data[idx++] = 118 * val; // Lime tone
             data[idx++] = 255;
          }
        }
      }

      // Paint compute buffer to hidden canvas
      bufferCtx.putImageData(imgDataRef.current, 0, 0);

      // Draw hidden canvas to main canvas (Scaling it up via GPU)
      ctx.imageSmoothingEnabled = true; // Blurs pixels nicely for waves
      ctx.drawImage(bufferCanvasRef.current, 0, 0, DISPLAY_W, DISPLAY_H);

      // --- OVERLAYS & INTERACTIVE PROBE ---
      
      // Draw Source Points
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
      ctx.beginPath(); ctx.arc(s1x * SCALE, s1y * SCALE, 6, 0, Math.PI*2); ctx.fill();
      if (numSources === 2) {
         ctx.beginPath(); ctx.arc(s2x * SCALE, s2y * SCALE, 6, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw Probe if mouse is over canvas
      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;
      
      if (mx > 0 && mx < DISPLAY_W && my > 0 && my < DISPLAY_H && numSources === 2) {
         const ds1x = mx - (s1x * SCALE); const ds1y = my - (s1y * SCALE);
         const dist1 = Math.sqrt(ds1x*ds1x + ds1y*ds1y) / SCALE; // Convert back to physical units
         
         const ds2x = mx - (s2x * SCALE); const ds2y = my - (s2y * SCALE);
         const dist2 = Math.sqrt(ds2x*ds2x + ds2y*ds2y) / SCALE;

         const pathDiff = Math.abs(dist1 - dist2);
         const ratio = pathDiff / wavelength;
         
         // Probe Target Ring
         ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
         ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI*2); ctx.stroke();
         ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI*2); ctx.stroke();

         // Laser lines to sources
         ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
         ctx.beginPath();
         ctx.moveTo(s1x * SCALE, s1y * SCALE); ctx.lineTo(mx, my);
         ctx.moveTo(s2x * SCALE, s2y * SCALE); ctx.lineTo(mx, my);
         ctx.stroke();
         ctx.setLineDash([]);

         // Info Box
         const boxW = 200; const boxH = 80;
         let boxX = mx + 20; let boxY = my - 40;
         if (boxX + boxW > DISPLAY_W) boxX = mx - boxW - 20; // Keep on screen
         
         ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
         ctx.fillRect(boxX, boxY, boxW, boxH);
         ctx.strokeRect(boxX, boxY, boxW, boxH);

         ctx.fillStyle = '#aaa'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
         ctx.fillText(`r₁ : ${(dist1).toFixed(1)} px`, boxX + 10, boxY + 20);
         ctx.fillText(`r₂ : ${(dist2).toFixed(1)} px`, boxX + 10, boxY + 38);
         
         ctx.fillStyle = '#fff';
         ctx.fillText(`Δr : ${(pathDiff).toFixed(1)} px = ${ratio.toFixed(2)}λ`, boxX + 10, boxY + 58);

         // Determine Node or Antinode
         const isNode = Math.abs(ratio - Math.round(ratio)) > 0.4; 
         ctx.fillStyle = isNode ? '#ef4444' : '#00e676';
         ctx.fillText(isNode ? 'NODE (Cancellation)' : 'ANTINODE (Maximum)', boxX + 10, boxY + 75);
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

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '380px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto', zIndex: 10 }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
          2D RIPPLE TANK
        </h2>

        {/* VIEW MODE TOGGLE */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
           <button 
             onClick={() => setViewMode('realtime')}
             style={{...btnStyle(viewMode === 'realtime'), flex: 1, borderColor: viewMode==='realtime'?'#00e5ff':'#333', color: viewMode==='realtime'?'#00e5ff':'#888'}}
           >
             REAL-TIME WAVES
           </button>
           <button 
             onClick={() => setViewMode('intensity')}
             style={{...btnStyle(viewMode === 'intensity'), flex: 1, borderColor: viewMode==='intensity'?'#00e676':'#333', color: viewMode==='intensity'?'#00e676':'#888'}}
           >
             TIME-AVERAGED INTENSITY
           </button>
        </div>

        {/* SYSTEM CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #a855f7' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#a855f7', fontSize:'13px' }}>PHYSICS PARAMETERS</h4>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ width: '120px', fontSize: '11px', color: '#ccc' }}>Active Sources</span>
            <button onClick={()=>setNumSources(1)} style={{...btnStyle(numSources===1), padding:'6px', flex:1, marginRight:'5px'}}>1</button>
            <button onClick={()=>setNumSources(2)} style={{...btnStyle(numSources===2), padding:'6px', flex:1}}>2</button>
          </div>

          <ControlRow label="Wavelength (λ)" val={wavelength} min={10} max={60} step={1} set={setWavelength} color="#00e5ff" unit="px" />
          
          {numSources === 2 && (
            <>
              <ControlRow label="Source Separation" val={separation} min={20} max={180} step={5} set={setSeparation} color="#facc15" unit="px" />
              <ControlRow label="Phase Diff (Δφ)" val={phaseDiff} min={0} max={180} step={15} set={setPhaseDiff} color="#ef4444" unit="°" />
            </>
          )}
        </div>

        {/* PLAYBACK */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #888' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize:'13px' }}>SIMULATION</h4>
          <ControlRow label="Time Speed" val={simSpeed} min={0.1} max={3.0} step={0.1} set={setSimSpeed} color="#888" unit="x" />
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleTogglePlay} style={{...btnStyle(isRunning), width: '100%', padding: '10px'}}>
              {isRunning ? "PAUSE WAVES" : "RESUME WAVES"}
            </button>
          </div>
        </div>

        {/* EDUCATIONAL INSTRUCTIONS */}
        <div style={{ padding: '15px', border: '1px solid #333', borderRadius: '4px', background: '#0a0a0c' }}>
           <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize:'12px' }}>INTERACTIVE PROBE</h4>
           <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>
             Hover your mouse over the water tank!<br/><br/>
             If the path difference (<strong style={{color:'#fff'}}>Δr = |r₁ - r₂|</strong>) is a whole number of wavelengths (<strong style={{color:'#00e676'}}>nλ</strong>), waves arrive in-sync (Antinode).<br/><br/>
             If it is a half-number (<strong style={{color:'#ef4444'}}>(n+0.5)λ</strong>), waves arrive out-of-sync and cancel perfectly (Node).
           </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
         <canvas 
           ref={canvasRef} 
           width={DISPLAY_W} 
           height={DISPLAY_H} 
           onMouseMove={handleMouseMove}
           onMouseLeave={handleMouseLeave}
           style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} 
         />
      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
    <span style={{ width: '120px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '45px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val.toFixed(0)} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s'
});

export default AdvancedInterference;
