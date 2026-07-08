import React, { useState, useEffect, useRef } from 'react';

export default function Polarization() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotate, setRotate] = useState({ x: 20, y: -30 });
  const [filterAngle, setFilterAngle] = useState(0);
  const [time, setTime] = useState(0);
  const requestRef = useRef();

  // Animation Loop
  const animate = () => {
    if (isPlaying) setTime(t => t + 0.1);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.header}>Advanced 3D Polarization Lab</h1>
      
      {/* LEFT SIDE CONTROLS */}
      <div style={styles.controlPanel}>
        <button style={styles.glowButton} onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
        </button>
        
        <div style={styles.group}>
          <label>Filter Angle</label>
          <input type="range" min="0" max="90" value={filterAngle} onChange={(e) => setFilterAngle(e.target.value)} />
        </div>
        <div style={styles.glowIndicator}>{filterAngle}°</div>
      </div>

      {/* 3D SCENE AREA */}
      <div style={styles.viewport}>
        <div style={{...styles.scene, transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`}}>
          
          {/* THREE SLOTS / STAGES */}
          {[0, 300, 600].map((pos, i) => (
            <div key={i} style={{...styles.filter, transform: `translateX(${pos}px) rotateY(${filterAngle}deg)`}}>
              <div style={styles.filterCrosshair} />
            </div>
          ))}
          
          {/* PROPAGATING WAVE */}
          <div style={styles.wavePath}>
            {[...Array(60)].map((_, i) => (
              <div key={i} style={{
                ...styles.wavePoint, 
                transform: `translateX(${i * 15}px) translateY(${Math.sin(i * 0.5 + time) * 40}px)`
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' },
  header: { position: 'absolute', top: 20, left: 40, color: '#fff' },
  controlPanel: { width: '300px', padding: '100px 40px', background: '#08080a', borderRight: '1px solid #222', zIndex: 10 },
  viewport: { flex: 1, perspective: '1000px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scene: { transformStyle: 'preserve-3d', transition: 'transform 0.05s linear' },
  filter: { 
    position: 'absolute', width: '200px', height: '200px', border: '2px solid #00a8ff', 
    boxShadow: '0 0 20px #00a8ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,168,255,0.1)'
  },
  filterCrosshair: { width: '100%', height: '2px', background: '#00a8ff', boxShadow: '0 0 10px #00a8ff' },
  wavePath: { position: 'absolute', top: '100px', left: '0px' },
  wavePoint: { 
    position: 'absolute', width: '6px', height: '6px', background: '#4ade80', 
    borderRadius: '50%', boxShadow: '0 0 15px #4ade80' 
  },
  glowButton: { 
    background: 'transparent', border: '1px solid #00a8ff', color: '#00a8ff', 
    padding: '15px 30px', cursor: 'pointer', marginBottom: '40px', fontSize: '18px'
  },
  glowIndicator: { fontSize: '32px', color: '#00a8ff', textShadow: '0 0 10px #00a8ff', marginTop: '20px' }
};