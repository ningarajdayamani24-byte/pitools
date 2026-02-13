import React, { useState, useRef, useEffect } from "react";

const MotionFromVelocity = () => {
  // --- CONFIG ---
  const W = 300;
  const H = 300;
  const GRID = 40; // 1 unit = 40px
  const T_MAX = 4.0;
  const DT = 0.05;

  // --- STATE ---
  const [points, setPoints] = useState([
    { t: 0, v: 0 },
    { t: 1, v: 2 },
    { t: 2, v: 0 },
    { t: 3, v: -2 },
    { t: 4, v: 0 },
  ]);

  const [tCheck, setTCheck] = useState(2.0); // Scrubber
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  // --- MATH ENGINE ---
  const getVel = (t) => {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (t >= p1.t && t <= p2.t) {
        const slope = (p2.v - p1.v) / (p2.t - p1.t);
        return p1.v + slope * (t - p1.t);
      }
    }
    return points[points.length - 1].v;
  };

  const getAcc = (t) => {
    const safeT = Math.min(Math.max(t, 0.01), 3.99); 
    const i = Math.floor(safeT);
    const p1 = points[i];
    const p2 = points[i + 1];
    return (p2.v - p1.v) / (p2.t - p1.t);
  };

  const getPos = (tTarget) => {
    let x = 0;
    const step = 0.05; 
    for (let t = 0; t < tTarget; t += step) {
      x += getVel(t) * step;
    }
    return x;
  };

  const generateData = (fn) => {
    const data = [];
    for (let t = 0; t <= T_MAX; t += 0.1) {
      data.push({ t, val: fn(t) });
    }
    return data;
  };

  const posData = generateData(getPos);
  const velData = generateData(getVel);
  const accData = generateData(getAcc);

  const currPos = getPos(tCheck);
  const currVel = getVel(tCheck);
  const currAcc = getAcc(tCheck);

  // --- INTERACTION ---
  const handleMouseDown = (index) => (dragRef.current = index);
  
  const handleMouseMove = (e) => {
    if (dragRef.current === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    const midY = H / 2;
    let newVal = (midY - rawY) / GRID;
    newVal = Math.round(newVal * 2) / 2; // Snap to 0.5
    if (newVal > 3.5) newVal = 3.5;
    if (newVal < -3.5) newVal = -3.5;

    setPoints(prev => prev.map((p, i) => 
      i === dragRef.current ? { ...p, v: newVal } : p
    ));
  };

  const handleMouseUp = () => (dragRef.current = null);

  // --- SUB-COMPONENT ---
  const Graph = ({ title, color, data, curVal, labelY, interactive, fillArea }) => {
    const midX = 40; // Left margin
    const midY = H / 2;

    const toSVG = (t, val) => ({
      x: midX + t * (240 / T_MAX), // Stretch 4s to 240px
      y: midY - val * GRID
    });

    // Generate Curve Path
    let d = data.map((p, i) => {
      const pos = toSVG(p.t, p.val);
      return `${i===0?"M":"L"} ${pos.x} ${pos.y}`;
    }).join(" ");

    // Area Fill Path
    let areaPath = d;
    if (fillArea) {
      const start = toSVG(0, 0);
      const end = toSVG(T_MAX, 0);
      areaPath += ` L ${end.x} ${end.y} L ${start.x} ${start.y} Z`;
    }

    const scrubber = toSVG(tCheck, curVal);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ color: color, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>
        <svg 
          width={W} height={H} 
          style={{ background: '#000', border: '1px solid #333', borderRadius: '4px', cursor: interactive ? 'row-resize' : 'default' }}
          ref={interactive ? svgRef : null}
          onMouseMove={interactive ? handleMouseMove : null}
          onMouseUp={interactive ? handleMouseUp : null}
          onMouseLeave={interactive ? handleMouseUp : null}
        >
          <defs>
            <filter id={`glow-${color}`}><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* GRID SYSTEM */}
          <g>
             {/* Horizontal Lines & Y-Axis Numbers */}
             {[-3, -2, -1, 0, 1, 2, 3].map(v => {
               const y = midY - v * GRID;
               return (
                 <g key={v}>
                   <line x1={midX} y1={y} x2={W} y2={y} stroke={v === 0 ? "#666" : "#222"} strokeWidth={v === 0 ? 2 : 1} strokeDasharray={v===0 ? "" : "4,4"} />
                   <text x={midX - 8} y={y + 4} fill="#555" fontSize="10" textAnchor="end">{v}</text>
                 </g>
               );
             })}
             
             {/* Vertical Lines & Time Numbers */}
             {[0, 1, 2, 3, 4].map(t => {
               const x = midX + t * (240 / T_MAX);
               return (
                 <g key={t}>
                   <line x1={x} y1={0} x2={x} y2={H} stroke="#222" strokeWidth="1" strokeDasharray="4,4" />
                   <text x={x} y={H - 5} fill="#555" fontSize="10" textAnchor="middle">{t}s</text>
                 </g>
               );
             })}

             {/* Main Vertical Axis Line */}
             <line x1={midX} y1={0} x2={midX} y2={H} stroke="#666" strokeWidth="2" />
          </g>

          {/* GRAPH CONTENT */}
          {fillArea && <path d={areaPath} fill={color} fillOpacity="0.15" />}
          <path d={d} stroke={color} strokeWidth="3" fill="none" filter={`url(#glow-${color})`} strokeLinecap="round" strokeLinejoin="round" />

          {/* SCRUBBER */}
          <circle cx={scrubber.x} cy={scrubber.y} r="5" fill="#fff" stroke={color} strokeWidth="2" />
          <line x1={scrubber.x} y1={0} x2={scrubber.x} y2={H} stroke="#fff" strokeDasharray="3,3" opacity="0.4" />

          {/* INTERACTIVE HANDLES */}
          {interactive && points.map((p, i) => {
             const pos = toSVG(p.t, p.v);
             return (
               <g key={i} onMouseDown={() => handleMouseDown(i)}>
                 <circle cx={pos.x} cy={pos.y} r="15" fill="transparent" /> 
                 <circle cx={pos.x} cy={pos.y} r="6" fill="#fff" stroke={color} strokeWidth="2" style={{cursor: 'pointer'}} />
               </g>
             );
          })}

          {/* HUD VALUE */}
          <text x={W-10} y={20} fill={color} fontSize="11" fontFamily="monospace" textAnchor="end">{labelY}({tCheck.toFixed(1)}) = {curVal.toFixed(2)}</text>

        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>CALCULUS LAB</h2>
        
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #22c55e' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#22c55e' }}>CONTROLS</h4>
          <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
            Drag the white handles on the green <strong>Velocity</strong> graph to define the function $v(t)$.
          </p>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <label style={{ fontSize: '11px', color: '#fff', fontWeight:'bold' }}>TIME: {tCheck.toFixed(2)}s</label>
          <input type="range" min="0" max="4" step="0.05" value={tCheck} onChange={(e) => setTCheck(Number(e.target.value))} style={{ width: '100%', marginTop:'10px' }} />
        </div>

        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>CALCULUS VALUES</div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#3b82f6' }}>x(t) = <strong>{currPos.toFixed(2)}</strong></div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#22c55e' }}>v(t) = <strong>{currVel.toFixed(2)}</strong></div>
          <div style={{ fontSize: '12px', color: '#ef4444' }}>a(t) = <strong>{currAcc.toFixed(2)}</strong></div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', overflowY: 'auto' }}>
        
        {/* INPUT GRAPH */}
        <div style={{ display: 'flex', gap: '20px' }}>
           <Graph title="VELOCITY (INPUT)" color="#22c55e" data={velData} curVal={currVel} labelY="v" interactive={true} fillArea={true} />
        </div>

        {/* OUTPUT GRAPHS */}
        <div style={{ display: 'flex', gap: '30px' }}>
           <Graph title="POSITION (INTEGRAL)" color="#3b82f6" data={posData} curVal={currPos} labelY="x" />
           <Graph title="ACCELERATION (DERIVATIVE)" color="#ef4444" data={accData} curVal={currAcc} labelY="a" />
        </div>

      </main>
    </div>
  );
};

export default MotionFromVelocity;