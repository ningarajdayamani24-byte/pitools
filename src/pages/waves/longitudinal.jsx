import React, { useState, useEffect, useRef } from 'react';

const LongitudinalWaves = () => {
  const canvasRef = useRef(null);
  const [amplitude, setAmplitude] = useState(15);
  const [waveSpeed, setWaveSpeed] = useState(1.0);
  const [waveMode, setWaveMode] = useState('travelling'); // 'travelling' or 'standing'
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGraph, setShowGraph] = useState(true);
  const timeRef = useRef(0);

  const theme = {
    bg: '#0a0a0c',
    panel: '#111114',
    border: '#2a2a35',
    text: '#ffffff',
    subText: '#888888',
    blue: '#2979ff',
    red: '#ff2a2a',
    green: '#00e676',
    yellow: '#ffd600',
    lineDefault: 'rgba(255, 255, 255, 0.6)',
    grid: 'rgba(255, 255, 255, 0.05)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.05 * waveSpeed;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, amplitude, waveSpeed, waveMode, showGraph]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Clear canvas
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const numLines = 100;
    const spacing = width / numLines;
    const k = 0.2; // wave number

    if (showGraph) {
      const graphCenterY = 460;
      const graphScale = 3.5;

      // Draw X-axis for the graph
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, graphCenterY);
      ctx.lineTo(width, graphCenterY);
      ctx.stroke();

      // Draw the displacement wave
      ctx.beginPath();
      ctx.strokeStyle = theme.blue;
      ctx.shadowColor = theme.blue;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x++) {
        const iExact = x / spacing;
        let graphDisplacement = 0;
        if (waveMode === 'travelling') {
          graphDisplacement = amplitude * Math.cos(k * iExact - t);
        } else {
          graphDisplacement = amplitude * Math.sin(k * iExact) * Math.cos(t);
        }
        const yPos = graphCenterY - (graphDisplacement * graphScale);
        if (x === 0) ctx.moveTo(x, yPos);
        else ctx.lineTo(x, yPos);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw tracking dots on the graph for the colored lines
      const drawTracker = (index, color) => {
        const iExact = index;
        let disp = 0;
        if (waveMode === 'travelling') disp = amplitude * Math.cos(k * iExact - t);
        else disp = amplitude * Math.sin(k * iExact) * Math.cos(t);
        
        const equilibriumX = index * spacing;
        const currentX = equilibriumX + disp;
        const graphY = graphCenterY - (disp * graphScale);

        // Draw dotted projection line from particle to graph point
        ctx.strokeStyle = color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(currentX, 320); // Base of the particle line
        ctx.lineTo(equilibriumX, graphY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw glowing point on the graph
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(equilibriumX, graphY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      
      drawTracker(40, theme.red);
      drawTracker(70, theme.green);
    }

    ctx.lineWidth = 2;
    
    // Draw longitudinal lines
    for (let i = 0; i < numLines; i++) {
      const xBase = i * spacing;
      let displacement = 0;

      if (waveMode === 'travelling') {
        // y(x,t) = A * cos(kx - wt)
        displacement = amplitude * Math.cos(k * i - t);
      } else {
        // y(x,t) = A * sin(kx) * cos(wt)
        displacement = amplitude * Math.sin(k * i) * Math.cos(t);
      }

      const xDrawn = xBase + displacement;

      // Color specific lines to track particles (like the red/green in screenshot)
      if (i === 40) {
        ctx.strokeStyle = theme.red;
        ctx.shadowColor = theme.red;
        ctx.shadowBlur = 8;
      } else if (i === 70) {
        ctx.strokeStyle = theme.green;
        ctx.shadowColor = theme.green;
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = theme.lineDefault;
        ctx.shadowBlur = 0;
      }

      // Draw the vertical line (Dynamic height based on graph)
      const topY = showGraph ? 50 : 150;
      const bottomY = showGraph ? 320 : height - 150;
      
      ctx.beginPath();
      ctx.moveTo(xDrawn, topY);
      ctx.lineTo(xDrawn, bottomY);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ width: '350px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
        
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '25px' }}>LONGITUDINAL WAVES</h2>
        
        <div style={{ padding: '15px', border: `1px solid ${theme.blue}`, borderRadius: '4px', marginBottom: '25px', fontSize: '11px', lineHeight: '1.5' }}>
          <strong>PHYSICS NOTE:</strong> Particles oscillate parallel to the direction of wave propagation, creating regions of compression and rarefaction.
        </div>

        {/* WAVE MODES */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <button 
            onClick={() => setWaveMode('travelling')}
            style={{ flex: 1, padding: '10px', fontSize: '10px', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '4px',
              backgroundColor: waveMode === 'travelling' ? 'rgba(41, 121, 255, 0.15)' : 'transparent',
              border: `1px solid ${waveMode === 'travelling' ? theme.blue : theme.border}`,
              color: waveMode === 'travelling' ? theme.blue : theme.subText,
              boxShadow: waveMode === 'travelling' ? `0 0 12px rgba(41, 121, 255, 0.3)` : 'none'
            }}
            onMouseOver={(e) => { if(waveMode !== 'travelling') e.target.style.borderColor = '#555'; }}
            onMouseOut={(e) => { if(waveMode !== 'travelling') e.target.style.borderColor = theme.border; }}
          >
            TRAVELLING
          </button>
          <button 
            onClick={() => setWaveMode('standing')}
            style={{ flex: 1, padding: '10px', fontSize: '10px', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '4px',
              backgroundColor: waveMode === 'standing' ? 'rgba(41, 121, 255, 0.15)' : 'transparent',
              border: `1px solid ${waveMode === 'standing' ? theme.blue : theme.border}`,
              color: waveMode === 'standing' ? theme.blue : theme.subText,
              boxShadow: waveMode === 'standing' ? `0 0 12px rgba(41, 121, 255, 0.3)` : 'none'
            }}
            onMouseOver={(e) => { if(waveMode !== 'standing') e.target.style.borderColor = '#555'; }}
            onMouseOut={(e) => { if(waveMode !== 'standing') e.target.style.borderColor = theme.border; }}
          >
            STANDING
          </button>
        </div>

        {/* SLIDERS */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '8px' }}>
            <span>AMPLITUDE</span><span style={{ color: theme.blue, fontWeight: 'bold' }}>{amplitude}</span>
          </label>
          <input type="range" min="0" max="30" step="1" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} style={{ width: '100%', accentColor: theme.blue, cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '8px' }}>
            <span>WAVE SPEED</span><span style={{ color: theme.blue, fontWeight: 'bold' }}>{waveSpeed.toFixed(1)}</span>
          </label>
          <input type="range" min="0.1" max="3" step="0.1" value={waveSpeed} onChange={(e) => setWaveSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: theme.blue, cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showGraph} 
              onChange={(e) => setShowGraph(e.target.checked)} 
              style={{ accentColor: theme.blue, cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ fontSize: '11px', color: showGraph ? theme.blue : theme.text, transition: '0.3s', fontWeight: showGraph ? 'bold' : 'normal' }}>
              SHOW DISPLACEMENT GRAPH
            </span>
          </label>
        </div>

        {/* PLAY/PAUSE */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '100%', padding: '12px', cursor: 'pointer', fontSize: '12px', marginTop: 'auto', 
            transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px',
            background: isPlaying ? 'rgba(255, 42, 42, 0.1)' : 'rgba(0, 230, 118, 0.1)', 
            border: `1px solid ${isPlaying ? theme.red : theme.green}`, 
            color: isPlaying ? theme.red : theme.green, 
            boxShadow: `0 0 12px ${isPlaying ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 230, 118, 0.2)'}` 
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = isPlaying ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 230, 118, 0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = isPlaying ? 'rgba(255, 42, 42, 0.1)' : 'rgba(0, 230, 118, 0.1)'}
        >
          {isPlaying ? 'PAUSE ANIMATION' : 'RESUME ANIMATION'}
        </button>
      </div>

      {/* CANVAS CONTAINER */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <canvas ref={canvasRef} width={900} height={600} style={{ display: 'block' }} />
      </div>
      
    </div>
  );
};

export default LongitudinalWaves;