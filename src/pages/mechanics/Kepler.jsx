import React, { useState, useEffect, useRef } from 'react';

const KeplerLab = () => {
  // --- CONFIG ---
  const DT = 0.05;
  const SCALE = 200; // Visual scale
  const SLICE_DURATION = 1.5; // How often to capture a "wedge" (in simulation time)

  // --- STATE ---
  const [eccentricity, setEccentricity] = useState(0.6);
  const [speed, setSpeed] = useState(1.0);
  const [showSectors, setShowSectors] = useState(true);
  
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sectors, setSectors] = useState([]); // Array of { startAngle, endAngle }
  const [history, setHistory] = useState([]); // Velocity graph data

  const requestRef = useRef();
  const lastSliceTime = useRef(0);
  const currentSliceStart = useRef(0); // Angle where current slice started

  // --- PHYSICS ENGINE ---
  // Newton-Raphson solver for Kepler's Equation: M = E - e*sin(E)
  const solveKepler = (M, e) => {
    let E = M;
    for (let i = 0; i < 5; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  };

  // State Calculation
  const calculateState = (time) => {
    // Mean Anomaly (M) grows linearly with time
    const M = time; 
    const E = solveKepler(M, eccentricity);
    
    // True Anomaly (nu) - Angle from focus
    const cosNu = (Math.cos(E) - eccentricity) / (1 - eccentricity * Math.cos(E));
    const sinNu = (Math.sqrt(1 - eccentricity*eccentricity) * Math.sin(E)) / (1 - eccentricity * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Radius (r)
    const a = 1; // Normalized semi-major axis
    const r = (a * (1 - eccentricity*eccentricity)) / (1 + eccentricity * Math.cos(nu));

    // Velocity (Vis-viva proportional)
    const v = Math.sqrt(2/r - 1/a);

    return { r, nu, v, E };
  };

  // Current State
  const state = calculateState(t);

  // --- ANIMATION LOOP ---
  const animate = () => {
    setT(prev => {
      const nextT = prev + (DT * speed);
      
      // Handle Sector Generation
      if (nextT - lastSliceTime.current > SLICE_DURATION) {
        // Complete the previous slice
        const start = currentSliceStart.current;
        const end = calculateState(nextT).nu;
        
        // Add to list (max 6 slices)
        setSectors(prevSectors => {
          const newSectors = [...prevSectors, { start, end }];
          if (newSectors.length > 6) newSectors.shift();
          return newSectors;
        });

        // Start new slice
        lastSliceTime.current = nextT;
        currentSliceStart.current = end;
      }

      return nextT;
    });

    setHistory(prev => {
      const point = { val: state.v };
      const newHist = [...prev, point];
      if (newHist.length > 200) newHist.shift();
      return newHist;
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, speed, eccentricity, state.v]);

  // Reset Logic
  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setSectors([]);
    setHistory([]);
    lastSliceTime.current = 0;
    currentSliceStart.current = 0;
  };

  // --- RENDER HELPERS ---
  const CX = 450;
  const CY = 250;
  const A_PX = 1.2 * SCALE; // Semi-major axis in pixels
  const B_PX = A_PX * Math.sqrt(1 - eccentricity*eccentricity);
  const FOCUS_OFFSET = A_PX * eccentricity; // Distance from center to sun

  // Convert polar (r, nu) to Cartesian relative to SVG center
  // Note: Sun is at Focus, not center of ellipse.
  // Standard ellipse center is (CX, CY). Focus is at (CX + c, CY).
  // But simulation calculates r from focus.
  const getPos = (r, nu) => ({
    x: CX + FOCUS_OFFSET + (r * A_PX * Math.cos(nu)),
    y: CY + (r * A_PX * Math.sin(nu))
  });

  const planetPos = getPos(state.r, state.nu);
  const sunPos = { x: CX + FOCUS_OFFSET, y: CY };

  // Generate Wedge Path for "Equal Areas"
  const getSectorPath = (startAngle, endAngle) => {
    // We need to trace the ellipse edge between angles
    // Simple approach: Triangle fan or arc approximation. 
    // Since it's an ellipse, we calculate points along the edge.
    let d = `M ${sunPos.x} ${sunPos.y} `;
    
    // Steps for smoothness
    const steps = 10;
    for(let i=0; i<=steps; i++) {
      const ang = startAngle + (endAngle - startAngle) * (i/steps);
      // Re-calculate r for this angle
      const r = (1 * (1 - eccentricity*eccentricity)) / (1 + eccentricity * Math.cos(ang));
      const px = sunPos.x + r * A_PX * Math.cos(ang);
      const py = sunPos.y + r * A_PX * Math.sin(ang);
      d += `L ${px} ${py} `;
    }
    d += "Z";
    return d;
  };

  // Graph Path
  const getGraphPath = () => {
    if (history.length < 2) return "";
    const h = 150; const w = 300;
    const maxV = 2.5; // Approx max velocity for e=0.8
    const minV = 0.5;
    return history.map((p, i) => {
      const x = (i / 200) * w;
      const normV = (p.val - minV) / (maxV - minV);
      const y = h - (normV * h); 
      return `${i===0?"M":"L"} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>ORBITAL MECHANICS</h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize:'13px' }}>PARAMETERS</h4>
          
          <ControlRow label="Eccentricity (e)" val={eccentricity} min={0} max={0.85} step={0.01} set={(v)=>{setEccentricity(v); handleReset();}} color="#fff" />
          <ControlRow label="Sim Speed" val={speed} min={0.1} max={3.0} step={0.1} set={setSpeed} color="#888" />
          
          <label style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'15px', cursor:'pointer'}}>
             <input type="checkbox" checked={showSectors} onChange={e => setShowSectors(e.target.checked)} />
             <span style={{fontSize:'11px', color:'#00e5ff'}}>Show Equal Area Sweeps</span>
          </label>
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START ORBIT"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <DataRow label="Distance (r)" val={state.r.toFixed(2)} unit="AU" color="#fff" />
           <DataRow label="Velocity (v)" val={state.v.toFixed(2)} unit="km/s" color="#00e676" bold />
           <div style={{fontSize:'10px', color:'#666', marginTop:'10px', fontStyle:'italic'}}>
             Notice: Planet moves faster when closer to the star (Perihelion).
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* UPPER: ORBIT VIEW */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0b0d' }}>
           <svg width="100%" height="100%" viewBox="0 0 900 500">
             <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <marker id="head-green" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e676"/></marker>
                <radialGradient id="sunGrad">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
             </defs>

             {/* GRID */}
             <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
             </pattern>
             <rect width="100%" height="100%" fill="url(#grid)" />

             {/* ORBIT PATH (ELLIPSE) */}
             <ellipse 
               cx={CX} cy={CY} 
               rx={A_PX} ry={B_PX} 
               fill="none" stroke="#333" strokeWidth="2" strokeDasharray="5,5" 
             />

             {/* EQUAL AREA SECTORS */}
             {showSectors && sectors.map((s, i) => (
                <path 
                  key={i} 
                  d={getSectorPath(s.start, s.end)} 
                  fill="rgba(0, 229, 255, 0.15)" 
                  stroke="none" 
                />
             ))}
             {/* Current Sweeping Sector */}
             {showSectors && isRunning && (
                <path 
                  d={getSectorPath(currentSliceStart.current, state.nu)} 
                  fill="rgba(0, 229, 255, 0.3)" 
                  stroke="#00e5ff" strokeWidth="1"
                />
             )}

             {/* SUN (Focus) */}
             <circle cx={sunPos.x} cy={sunPos.y} r={15} fill="url(#sunGrad)" filter="url(#glow)" />
             
             {/* PLANET */}
             <g transform={`translate(${planetPos.x}, ${planetPos.y})`}>
                <circle r={8} fill="#00e5ff" stroke="#fff" strokeWidth="2" filter="url(#glow)" />
                
                {/* Velocity Vector (Tangent) */}
                {/* Tangent angle approximation or calc from state derivative */}
                {/* Perpendicular to radius is approx, but for visual effect on ellipse: */}
                {/* Real velocity vector calc is complex in 2D from polar. Simplified visual: */}
                {(() => {
                   // Visual tangent: 90 deg from radius vector? No, tangent to ellipse.
                   // Tangent angle psi: tan(psi) = (e sin nu) / (1 + e cos nu) (flight path angle)
                   // Angle of velocity vector = nu + 90 + psi.
                   const psi = Math.atan( (eccentricity * Math.sin(state.nu)) / (1 + eccentricity * Math.cos(state.nu)) );
                   const vAngle = state.nu + (Math.PI/2) + psi;
                   
                   return (
                     <line 
                       x1="0" y1="0" 
                       x2={state.v * 40 * Math.cos(vAngle)} 
                       y2={state.v * 40 * Math.sin(vAngle)} 
                       stroke="#00e676" strokeWidth="2" markerEnd="url(#head-green)"
                     />
                   );
                })()}
             </g>

             {/* LABELS */}
             <text x={sunPos.x} y={sunPos.y + 30} fill="#facc15" fontSize="10" textAnchor="middle">SUN (FOCUS)</text>
             <text x={planetPos.x + 15} y={planetPos.y - 15} fill="#00e5ff" fontSize="10">PLANET</text>

           </svg>
        </div>

        {/* LOWER: VELOCITY GRAPH */}
        <div style={{ height: '180px', background: '#111', borderTop: '1px solid #333', padding: '10px' }}>
           <div style={{ fontSize:'10px', color:'#888', marginBottom:'5px', display:'flex', justifyContent:'space-between' }}>
              <span style={{color:'#00e676'}}>── Orbital Velocity Magnitude</span>
              <span>Time ➝</span>
           </div>
           
           <svg width="100%" height="100%">
             {/* Grid */}
             <line x1="0" y1="20" x2="100%" y2="20" stroke="#222" strokeWidth="1" />
             <line x1="0" y1="130" x2="100%" y2="130" stroke="#222" strokeWidth="1" />
             
             {/* Graph Line */}
             <path d={getGraphPath()} stroke="#00e676" strokeWidth="2" fill="none" filter="url(#glow)" />
             
             {/* Current Indicator dot */}
             {history.length > 0 && (
                <circle 
                  cx={(history.length-1)/200 * 300} 
                  cy={150 - ((history[history.length-1].val - 0.5) / 2.0)*150} 
                  r="3" fill="#fff" 
                />
             )}
           </svg>
        </div>

      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '90px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '40px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

const DataRow = ({ label, val, unit, color='#aaa', bold=false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color }}>
    <span>{label}</span>
    <span style={{ fontWeight: bold ? 'bold' : 'normal', color: bold ? color : '#fff' }}>{val} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '10px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default KeplerLab;