import React, { useState, useEffect, useRef } from 'react';

const InclinePulley = () => {
  // --- CONFIG ---
  const DT = 0.016;
  const SCALE = 80; // Pixels per meter
  
  // --- STATE ---
  const [m1, setM1] = useState(6.0); // Hanging Mass
  const [m2, setM2] = useState(8.0); // Incline Mass
  const [theta, setTheta] = useState(30);
  const [muK, setMuK] = useState(0.2); 

  const [t, setT] = useState(0);
  const [pos, setPos] = useState(0); 
  const [vel, setVel] = useState(0);
  const [acc, setAcc] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const [history, setHistory] = useState([]); 

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const g = 9.8;
  const rad = (theta * Math.PI) / 180;

  // 1. Forces
  const W1 = m1 * g; 
  const W2 = m2 * g;
  const W2_para = W2 * Math.sin(rad); 
  const Normal = W2 * Math.cos(rad);
  const F_friction_mag = muK * Normal;

  // 2. Dynamics
  const F_drive = W1 - W2_para;
  
  let frictionVal = 0;
  if (Math.abs(vel) > 0.001) {
    frictionVal = -Math.sign(vel) * F_friction_mag;
  } else {
    // Static check 
    if (Math.abs(F_drive) > F_friction_mag) {
       frictionVal = -Math.sign(F_drive) * F_friction_mag;
    } else {
       frictionVal = -F_drive; 
    }
  }

  const currentAcc = (F_drive + frictionVal) / (m1 + m2);
  const Tension = W1 - (m1 * currentAcc);

  // --- ANIMATION ---
  const animate = () => {
    let newVel = vel + currentAcc * DT;
    let newPos = pos + newVel * DT;

    // Bounds: Stop if m1 hits floor (approx 3.5m drop) or m2 hits pulley
    if (newPos > 3.0) { setIsRunning(false); newPos = 3.0; newVel = 0; }
    if (newPos < -1.5) { setIsRunning(false); newPos = -1.5; newVel = 0; }

    setVel(newVel);
    setPos(newPos);
    setAcc(currentAcc);
    setT(prev => prev + DT);

    // Energy
    const KE = 0.5 * (m1 + m2) * newVel * newVel;
    const PE = -(m1 * g * newPos) + (m2 * g * newPos * Math.sin(rad));
    
    setHistory(prev => {
      const point = { t, ke: KE, pe: PE, total: KE + PE };
      const newHist = [...prev, point];
      if (newHist.length > 300) newHist.shift();
      return newHist;
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, currentAcc, vel]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setPos(0);
    setVel(0);
    setHistory([]);
  };

  // --- SCENE GEOMETRY ---
  // Adjusted for better visibility
  const PULLEY_X = 600;
  const PULLEY_Y = 180;
  const PULLEY_R = 25;
  const RAMP_LEN = 550;
  
  // Ramp Base points
  const rampBaseX = PULLEY_X - RAMP_LEN * Math.cos(rad);
  const rampBaseY = PULLEY_Y + RAMP_LEN * Math.sin(rad);

  // Mass 2 (Incline) Position
  const startDistM2 = 280; // Start 280px away from pulley
  const currentDistM2 = startDistM2 - pos * SCALE; 
  // We offset X/Y slightly to account for Pulley Radius so rope is tangent-ish
  const m2X = PULLEY_X - currentDistM2 * Math.cos(rad);
  const m2Y = PULLEY_Y + currentDistM2 * Math.sin(rad);

  // Mass 1 (Hanging) Position
  // It hangs off the right side of the pulley
  const m1X = PULLEY_X + PULLEY_R; 
  const m1Y_Start = PULLEY_Y + 80;
  const m1Y = m1Y_Start + pos * SCALE;

  // Graph Helper
  const getGraphPath = (key, h, w, maxVal) => {
    if (history.length < 2) return "";
    return history.map((p, i) => {
      const x = (i / 300) * w;
      const y = (h/2) - (p[key] / maxVal) * (h/2.5);
      return `${i===0?"M":"L"} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '380px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>SYSTEM TELEMETRY</h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize:'13px' }}>SETUP</h4>
          <ControlRow label="Mass 1 (Hanging)" val={m1} min={1} max={15} set={setM1} color="#00e5ff" unit="kg" />
          <ControlRow label="Mass 2 (Incline)" val={m2} min={1} max={15} set={setM2} color="#facc15" unit="kg" />
          <ControlRow label="Incline Angle" val={theta} min={0} max={60} set={setTheta} color="#fff" unit="°" />
          <ControlRow label="Friction (μk)" val={muK} min={0} max={1.0} step={0.01} set={setMuK} color="#888" />
        </div>

        {/* DATA PANELS */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
            <div style={{ background: '#111', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
               <div style={{fontSize:'12px', color:'#00e5ff', marginBottom:'5px', fontWeight:'bold'}}>M1 (HANGING)</div>
               <DataRow label="Weight (W1)" val={W1.toFixed(1)} unit="N" color="#ef4444" />
               <DataRow label="Tension (Up)" val={Tension.toFixed(1)} unit="N" color="#a855f7" />
            </div>
            <div style={{ background: '#111', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
               <div style={{fontSize:'12px', color:'#facc15', marginBottom:'5px', fontWeight:'bold'}}>M2 (INCLINE)</div>
               <DataRow label="Parallel Grav (W||)" val={W2_para.toFixed(1)} unit="N" color="#facc15" />
               <DataRow label="Friction (f)" val={Math.abs(frictionVal).toFixed(1)} unit="N" color="#ef4444" />
               <DataRow label="Tension (Pull)" val={Tension.toFixed(1)} unit="N" color="#a855f7" />
            </div>
            <div style={{ background: '#111', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
               <div style={{fontSize:'12px', color:'#fff', marginBottom:'5px', fontWeight:'bold'}}>SYSTEM</div>
               <DataRow label="Acceleration" val={acc.toFixed(2)} unit="m/s²" color="#00e5ff" bold />
               <DataRow label="Velocity" val={vel.toFixed(2)} unit="m/s" color="#fff" />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START SIMULATION"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* UPPER: ANIMATION */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0b0d' }}>
           <svg width="100%" height="100%" viewBox="0 0 950 600">
             <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <marker id="head-purple" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#a855f7"/></marker>
                <marker id="head-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#ef4444"/></marker>
                <marker id="head-yellow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#facc15"/></marker>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
                </pattern>
             </defs>

             {/* Background Grid */}
             <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />

             {/* RAMP (Triangle Wedge) */}
             <path 
               d={`M ${PULLEY_X} ${PULLEY_Y} L ${rampBaseX} ${rampBaseY} L ${PULLEY_X} ${rampBaseY} Z`} 
               fill="#161616" stroke="#333" strokeWidth="2" 
             />
             {/* Glowing Ramp Surface */}
             <line x1={PULLEY_X} y1={PULLEY_Y} x2={rampBaseX} y2={rampBaseY} stroke="#fff" strokeWidth="2" filter="url(#glow)" />
             
             {/* Ground Line */}
             <line x1={rampBaseX - 50} y1={rampBaseY} x2={PULLEY_X + 200} y2={rampBaseY} stroke="#444" strokeWidth="2" />

             {/* PULLEY WHEEL */}
             <circle cx={PULLEY_X} cy={PULLEY_Y} r={PULLEY_R} fill="#111" stroke="#fff" strokeWidth="2" />
             <circle cx={PULLEY_X} cy={PULLEY_Y} r={4} fill="#fff" />
             
             {/* ROPE */}
             {/* Segment 1: Incline (Tangent adjustment approximated) */}
             <line 
                x1={PULLEY_X - PULLEY_R * Math.sin(rad)} 
                y1={PULLEY_Y - PULLEY_R * Math.cos(rad)} 
                x2={m2X} y2={m2Y - 15 * Math.cos(rad)} // Connect to center of block face
                stroke="#a855f7" strokeWidth="3" 
             />
             {/* Segment 2: Hanging */}
             <line 
                x1={m1X} y1={PULLEY_Y} 
                x2={m1X} y2={m1Y} 
                stroke="#a855f7" strokeWidth="3" 
             />

             {/* MASS M2 (Incline Block) */}
             {/* Translate to position, then rotate to align with slope */}
             <g transform={`translate(${m2X}, ${m2Y}) rotate(${theta})`}>
                {/* Block Body (Width 60, Height 30) - Centered on bottom edge */}
                <rect x="-30" y="-30" width="60" height="30" fill="#111" stroke="#facc15" strokeWidth="2" filter="url(#glow)" />
                <text x="0" y="-10" fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="middle">m2</text>
                
                {/* Vectors (Local Coordinates) */}
                {/* Tension (Right) */}
                <line x1="30" y1="-15" x2={30 + Tension/2} y2="-15" stroke="#a855f7" strokeWidth="2" markerEnd="url(#head-purple)" />
                <text x={30 + Tension/2} y="-20" fill="#a855f7" fontSize="10">T</text>
                
                {/* Friction (Left or Right) */}
                {frictionVal !== 0 && (
                   <g>
                    <line x1="-30" y1="0" x2={-30 - (Math.sign(vel) * F_friction_mag)/2} y2="0" stroke="#ef4444" strokeWidth="2" markerEnd="url(#head-red)" />
                    <text x={-45} y="15" fill="#ef4444" fontSize="10">fk</text>
                   </g>
                )}
                
                {/* Gravity Parallel (Left) */}
                <line x1="0" y1="0" x2={-W2_para/2} y2="0" stroke="#facc15" strokeWidth="2" markerEnd="url(#head-yellow)" />
                <text x={-W2_para/2} y="15" fill="#facc15" fontSize="10">W||</text>
             </g>

             {/* MASS M1 (Hanging Block) */}
             <g transform={`translate(${m1X}, ${m1Y})`}>
                <rect x="-20" y="0" width="40" height="40" fill="#111" stroke="#00e5ff" strokeWidth="2" filter="url(#glow)" />
                <text x="0" y="25" fill="#00e5ff" fontSize="11" fontWeight="bold" textAnchor="middle">m1</text>
                
                {/* Vectors */}
                {/* Tension (Up) */}
                <line x1="0" y1="0" x2="0" y2={-Tension/2} stroke="#a855f7" strokeWidth="2" markerEnd="url(#head-purple)" />
                <text x="10" y={-Tension/2 + 10} fill="#a855f7" fontSize="10">T</text>
                
                {/* Weight (Down) */}
                <line x1="0" y1="40" x2="0" y2={40 + W1/2} stroke="#ef4444" strokeWidth="2" markerEnd="url(#head-red)" />
                <text x="10" y={40 + W1/2} fill="#ef4444" fontSize="10">W1</text>
             </g>
             
             {/* ANGLE ARC */}
             <path 
                d={`M ${rampBaseX + 60} ${rampBaseY} A 60 60 0 0 0 ${rampBaseX + 60*Math.cos(rad)} ${rampBaseY - 60*Math.sin(rad)}`}
                stroke="#fff" fill="none" opacity="0.5" strokeWidth="2"
             />
             <text x={rampBaseX + 80} y={rampBaseY - 15} fill="#fff" fontSize="12">θ</text>

           </svg>
        </div>

        {/* LOWER: ENERGY GRAPH */}
        <div style={{ height: '200px', background: '#111', borderTop: '1px solid #333', padding: '10px' }}>
           <div style={{ fontSize:'10px', color:'#888', marginBottom:'5px', display:'flex', gap:'20px', justifyContent:'center' }}>
              <span style={{color:'#00e5ff'}}>── Kinetic Energy</span>
              <span style={{color:'#ef4444'}}>── Potential Δ</span>
              <span style={{color:'#fff', opacity:0.5}}>── Total Mech</span>
           </div>
           
           <svg width="100%" height="100%">
             {(() => {
                const W = 800; 
                const H = 150;
                const maxE = 250; 
                return (
                  <g>
                    {/* Grid Y */}
                    {[-150, 0, 150].map(val => {
                        const y = (H/2) - (val/maxE)*(H/2);
                        return <line key={val} x1="40" y1={y} x2="100%" y2={y} stroke="#333" strokeWidth="1" />
                    })}
                    {/* Zero Line */}
                    <line x1="40" y1={H/2} x2="100%" y2={H/2} stroke="#666" strokeWidth="1" />
                    <text x="35" y={H/2+4} fill="#888" fontSize="10" textAnchor="end">0J</text>

                    {/* Curves */}
                    <path d={getGraphPath('ke', H, W, maxE)} transform="translate(40,0)" stroke="#00e5ff" strokeWidth="2" fill="none" filter="url(#glow)" />
                    <path d={getGraphPath('pe', H, W, maxE)} transform="translate(40,0)" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.8" />
                    <path d={getGraphPath('total', H, W, maxE)} transform="translate(40,0)" stroke="#fff" strokeWidth="1" strokeDasharray="4,4" fill="none" opacity="0.5" />
                  </g>
                );
             })()}
           </svg>
        </div>

      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '110px', fontSize: '11px', color: '#ccc' }}>{label}</span>
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

export default InclinePulley;