import React, { useState, useRef } from "react";

const VectorAddition = () => {
  // --- CONFIG ---
  const W = 900;
  const H = 600;
  const GRID = 50; // Base unit size

  // --- STATE ---
  const [A, setA] = useState({ x: 4, y: 2 });
  const [B, setB] = useState({ x: 2, y: 5 });
  const [scale, setScale] = useState(1.0);
  
  // Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showComponents, setShowComponents] = useState(false);
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showAngles, setShowAngles] = useState(true);

  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // --- MATH HELPERS ---
  const origin = { x: W / 2, y: H / 2 };
  const R = { x: A.x + B.x, y: A.y + B.y };

  const mag = (v) => Math.hypot(v.x, v.y);
  const deg = (v) => {
    let angle = (Math.atan2(v.y, v.x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  };

  const toSVG = (x, y) => ({
    x: origin.x + x * GRID * scale,
    y: origin.y - y * GRID * scale,
  });

  const fromSVG = (svgX, svgY) => ({
    x: (svgX - origin.x) / (GRID * scale),
    y: -(svgY - origin.y) / (GRID * scale),
  });

  // --- INTERACTION ---
  const handleMouseDown = (target) => (dragRef.current = target);
  
  const handleMouseMove = (e) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pos = fromSVG(e.clientX - rect.left, e.clientY - rect.top);
    const snapped = { 
      x: Math.round(pos.x * 2) / 2, // Snap to 0.5
      y: Math.round(pos.y * 2) / 2 
    };
    if (dragRef.current === 'A') setA(snapped);
    if (dragRef.current === 'B') setB(snapped);
  };

  const handleMouseUp = () => (dragRef.current = null);

  // --- RENDERERS ---
  const renderArrowDef = (id, color) => (
    <marker id={id} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
  );

  const renderVector = (v, start, color, label, isDashed = false) => {
    const s = toSVG(start.x, start.y);
    const e = toSVG(start.x + v.x, start.y + v.y);
    const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };

    return (
      <g>
        <line
          x1={s.x} y1={s.y} x2={e.x} y2={e.y}
          stroke={color}
          strokeWidth={isDashed ? 2 : 4}
          strokeDasharray={isDashed ? "5,5" : "none"}
          markerEnd={`url(#head-${color.replace('#', '')})`}
          style={{ filter: isDashed ? 'none' : 'url(#glow)' }}
        />
        {label && (
          <text 
            x={mid.x + 10} y={mid.y - 10} 
            fill={color} fontSize="12" fontWeight="bold"
            style={{ textShadow: `0 0 5px ${color}` }}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const renderAngleArc = (v, color, radius = 30) => {
    if (!showAngles) return null;
    const endAngle = -deg(v) * (Math.PI / 180);
    const start = { x: origin.x + radius, y: origin.y };
    const end = { x: origin.x + radius * Math.cos(endAngle), y: origin.y + radius * Math.sin(endAngle) };
    const largeArcFlag = Math.abs(endAngle) > Math.PI ? 1 : 0;
    
    return (
      <path 
        d={`M ${origin.x} ${origin.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`}
        fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1"
      />
    );
  };

  const renderHandle = (v, id, color) => {
    const pos = toSVG(v.x, v.y);
    return (
      <circle
        cx={pos.x} cy={pos.y} r={12}
        fill={color} fillOpacity="0.2"
        stroke={color} strokeWidth="2"
        style={{ cursor: 'pointer' }}
        onMouseDown={() => handleMouseDown(id)}
      />
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '300px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>VECTOR LAB</h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ff4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>VECTOR A</h4>
          <label style={{ fontSize: '11px', color: '#888' }}>X: {A.x}</label>
          <input type="range" min="-8" max="8" step="0.5" value={A.x} onChange={(e) => setA({...A, x: Number(e.target.value)})} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px', color: '#888' }}>Y: {A.y}</label>
          <input type="range" min="-8" max="8" step="0.5" value={A.y} onChange={(e) => setA({...A, y: Number(e.target.value)})} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #448aff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#448aff' }}>VECTOR B</h4>
          <label style={{ fontSize: '11px', color: '#888' }}>X: {B.x}</label>
          <input type="range" min="-8" max="8" step="0.5" value={B.x} onChange={(e) => setB({...B, x: Number(e.target.value)})} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px', color: '#888' }}>Y: {B.y}</label>
          <input type="range" min="-8" max="8" step="0.5" value={B.y} onChange={(e) => setB({...B, y: Number(e.target.value)})} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px' }}>Zoom: {scale.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setShowGrid(!showGrid)} style={btnStyle(showGrid)}>GRID: {showGrid ? "ON" : "OFF"}</button>
          <button onClick={() => setShowComponents(!showComponents)} style={btnStyle(showComponents)}>COMPONENTS: {showComponents ? "ON" : "OFF"}</button>
          <button onClick={() => setShowParallelogram(!showParallelogram)} style={btnStyle(showParallelogram)}>PARALLELOGRAM: {showParallelogram ? "ON" : "OFF"}</button>
          <button onClick={() => { setA({x:4,y:2}); setB({x:2,y:5}); setScale(1); }} style={{...btnStyle(false), borderColor: '#ff4444', color: '#ff4444'}}>RESET</button>
        </div>
      </aside>

      {/* CANVAS AREA */}
      <main style={{ flex: 1, position: 'relative' }}>
        <svg 
          ref={svgRef}
          width="100%" height="100%" 
          style={{ background: '#000', cursor: dragRef.current ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            {renderArrowDef('head-ff4444', '#ff4444')}
            {renderArrowDef('head-448aff', '#448aff')}
            {renderArrowDef('head-ffffff', '#ffffff')}
            {renderArrowDef('head-888888', '#888888')}
          </defs>

          {/* BRIGHT GRID & AXIS NUMBERS */}
          {showGrid && (
            <g>
              {/* Vertical Lines & Numbers */}
              {Array.from({ length: 41 }).map((_, i) => {
                const num = i - 20;
                const xPos = origin.x + num * GRID * scale;
                if (num === 0) return null; 
                return (
                  <g key={`v${i}`}>
                    <line x1={xPos} y1={0} x2={xPos} y2={H * 2} stroke="#222" strokeWidth="1" />
                    <text x={xPos} y={origin.y + 15} fill="#555" fontSize="10" textAnchor="middle">{num}</text>
                  </g>
                );
              })}
              {/* Horizontal Lines & Numbers */}
              {Array.from({ length: 41 }).map((_, i) => {
                const num = 20 - i;
                const yPos = origin.y - num * GRID * scale;
                if (num === 0) return null;
                return (
                  <g key={`h${i}`}>
                    <line x1={0} y1={yPos} x2={W * 2} y2={yPos} stroke="#222" strokeWidth="1" />
                    <text x={origin.x - 8} y={yPos + 3} fill="#555" fontSize="10" textAnchor="end">{num}</text>
                  </g>
                );
              })}
              {/* Main Axes */}
              <line x1={origin.x} y1={0} x2={origin.x} y2={H * 2} stroke="#444" strokeWidth="2" />
              <line x1={0} y1={origin.y} x2={W * 2} y2={origin.y} stroke="#444" strokeWidth="2" />
              <text x={origin.x - 10} y={origin.y + 15} fill="#fff" fontSize="10">0</text>
            </g>
          )}

          {showAngles && renderAngleArc(A, '#ff4444', 40)}
          {showAngles && renderAngleArc(B, '#448aff', 30)}
          
          {showComponents && (
            <g opacity="0.4">
              <line x1={toSVG(0,0).x} y1={toSVG(0,0).y} x2={toSVG(A.x,0).x} y2={toSVG(A.x,0).y} stroke="#ff4444" strokeDasharray="4,4" />
              <line x1={toSVG(A.x,0).x} y1={toSVG(A.x,0).y} x2={toSVG(A.x,A.y).x} y2={toSVG(A.x,A.y).y} stroke="#ff4444" strokeDasharray="4,4" />
              <line x1={toSVG(0,0).x} y1={toSVG(0,0).y} x2={toSVG(B.x,0).x} y2={toSVG(B.x,0).y} stroke="#448aff" strokeDasharray="4,4" />
              <line x1={toSVG(B.x,0).x} y1={toSVG(B.x,0).y} x2={toSVG(B.x,B.y).x} y2={toSVG(B.x,B.y).y} stroke="#448aff" strokeDasharray="4,4" />
            </g>
          )}

          {showParallelogram && (
            <g opacity="0.4">
              {renderVector(B, A, '#888888', null, true)}
              {renderVector(A, B, '#888888', null, true)}
            </g>
          )}

          {renderVector(A, {x:0, y:0}, '#ff4444', 'A')}
          {renderVector(B, {x:0, y:0}, '#448aff', 'B')}
          {renderVector(R, {x:0, y:0}, '#ffffff', 'R')}
          
          {renderHandle(A, 'A', '#ff4444')}
          {renderHandle(B, 'B', '#448aff')}
        </svg>

        {/* HUD */}
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(20,20,20,0.9)', border: '1px solid #333', borderRadius: '8px', padding: '15px', width: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '5px' }}>DATA</h3>
          <VectorRow label="A" color="#ff4444" vec={A} mag={mag(A)} deg={deg(A)} />
          <VectorRow label="B" color="#448aff" vec={B} mag={mag(B)} deg={deg(B)} />
          <div style={{ height: '1px', background: '#333', margin: '5px 0' }}></div>
          <VectorRow label="R" color="#ffffff" vec={R} mag={mag(R)} deg={deg(R)} />
        </div>
      </main>
    </div>
  );
};

const VectorRow = ({ label, color, vec, mag, deg }) => (
  <div style={{ marginBottom: '8px', fontSize: '11px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: color, fontWeight: 'bold' }}>
      <span>Vector {label}</span><span>{mag.toFixed(2)}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
      <span>({vec.x}, {vec.y})</span><span>{deg.toFixed(1)}°</span>
    </div>
  </div>
);

const btnStyle = (active) => ({
  padding: '8px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#666', borderRadius: '4px', cursor: 'pointer', fontSize: '10px'
});

export default VectorAddition;