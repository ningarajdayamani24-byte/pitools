import React, { useState, useEffect } from 'react';

const FreeBodyDiagrams = () => {
  // --- STATE ---
  const [mass, setMass] = useState(10); // kg
  const [theta, setTheta] = useState(30); // degrees
  const [appliedForce, setAppliedForce] = useState(0); // N (Positive = Up slope, Negative = Down slope)
  const [mu, setMu] = useState(0.5); // Coeff friction

  // Toggles
  const [showComponents, setShowComponents] = useState(true);
  const [showNet, setShowNet] = useState(true);

  // --- PHYSICS ENGINE ---
  const g = 9.8;
  const rad = (theta * Math.PI) / 180;

  // 1. Gravity Decomp
  const Weight = mass * g;
  const W_perp = Weight * Math.cos(rad); // Balances Normal
  const W_para = Weight * Math.sin(rad); // Pulls down slope

  // 2. Normal Force
  // On simple incline, N = W_perp
  const Normal = W_perp;

  // 3. Friction Logic
  // Net Drive = (Pushing Force) - (Gravity Pulling Down)
  // If Force is 0, Drive is -W_para (down slope)
  const DriveForce = appliedForce - W_para;
  
  const MaxFriction = mu * Normal;
  
  let Friction = 0;
  // Friction opposes DriveForce
  if (Math.abs(DriveForce) <= MaxFriction) {
    // Static: Friction exactly cancels drive
    Friction = -DriveForce; 
  } else {
    // Kinetic (sliding): Friction is max opposing direction
    Friction = -Math.sign(DriveForce) * MaxFriction;
  }

  // 4. Net Force
  const NetForce = DriveForce + Friction;

  // --- SVG HELPERS ---
  const CX = 500;
  const CY = 300;
  const V_SCALE = 3.5; // Scale vectors for visibility

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '340px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>FBD LAB</h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>INPUTS</h4>
          <ControlRow label="Mass (kg)" val={mass} min={1} max={20} set={setMass} color="#fff" />
          <ControlRow label="Angle θ (°)" val={theta} min={0} max={60} set={setTheta} color="#fff" />
          <ControlRow label="Applied Force (N)" val={appliedForce} min={-100} max={100} set={setAppliedForce} color="#00e5ff" />
          <p style={{fontSize:'10px', color:'#666', marginTop:'5px'}}>+ Force = Push Up Slope | - Force = Push Down</p>
          <ControlRow label="Friction (μ)" val={mu} min={0} max={1.0} step={0.01} set={setMu} color="#ef4444" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginBottom:'10px'}}>
            <input type="checkbox" checked={showComponents} onChange={(e)=>setShowComponents(e.target.checked)} />
            <span style={{fontSize:'12px', color:'#facc15'}}>Show Gravity Components</span>
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            <input type="checkbox" checked={showNet} onChange={(e)=>setShowNet(e.target.checked)} />
            <span style={{fontSize:'12px', color:'#fff'}}>Show Net Force</span>
          </label>
        </div>

        {/* MATH HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={{fontSize:'11px', color:'#888', marginBottom:'10px'}}>SUMMATION (ΣF)</div>
           
           <DataRow label="Applied (Push)" val={appliedForce.toFixed(1)} unit="N" color="#00e5ff" />
           <DataRow label="Gravity (Parallel)" val={(-W_para).toFixed(1)} unit="N" color="#facc15" />
           <DataRow label="Friction" val={Friction.toFixed(1)} unit="N" color="#ef4444" />
           <div style={{ height:'1px', background:'#333', margin:'5px 0' }} />
           <DataRow label="Net Force" val={NetForce.toFixed(1)} unit="N" color="#fff" bold />
           
           <div style={{marginTop:'15px', fontSize:'10px', color: Math.abs(DriveForce) > MaxFriction ? "#00e5ff" : "#ef4444"}}>
              STATUS: {Math.abs(DriveForce) > MaxFriction ? "SLIDING (KINETIC)" : "STATIC EQUILIBRIUM"}
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b0b0d' }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 600">
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            
            {/* Markers */}
            <marker id="head-cyan" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e5ff"/></marker>
            <marker id="head-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#ef4444"/></marker>
            <marker id="head-yellow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#facc15"/></marker>
            <marker id="head-white" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#fff"/></marker>
            <marker id="head-green" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e676"/></marker>
            
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
            </pattern>
          </defs>

          <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />

          {/* RAMP GEOMETRY */}
          {/* We rotate the entire coordinate system around CX, CY to simulate incline */}
          <g transform={`translate(${CX}, ${CY}) rotate(${-theta})`}>
            
            {/* The Surface Line */}
            <line x1="-400" y1="0" x2="400" y2="0" stroke="#444" strokeWidth="4" />
            
            {/* Ground Reference (visual only, dashed horizontal) */}
            <g transform={`rotate(${theta})`}>
                <line x1="-400" y1="0" x2="400" y2="0" stroke="#333" strokeDasharray="4,4" />
                <path d={`M 100 0 A 100 100 0 0 0 ${100*Math.cos(-rad)} ${100*Math.sin(-rad)}`} stroke="#fff" fill="none" opacity="0.3"/>
                <text x="110" y="-10" fill="#fff" fontSize="12">θ</text>
            </g>

            {/* THE BLOCK */}
            <g transform="translate(0, -25)"> {/* Shift up so bottom sits on line */}
              <rect x="-40" y="-40" width="80" height="80" fill="#111" stroke="#fff" strokeWidth="2" filter="url(#glow)" />
              <text x="0" y="5" fill="#fff" fontSize="12" textAnchor="middle" transform={`rotate(${theta})`}>{mass}kg</text>
              
              {/* --- VECTORS --- */}

              {/* 1. Normal Force (Always Perpendicular Up) */}
              <Vector x={0} y={-40} dx={0} dy={-Normal * V_SCALE} color="#fff" label="N" />

              {/* 2. Friction (Parallel) */}
              {/* x direction in this group is parallel to slope */}
              <Vector x={0} y={40} dx={-Friction * V_SCALE} dy={0} color="#ef4444" label="f" offsetX={-10} />

              {/* 3. Applied Force (Parallel) */}
              <Vector x={0} y={0} dx={appliedForce * V_SCALE} dy={0} color="#00e5ff" label="F_app" />

              {/* 4. Gravity (Complex) */}
              {/* Actual Gravity points straight down in world space. In this rotated group, it points at angle theta */}
              <g transform={`rotate(${theta})`}> 
                 {/* Main mg vector */}
                 <Vector x={0} y={0} dx={0} dy={Weight * V_SCALE} color="#888" label="mg" isDashed opacity="0.5" />
              </g>

              {/* 5. Gravity Components (The "Ghost" Vectors) */}
              {showComponents && (
                <>
                  {/* Perpendicular Component (Opposite Normal) */}
                  <Vector x={0} y={0} dx={0} dy={W_perp * V_SCALE} color="#facc15" label="mg cosθ" isDashed />
                  
                  {/* Parallel Component (Down Slope) */}
                  {/* Note: Down slope is negative X in this group if we look left, but let's standard math: sin(theta) pulls 'down' the Y world, which is Left-ish here? */}
                  {/* Actually, W_para pulls DOWN the slope. In our rotated frame, Right is Up-Slope, Left is Down-Slope */}
                  <Vector x={0} y={0} dx={-W_para * V_SCALE} dy={0} color="#facc15" label="mg sinθ" />
                </>
              )}

              {/* 6. Net Force (Resultant) */}
              {showNet && Math.abs(NetForce) > 0.1 && (
                 <g transform="translate(0, -60)">
                    <Vector x={0} y={0} dx={NetForce * V_SCALE} dy={0} color="#00e676" label="ΣF" thickness={4} />
                 </g>
              )}

            </g>
          </g>

        </svg>
      </main>
    </div>
  );
};

// --- SUB COMPONENTS ---

const Vector = ({ x, y, dx, dy, color, label, isDashed, opacity=1, thickness=2, offsetX=0 }) => {
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null; // Don't draw tiny vectors
  
  // Choose marker based on color
  let marker = "url(#head-white)";
  if (color === "#00e5ff") marker = "url(#head-cyan)";
  if (color === "#ef4444") marker = "url(#head-red)";
  if (color === "#facc15") marker = "url(#head-yellow)";
  if (color === "#00e676") marker = "url(#head-green)";

  return (
    <g opacity={opacity}>
      <line 
        x1={x} y1={y} 
        x2={x + dx} y2={y + dy} 
        stroke={color} 
        strokeWidth={thickness} 
        strokeDasharray={isDashed ? "4,4" : "none"}
        markerEnd={marker}
      />
      <text 
        x={x + dx + offsetX} 
        y={y + dy - 5} 
        fill={color} 
        fontSize="12" 
        fontWeight="bold"
        style={{ textShadow: '0px 0px 4px #000' }}
      >
        {label}
      </text>
    </g>
  );
};

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '100px', fontSize: '11px', color: '#ccc' }}>{label}</span>
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

export default FreeBodyDiagrams;