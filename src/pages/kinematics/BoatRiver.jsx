import React, { useState, useEffect, useRef } from 'react';

const BoatRiver = () => {
  // --- CONFIG ---
  const RIVER_WIDTH = 100; // meters
  const SCALE = 3.5; // pixels per meter
  const DT = 0.05;

  // --- STATE ---
  const [vBoat, setVBoat] = useState(5); // m/s
  const [vRiver, setVRiver] = useState(3); // m/s
  const [angle, setAngle] = useState(0); // degrees (0 = straight across)
  
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // For flow animation
  const [flowOffset, setFlowOffset] = useState(0);

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180; // 0deg is UP (90 math deg)

  // 1. Boat Vector (relative to water)
  // We treat 0deg as "Straight Across" (Up in SVG). Positive is Left (Upstream), Negative is Right (Downstream)
  // So: Angle 0 => Vx=0, Vy=5. Angle 30 => Vx = -5sin(30), Vy = 5cos(30)
  const vb_x = -vBoat * Math.sin((angle * Math.PI) / 180);
  const vb_y = vBoat * Math.cos((angle * Math.PI) / 180);

  // 2. River Vector (relative to ground)
  const vr_x = vRiver; // Always flows right
  const vr_y = 0;

  // 3. Resultant Vector (relative to ground)
  const v_total_x = vb_x + vr_x;
  const v_total_y = vb_y + vr_y;

  // Position
  const posX = v_total_x * t;
  const posY = v_total_y * t;

  // "Ghost" Position (If there was no river)
  const ghostX = vb_x * t;
  const ghostY = vb_y * t;

  // Time to cross
  const timeToCross = RIVER_WIDTH / v_total_y;
  const drift = v_total_x * timeToCross;

  // --- ANIMATION LOOP ---
  const animate = () => {
    // Stop if across
    if (posY >= RIVER_WIDTH) {
      setIsRunning(false);
      return;
    }

    setT(prev => prev + DT);
    setFlowOffset(prev => (prev + vRiver * DT * SCALE) % 50); // Loop flow texture
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, posY, vRiver]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
  };

  // --- SVG HELPERS ---
  const ORIGIN_X = 450; // Center screen horizontally
  const ORIGIN_Y = 400; // Bottom bank

  const toSVG = (x, y) => ({
    x: ORIGIN_X + x * SCALE,
    y: ORIGIN_Y - y * SCALE
  });

  const boatPos = toSVG(posX, posY);
  const ghostPos = toSVG(ghostX, ghostY);
  
  // Vector visualization scaling
  const V_SCALE = 15; 

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>RELATIVE VELOCITY LAB</h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize:'13px' }}>PARAMETERS</h4>
          
          <ControlRow label="River Flow (Vr)" val={vRiver} min={0} max={10} set={setVRiver} color="#ef4444" unit="m/s" />
          <ControlRow label="Boat Speed (Vb)" val={vBoat} min={1} max={10} set={setVBoat} color="#22c55e" unit="m/s" />
          <ControlRow label="Aim Angle" val={angle} min={-60} max={60} set={setAngle} color="#fff" unit="°" />
          <p style={{ fontSize: '10px', color: '#666', marginTop:'5px' }}>Positive Angle = Upstream (Left)</p>
        </div>

        {/* PREDICTIONS */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>CALCULATED RESULTS</div>
          
          <DataRow label="Crossing Time" val={(posY >= RIVER_WIDTH ? t : timeToCross).toFixed(2)} unit="s" />
          <DataRow label="Total Drift" val={(posY >= RIVER_WIDTH ? posX : drift).toFixed(2)} unit="m" />
          <DataRow label="Resultant Speed" val={Math.hypot(v_total_x, v_total_y).toFixed(2)} unit="m/s" />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "GO"}
          </button>
          <button onClick={handleReset} style={{...btnStyle(false), borderColor: '#fff', color: '#fff'}}>
            RESET
          </button>
        </div>

        {/* LEGEND */}
        <div style={{ padding: '10px', background: '#111', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>VECTOR LEGEND</div>
          <LegendItem color="#22c55e" label="Boat Velocity (Input)" />
          <LegendItem color="#ef4444" label="River Velocity (Flow)" />
          <LegendItem color="#fff" label="Resultant (Actual Path)" />
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        <svg width="100%" height="100%" style={{ background: '#000' }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <pattern id="water" x={flowOffset} y="0" width="50" height="20" patternUnits="userSpaceOnUse">
               <path d="M 0 10 Q 12 5 25 10 T 50 10" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
            </pattern>
            <marker id="head-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#22c55e"/></marker>
            <marker id="head-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#ef4444"/></marker>
            <marker id="head-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#fff"/></marker>
          </defs>

          {/* RIVER BACKGROUND */}
          <rect x="0" y={ORIGIN_Y - RIVER_WIDTH*SCALE} width="100%" height={RIVER_WIDTH*SCALE} fill="#0f172a" />
          <rect x="0" y={ORIGIN_Y - RIVER_WIDTH*SCALE} width="100%" height={RIVER_WIDTH*SCALE} fill="url(#water)" />

          {/* BANKS */}
          <rect x="0" y={ORIGIN_Y} width="100%" height="200" fill="#1a1a1a" /> {/* Bottom Bank */}
          <rect x="0" y={0} width="100%" height={ORIGIN_Y - RIVER_WIDTH*SCALE} fill="#1a1a1a" /> {/* Top Bank */}
          
          {/* Top Bank Ruler */}
          <g transform={`translate(${ORIGIN_X}, ${ORIGIN_Y - RIVER_WIDTH*SCALE})`}>
             <line x1="-1000" y1="0" x2="1000" y2="0" stroke="#444" strokeWidth="2" />
             {Array.from({ length: 41 }).map((_, i) => {
               const m = (i - 20) * 10;
               const px = m * SCALE;
               return (
                 <g key={i}>
                   <line x1={px} y1={0} x2={px} y2={-10} stroke="#666" />
                   <text x={px} y={-15} fill="#888" fontSize="10" textAnchor="middle">{m}</text>
                 </g>
               )
             })}
             <text x="0" y={-35} fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">DRIFT RULER (meters)</text>
          </g>

          {/* STARTING DOCK */}
          <rect x={ORIGIN_X - 15} y={ORIGIN_Y} width="30" height="20" fill="#333" stroke="#555" />

          {/* GHOST BOAT (Aim Visual) */}
          <g transform={`translate(${ghostPos.x}, ${ghostPos.y}) rotate(${-angle})`}>
            <path d="M 0 -15 L 8 10 L -8 10 Z" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
            <line x1="0" y1="0" x2="0" y2={-500} stroke="#22c55e" strokeDasharray="4,4" opacity="0.2" /> {/* Aim line */}
          </g>

          {/* REAL BOAT */}
          <g transform={`translate(${boatPos.x}, ${boatPos.y})`}>
            {/* The Hull */}
            <g transform={`rotate(${-angle})`}>
               <path d="M 0 -15 L 8 10 L -8 10 Z" fill="#fff" filter="url(#glow)" />
               {/* Boat Velocity Vector (Relative to Water) */}
               <line x1="0" y1="0" x2="0" y2={-vBoat * V_SCALE} stroke="#22c55e" strokeWidth="3" markerEnd="url(#head-green)" />
            </g>

            {/* River Velocity Vector (Applied to Boat) */}
            {/* We draw this starting from the tip of the Boat Vector to show head-to-tail addition */}
            <line 
              x1={vb_x * V_SCALE} y1={-vb_y * V_SCALE} 
              x2={(vb_x + vr_x) * V_SCALE} y2={(-vb_y - vr_y) * V_SCALE} 
              stroke="#ef4444" strokeWidth="2" markerEnd="url(#head-red)" 
            />

            {/* Resultant Vector (Total Velocity) */}
            <line 
              x1="0" y1="0" 
              x2={(vb_x + vr_x) * V_SCALE} y2={(-vb_y - vr_y) * V_SCALE} 
              stroke="#fff" strokeWidth="2" strokeDasharray="2,2" opacity="0.8" markerEnd="url(#head-white)"
            />
          </g>

        </svg>

      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ControlRow = ({ label, val, min, max, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '90px', fontSize: '11px', color: '#888' }}>{label}</span>
    <input type="range" min={min} max={max} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '40px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

const DataRow = ({ label, val, unit }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#ccc' }}>
    <span>{label}</span>
    <span style={{ fontWeight:'bold', color: '#fff' }}>{val} {unit}</span>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
    <div style={{ width: '12px', height: '2px', background: color, marginRight: '8px' }}></div>
    <span style={{ fontSize: '10px', color: '#aaa' }}>{label}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '10px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default BoatRiver;