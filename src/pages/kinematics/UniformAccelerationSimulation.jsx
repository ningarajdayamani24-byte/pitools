import React, { useState, useEffect, useRef } from 'react';

const UniformAcceleration1D = () => {
  // --- CONFIG ---
  const T_MAX = 5.0;
  const DT = 0.02;
  const SCALE = 40; // Pixels per meter

  // --- STATE ---
  const [x0, setX0] = useState(-3);
  const [v0, setV0] = useState(2);
  const [a, setA] = useState(0.5);
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  // Kinematic Equations
  const calculatePhysics = (time) => {
    const x = x0 + v0 * time + 0.5 * a * time * time;
    const v = v0 + a * time;
    return { x, v };
  };

  const current = calculatePhysics(t);

  // Animation Loop
  const animate = () => {
    setT(prevT => {
      if (prevT >= T_MAX) {
        setIsRunning(false);
        return T_MAX;
      }
      return prevT + DT;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
  };

  // --- RENDER HELPERS ---
  const formatNum = (n) => (n >= 0 ? "+" : "") + n.toFixed(2);

  // --- SUB-COMPONENTS ---
  
  // 1. The Moving Car
  const Car = ({ x }) => {
    // Convert physics x to screen x (center is 450px)
    const screenX = 450 + x * SCALE;
    return (
      <g transform={`translate(${screenX}, 90)`}>
        {/* Glow Effect */}
        <ellipse cx="0" cy="15" rx="30" ry="8" fill="#448aff" filter="url(#glow)" opacity="0.4" />
        
        {/* Car Body */}
        <path 
          d="M -25 0 L -20 -15 L 10 -15 L 25 0 L 25 10 L -25 10 Z" 
          fill="#000" stroke="#448aff" strokeWidth="2"
        />
        {/* Wheels */}
        <circle cx="-15" cy="10" r="6" fill="#111" stroke="#555" strokeWidth="2" />
        <circle cx="15" cy="10" r="6" fill="#111" stroke="#555" strokeWidth="2" />
        
        {/* Label */}
        <text x="0" y="-25" fill="#448aff" fontSize="12" textAnchor="middle" fontWeight="bold">
          {x.toFixed(2)}m
        </text>
      </g>
    );
  };

  // 2. Vector Arrows
  const VectorArrow = ({ startX, val, y, color, label }) => {
    const length = val * SCALE;
    if (Math.abs(length) < 2) return null; // Don't draw tiny vectors

    const screenStart = 450 + startX * SCALE;
    const screenEnd = screenStart + length;
    const mid = (screenStart + screenEnd) / 2;

    return (
      <g>
        <line 
          x1={screenStart} y1={y} x2={screenEnd} y2={y} 
          stroke={color} strokeWidth="2" 
          markerEnd={`url(#head-${color.replace('#','')})`}
        />
        <text x={mid} y={y - 8} fill={color} fontSize="11" textAnchor="middle">
          {label}
        </text>
        {/* Drop line to track */}
        <line x1={screenEnd} y1={y} x2={screenEnd} y2={85} stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      </g>
    );
  };

  // 3. Mini Graphs
  const MiniGraph = ({ title, color, dataFn, currentT }) => {
    // Generate path data
    let d = "";
    for (let i = 0; i <= T_MAX; i += 0.1) {
      const val = dataFn(i);
      // Map: Time(0->5) to X(0->200), Val(-10->10) to Y(100->0)
      const gx = (i / T_MAX) * 200;
      const gy = 50 - (val * 4); // Scale factor 4
      d += `${i === 0 ? "M" : "L"} ${gx} ${gy} `;
    }

    const curVal = dataFn(currentT);
    const cx = (currentT / T_MAX) * 200;
    const cy = 50 - (curVal * 4);

    return (
      <div style={{ width: '220px', background: '#000', border: '1px solid #222', padding: '10px', borderRadius: '4px' }}>
        <div style={{ color: color, fontSize: '11px', marginBottom: '5px', fontWeight: 'bold' }}>{title}</div>
        <svg width="200" height="100" style={{ overflow: 'visible' }}>
          {/* Axes */}
          <line x1="0" y1="50" x2="200" y2="50" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="#333" strokeWidth="1" />
          
          {/* Curve */}
          <path d={d} stroke={color} fill="none" strokeWidth="2" />
          
          {/* Current Point */}
          <circle cx={cx} cy={cy} r="4" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={200} y={15} fill={color} fontSize="10" textAnchor="end">{curVal.toFixed(2)}</text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR CONTROLS */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>KINEMATICS LAB</h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>INITIAL CONDITIONS</h4>
          
          <label style={{ fontSize: '11px', color: '#ef4444' }}>Position (x₀): {x0} m</label>
          <input type="range" min="-8" max="0" step="0.5" value={x0} onChange={(e) => setX0(Number(e.target.value))} style={{ width: '100%' }} />

          <label style={{ fontSize: '11px', color: '#2563eb' }}>Velocity (v₀): {v0} m/s</label>
          <input type="range" min="-5" max="5" step="0.5" value={v0} onChange={(e) => setV0(Number(e.target.value))} style={{ width: '100%' }} />

          <label style={{ fontSize: '11px', color: '#22c55e' }}>Acceleration (a): {a} m/s²</label>
          <input type="range" min="-2" max="2" step="0.1" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {/* MATH BOX */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>EQUATIONS OF MOTION</div>
          
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>
            <span style={{ color: '#ef4444' }}>x</span> = {x0} {formatNum(v0)}t {formatNum(0.5*a)}t²
            <div style={{ color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>
              = {current.x.toFixed(2)} m
            </div>
          </div>

          <div style={{ fontSize: '12px' }}>
            <span style={{ color: '#2563eb' }}>v</span> = {v0} {formatNum(a)}t
            <div style={{ color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>
              = {current.v.toFixed(2)} m/s
            </div>
          </div>
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "RUN"}
          </button>
          <button onClick={handleReset} style={{...btnStyle(false), borderColor: '#ef4444', color: '#ef4444'}}>
            RESET
          </button>
        </div>
        
        <label style={{ fontSize: '11px', color: '#888' }}>Time (t): {t.toFixed(2)}s</label>
        <input type="range" min="0" max={T_MAX} step="0.01" value={t} onChange={(e) => { setIsRunning(false); setT(Number(e.target.value)); }} style={{ width: '100%' }} />

      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px', gap: '20px' }}>
        
        {/* 1. TRACK VIEW */}
        <div style={{ height: '300px', background: '#000', border: '1px solid #222', borderRadius: '8px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#555' }}>Top-Down View (1D Motion)</div>
          
          <svg width="100%" height="100%" viewBox="0 0 900 200">
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="head-ef4444" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#ef4444"/></marker>
              <marker id="head-2563eb" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#2563eb"/></marker>
              <marker id="head-22c55e" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#22c55e"/></marker>
            </defs>

            {/* Track Line */}
            <line x1="50" y1="120" x2="850" y2="120" stroke="#333" strokeWidth="2" />
            
            {/* Ticks */}
            {Array.from({ length: 21 }).map((_, i) => {
              const val = i - 10;
              const xPos = 450 + val * SCALE;
              return (
                <g key={i}>
                  <line x1={xPos} y1="115" x2={xPos} y2="125" stroke="#555" />
                  <text x={xPos} y="145" fill="#666" fontSize="10" textAnchor="middle">{val}</text>
                </g>
              );
            })}

            {/* Zero Marker */}
            <line x1="450" y1="80" x2="450" y2="160" stroke="#444" strokeWidth="1" strokeDasharray="4,4" />
            <text x="455" y="155" fill="#444" fontSize="10">ORIGIN (0)</text>

            {/* Vectors */}
            {/* x0 (Initial Position) */}
            <VectorArrow startX={0} val={x0} y={40} color="#ef4444" label="x₀" />
            
            {/* Displacement (Current Position from Origin) */}
            <VectorArrow startX={0} val={current.x} y={170} color="#fff" label={`x(t) = ${current.x.toFixed(2)}`} />

            {/* Velocity Vector (Attached to Car) */}
            <VectorArrow startX={current.x} val={current.v} y={70} color="#2563eb" label={`v(t) = ${current.v.toFixed(1)}`} />

            {/* THE CAR */}
            <Car x={current.x} />
          </svg>
        </div>

        {/* 2. GRAPHS ROW */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <MiniGraph 
            title="POSITION vs TIME (x-t)" 
            color="#ef4444" 
            currentT={t}
            dataFn={(tt) => x0 + v0 * tt + 0.5 * a * tt * tt} 
          />
          <MiniGraph 
            title="VELOCITY vs TIME (v-t)" 
            color="#2563eb" 
            currentT={t}
            dataFn={(tt) => v0 + a * tt} 
          />
          <MiniGraph 
            title="ACCELERATION vs TIME (a-t)" 
            color="#22c55e" 
            currentT={t}
            dataFn={(tt) => a} 
          />
        </div>

      </main>
    </div>
  );
};

const btnStyle = (active) => ({
  flex: 1,
  padding: '10px',
  background: active ? '#222' : 'transparent',
  border: '1px solid',
  borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'bold'
});

export default UniformAcceleration1D;