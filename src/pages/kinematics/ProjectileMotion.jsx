import React, { useState, useEffect, useRef } from 'react';

const ProjectileMotion = () => {
  // --- CONFIG ---
  const DT = 0.05; // Time step
  const SCALE = 10; // Pixels per meter (Zoom level)

  // --- STATE ---
  const [v0, setV0] = useState(25);
  const [angle, setAngle] = useState(45);
  const [y0, setY0] = useState(0); 
  const [g, setG] = useState(9.8);
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // To track path
  const [pathPoints, setPathPoints] = useState([]);

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const vx0 = v0 * Math.cos(toRad(angle));
  const vy0 = v0 * Math.sin(toRad(angle));

  // Current State
  const x = vx0 * t;
  const y = y0 + vy0 * t - 0.5 * g * t * t;
  const vx = vx0;
  const vy = vy0 - g * t;
  const vTotal = Math.sqrt(vx*vx + vy*vy);

  // Animation Loop
  const animate = () => {
    // Stop if ground collision
    if (y < 0 && t > 0.1) { 
      setIsRunning(false); 
      return; 
    }

    setT(prev => prev + DT);
    setPathPoints(prev => [...prev, { x, y }]);
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, y]); 

  const handleFire = () => {
    setT(0);
    setPathPoints([]);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setPathPoints([]);
  };

  // --- SVG HELPERS ---
  // Origin is at (50, 500) inside the SVG
  const ORIGIN_X = 50;
  const ORIGIN_Y = 500;

  const toSVG = (physX, physY) => ({
    x: ORIGIN_X + physX * SCALE,
    y: ORIGIN_Y - physY * SCALE 
  });

  const generatePathD = () => {
    if (pathPoints.length === 0) return "";
    return pathPoints.map((p, i) => {
      const pos = toSVG(p.x, p.y);
      return `${i===0 ? "M" : "L"} ${pos.x} ${pos.y}`;
    }).join(" ");
  };

  const currentPos = toSVG(x, y);
  const launchPos = toSVG(0, y0);
  const V_SCALE = 2; // Scale vectors for visibility

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>PROJECTILE LAB</h2>

        {/* INPUTS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15' }}>LAUNCH SETTINGS</h4>
          <ControlRow label="Speed (v₀)" val={v0} min={1} max={50} set={setV0} unit="m/s" />
          <ControlRow label="Angle (θ)" val={angle} min={0} max={90} set={setAngle} unit="°" />
          <ControlRow label="Height (y₀)" val={y0} min={0} max={100} set={setY0} unit="m" />
          <ControlRow label="Gravity (g)" val={g} min={1} max={20} step={0.1} set={setG} unit="m/s²" />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleFire} style={btnStyle(true, '#facc15')}>FIRE</button>
          <button onClick={() => setIsRunning(false)} style={btnStyle(false)}>PAUSE</button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* LIVE DATA HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>REAL-TIME DATA (t = {t.toFixed(2)}s)</div>
          
          <DataRow label="Range (x)" val={x.toFixed(2)} unit="m" color="#fff" />
          <DataRow label="Height (y)" val={y.toFixed(2)} unit="m" color="#fff" />
          <div style={{ height: '1px', background: '#333', margin: '5px 0' }} />
          <DataRow label="Vel X" val={vx.toFixed(2)} unit="m/s" color="#3b82f6" />
          <DataRow label="Vel Y" val={vy.toFixed(2)} unit="m/s" color="#ef4444" />
        </div>

        {/* PREDICTION BOX */}
        <div style={{ marginTop: '20px', padding: '10px', border: '1px dashed #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#666' }}>CALCULATED MAX RANGE (y₀=0)</div>
          <div style={{ fontSize: '16px', color: '#888', fontWeight: 'bold' }}>
            {((v0*v0*Math.sin(toRad(2*angle)))/g).toFixed(2)} m
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        <svg width="100%" height="100%" style={{ background: '#000' }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="head-3b82f6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#3b82f6"/></marker>
            <marker id="head-ef4444" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#ef4444"/></marker>
            <marker id="head-f97316" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#f97316"/></marker>
          </defs>

          {/* GRID & AXIS NUMBERS */}
          <g>
             {/* Vertical Lines (X-Axis) */}
             {Array.from({ length: 40 }).map((_, i) => {
               const val = i * 10; // Every 10 meters
               const pos = ORIGIN_X + val * SCALE;
               return (
                 <g key={`v${i}`}>
                   <line x1={pos} y1={0} x2={pos} y2="100%" stroke="#222" strokeWidth="1" />
                   {/* X-Axis Numbers */}
                   <text x={pos} y={ORIGIN_Y + 15} fill="#555" fontSize="10" textAnchor="middle">{val}</text>
                 </g>
               );
             })}

             {/* Horizontal Lines (Y-Axis) */}
             {Array.from({ length: 30 }).map((_, i) => {
               const val = i * 10; // Every 10 meters
               const pos = ORIGIN_Y - val * SCALE;
               return (
                 <g key={`h${i}`}>
                   <line x1={0} y1={pos} x2="100%" y2={pos} stroke="#222" strokeWidth="1" />
                   {/* Y-Axis Numbers */}
                   <text x={ORIGIN_X - 8} y={pos + 3} fill="#555" fontSize="10" textAnchor="end">{val}</text>
                 </g>
               );
             })}

             {/* Main Axes */}
             <line x1={ORIGIN_X} y1={0} x2={ORIGIN_X} y2="100%" stroke="#666" strokeWidth="2" />
             <line x1={0} y1={ORIGIN_Y} x2="100%" y2={ORIGIN_Y} stroke="#666" strokeWidth="2" />
             <text x={ORIGIN_X - 15} y={ORIGIN_Y + 15} fill="#fff" fontSize="10">0</text>
          </g>

          {/* CANNON */}
          <g transform={`translate(${launchPos.x}, ${launchPos.y}) rotate(${-angle})`}>
            <rect x="-10" y="-10" width="40" height="20" fill="#333" stroke="#666" />
            <circle cx="0" cy="0" r="12" fill="#222" stroke="#666" />
          </g>
          {y0 > 0 && <line x1={launchPos.x} y1={launchPos.y} x2={launchPos.x} y2={ORIGIN_Y} stroke="#666" strokeDasharray="4,4" />}

          {/* PATH & BALL */}
          <path d={generatePathD()} stroke="#facc15" strokeWidth="2" fill="none" filter="url(#glow)" opacity="0.6" />

          <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
            <circle cx="0" cy="0" r="6" fill="#fff" filter="url(#glow)" />
            {/* Vectors */}
            <line x1="0" y1="0" x2={vx * V_SCALE} y2="0" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#head-3b82f6)" />
            <line x1="0" y1="0" x2="0" y2={-vy * V_SCALE} stroke="#ef4444" strokeWidth="2" markerEnd="url(#head-ef4444)" />
            <line x1="0" y1="0" x2="0" y2={g * V_SCALE * 0.5} stroke="#f97316" strokeWidth="2" markerEnd="url(#head-f97316)" opacity="0.7" />
          </g>

          {/* LEGEND */}
          <g transform="translate(60, 20)">
            <VectorLegend color="#3b82f6" label="Velocity X" />
            <VectorLegend color="#ef4444" label="Velocity Y" y={20} />
            <VectorLegend color="#f97316" label="Acceleration (g)" y={40} />
          </g>

        </svg>

      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const VectorLegend = ({ color, label, y=0 }) => (
  <g transform={`translate(0, ${y})`}>
    <line x1="0" y1="0" x2="20" y2="0" stroke={color} strokeWidth="2" markerEnd={`url(#head-${color.replace('#','')})`} />
    <text x="30" y="4" fill="#aaa" fontSize="10">{label}</text>
  </g>
);

const ControlRow = ({ label, val, min, max, step=1, set, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '80px', fontSize: '11px', color: '#888' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px' }} />
    <span style={{ width: '40px', fontSize: '10px', color: '#fff', textAlign: 'right' }}>{val}{unit}</span>
  </div>
);

const DataRow = ({ label, val, unit, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: color }}>
    <span>{label}</span>
    <span style={{ fontWeight:'bold' }}>{val} {unit}</span>
  </div>
);

const btnStyle = (primary, color='#fff') => ({
  flex: 1, padding: '10px', 
  background: primary ? 'rgba(255,255,255,0.1)' : 'transparent',
  border: '1px solid', borderColor: primary ? color : '#333',
  color: primary ? color : '#888', 
  borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default ProjectileMotion;