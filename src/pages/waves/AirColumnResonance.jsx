import React, { useState, useEffect, useRef } from 'react';

const AirColumnResonance = () => {
  const canvasRef = useRef(null);
  
  // Physics State
  const [frequency, setFrequency] = useState(340); // Hz
  const [airLength, setAirLength] = useState(0.25); // Meters
  const [speedOfSound, setSpeedOfSound] = useState(340); // m/s
  
  // UI State
  const [isPlaying, setIsPlaying] = useState(true);
  const [showDisplacement, setShowDisplacement] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  
  const timeRef = useRef(0);

  const theme = {
    bg: '#0a0a0c',
    panel: '#111114',
    border: '#2a2a35',
    text: '#ffffff',
    subText: '#888888',
    blue: '#2979ff',
    water: 'rgba(41, 121, 255, 0.4)',
    waterSolid: '#184f90',
    red: '#ff2a2a',
    green: '#00e676',
    yellow: '#ffd600',
    glass: 'rgba(255, 255, 255, 0.15)',
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += (frequency * 0.0003); // Scale time with frequency
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, frequency, airLength, speedOfSound, showDisplacement, showPressure, showParticles]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Clear Background & Grid
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const lambda = speedOfSound / frequency; // Wavelength (m)
    
    // The number of quarter wavelengths that fit in the current tube length
    const n_exact = (4 * airLength) / lambda; 
    
    // Find the nearest odd integer (since closed pipe resonates at n = 1, 3, 5...)
    const n_odd = 2 * Math.round((n_exact + 1) / 2) - 1; 
    
    // Calculate how close we are to perfect resonance (0 = perfect)
    const distFromResonance = Math.abs(n_exact - n_odd);
    
    // Resonance bell curve (sharp peak when dist is near 0)
    const resonanceFactor = Math.exp(-Math.pow(distFromResonance * 8, 2));
    
    const minAmp = 5;
    const maxAmp = 50;
    const currentAmp = minAmp + (maxAmp - minAmp) * resonanceFactor;

    const tubeX = 450;
    const tubeWidth = 140;
    const tubeTop = 100;
    const tubeMaxHeight = 500; // Represents 1.0 meters physically
    const pxPerMeter = tubeMaxHeight / 1.0; 
    
    const airLengthPx = airLength * pxPerMeter;
    const waterTop = tubeTop + airLengthPx;
    const tubeBottom = tubeTop + tubeMaxHeight;

    const meterX = tubeX + tubeWidth / 2 + 60;
    const meterY = tubeTop;
    const meterHeight = tubeMaxHeight;
    
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(meterX, meterY, 15, meterHeight);
    
    // Dynamic color based on resonance level
    const meterColor = resonanceFactor > 0.8 ? theme.green : resonanceFactor > 0.4 ? theme.yellow : theme.subText;
    const fillHeight = resonanceFactor * meterHeight;
    
    ctx.fillStyle = meterColor;
    ctx.shadowBlur = resonanceFactor > 0.5 ? 15 : 0;
    ctx.shadowColor = meterColor;
    ctx.fillRect(meterX, meterY + meterHeight - fillHeight, 15, fillHeight);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INTENSITY', meterX + 7, meterY - 15);

    ctx.fillStyle = theme.water;
    ctx.fillRect(tubeX - tubeWidth/2, waterTop, tubeWidth, tubeBottom - waterTop);
    
    // Water surface line
    ctx.strokeStyle = theme.blue;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tubeX - tubeWidth/2, waterTop); ctx.lineTo(tubeX + tubeWidth/2, waterTop); ctx.stroke();
    
    // Draw waves in water to show transmission of energy
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    for(let y = waterTop + 20; y < tubeBottom; y+=25) {
        ctx.beginPath();
        for(let x = tubeX - tubeWidth/2; x <= tubeX + tubeWidth/2; x+=10) {
            const wY = y + (resonanceFactor * 3) * Math.sin(x*0.1 + t*2);
            if(x === tubeX - tubeWidth/2) ctx.moveTo(x, wY); else ctx.lineTo(x, wY);
        }
        ctx.stroke();
    }

    ctx.strokeStyle = theme.glass;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tubeX - tubeWidth/2, tubeTop);
    ctx.lineTo(tubeX - tubeWidth/2, tubeBottom);
    ctx.lineTo(tubeX + tubeWidth/2, tubeBottom);
    ctx.lineTo(tubeX + tubeWidth/2, tubeTop);
    ctx.stroke();
    
    // Tube highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tubeX - tubeWidth/2 + 5, tubeTop + 10); ctx.lineTo(tubeX - tubeWidth/2 + 5, tubeBottom - 10); ctx.stroke();

    const k_px = (2 * Math.PI) / (lambda * pxPerMeter);

    // Draw Displacement (Green)
    if (showDisplacement) {
      ctx.beginPath();
      ctx.strokeStyle = theme.green;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.shadowBlur = 8;
      ctx.shadowColor = theme.green;
      
      for (let y = tubeTop; y <= waterTop; y++) {
        // Distance from the water surface (which is a displacement node)
        const d = waterTop - y; 
        const envelope = currentAmp * Math.sin(k_px * d);
        
        // Left side
        if (y === tubeTop) ctx.moveTo(tubeX - envelope, y);
        else ctx.lineTo(tubeX - envelope, y);
      }
      for (let y = waterTop; y >= tubeTop; y--) {
        const d = waterTop - y; 
        const envelope = currentAmp * Math.sin(k_px * d);
        ctx.lineTo(tubeX + envelope, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    // Draw Pressure (Red)
    if (showPressure) {
      ctx.beginPath();
      ctx.strokeStyle = theme.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 4]);
      
      for (let y = tubeTop; y <= waterTop; y++) {
        // Distance from the water surface (which is a pressure ANTINODE)
        const d = waterTop - y; 
        const envelope = currentAmp * Math.cos(k_px * d);
        
        // Left side
        if (y === tubeTop) ctx.moveTo(tubeX - envelope, y);
        else ctx.lineTo(tubeX - envelope, y);
      }
      for (let y = waterTop; y >= tubeTop; y--) {
        const d = waterTop - y; 
        const envelope = currentAmp * Math.cos(k_px * d);
        ctx.lineTo(tubeX + envelope, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw Pressure Heatmap inside tube
      const step = 4;
      for (let y = tubeTop; y <= waterTop; y += step) {
        const d = waterTop - y;
        const pressureAmp = Math.cos(k_px * d); // -1 to 1
        const instPressure = pressureAmp * Math.cos(t * 15);
        
        let alpha = Math.abs(instPressure) * (currentAmp / maxAmp) * 0.5;
        if (alpha > 0.05) {
           ctx.fillStyle = instPressure > 0 ? `rgba(255, 42, 42, ${alpha})` : `rgba(41, 121, 255, ${alpha})`;
           ctx.fillRect(tubeX - tubeWidth/2 + 3, y, tubeWidth - 6, step);
        }
      }
    }

    if (showParticles) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const cols = 5;
      const rows = Math.floor(airLengthPx / 12);
      
      for (let c = 0; c < cols; c++) {
        const xEq = (tubeX - tubeWidth/2 + 20) + c * ((tubeWidth - 40) / (cols - 1));
        
        for (let r = 0; r <= rows; r++) {
          const yEq = tubeTop + r * 12;
          if (yEq > waterTop - 5) continue; // Don't draw in water
          
          const d = waterTop - yEq;
          // Displacement is longitudinal (Y-axis)
          // Node at water (sin(k*d)), oscillates in time
          const displacementY = currentAmp * Math.sin(k_px * d) * Math.cos(t * 15) * 0.8; 
          
          ctx.beginPath();
          ctx.arc(xEq, yEq - displacementY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const forkOscillation = (resonanceFactor + 0.2) * Math.sin(t * 25) * 4;
    const forkY = tubeTop - 40;
    
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Handle
    ctx.beginPath(); ctx.moveTo(tubeX, forkY - 40); ctx.lineTo(tubeX, forkY - 15); ctx.stroke();
    // U Shape Base
    ctx.beginPath(); ctx.moveTo(tubeX - 25, forkY - 15); ctx.lineTo(tubeX + 25, forkY - 15); ctx.stroke();
    // Prongs
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(tubeX - 25, forkY - 15); ctx.lineTo(tubeX - 25 + forkOscillation, forkY + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tubeX + 25, forkY - 15); ctx.lineTo(tubeX + 25 - forkOscillation, forkY + 10); ctx.stroke();
    
    // Sound Waves radiating from fork
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for(let r = 10; r < 40; r+=10) {
        ctx.beginPath();
        ctx.arc(tubeX, forkY + 10, r + (t*50)%10, Math.PI/4, 3*Math.PI/4);
        ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`f = ${frequency} Hz`, tubeX + 40, forkY - 25);
    
    // Length Measurement Arrow
    const measureX = tubeX - tubeWidth/2 - 30;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(measureX, tubeTop); ctx.lineTo(measureX, waterTop); ctx.stroke();
    // Ticks
    ctx.beginPath(); ctx.moveTo(measureX-5, tubeTop); ctx.lineTo(measureX+5, tubeTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(measureX-5, waterTop); ctx.lineTo(measureX+5, waterTop); ctx.stroke();
    
    // Rotate text for length
    ctx.save();
    ctx.translate(measureX - 10, tubeTop + airLengthPx / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = theme.yellow;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`L = ${airLength.toFixed(2)} m`, 0, 0);
    ctx.restore();

    // Resonance Data Overlay
    ctx.fillStyle = theme.subText;
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ctx.fillText(`Speed of Sound (v): ${speedOfSound} m/s`, 20, 30);
    ctx.fillText(`Wavelength (λ): ${lambda.toFixed(2)} m`, 20, 50);
    ctx.fillText(`λ/4 (Fundamental): ${(lambda/4).toFixed(2)} m`, 20, 70);
    
    if (resonanceFactor > 0.8) {
      ctx.fillStyle = theme.green;
      ctx.shadowBlur = 8;
      ctx.shadowColor = theme.green;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`RESONANCE! n = ${n_odd}`, 20, 100);
      ctx.shadowBlur = 0;
      ctx.font = '12px monospace';
      ctx.fillStyle = theme.subText;
      ctx.fillText(`L ≈ ${n_odd} × (λ/4)`, 20, 125);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '380px', minWidth: '380px', padding: '25px', boxSizing: 'border-box', overflowY: 'auto',
        backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '10px' }}>AIR COLUMN</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '25px' }}>ACOUSTIC RESONANCE</h3>

        <div style={{ padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '4px', marginBottom: '35px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          A closed-end pipe forces a <strong>displacement node</strong> at the water surface, and an <strong>antinode</strong> at the open top.<br/><br/>
          Resonance occurs when: <br/>
          <span style={{color: theme.yellow, fontWeight:'bold', fontSize:'13px', display:'block', margin:'8px 0'}}>L = n × (λ/4)</span> 
          where <em>n</em> is an odd integer (1, 3, 5...).
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px' }}>
          
          {/* Frequency Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>FORK FREQUENCY (f)</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{frequency} Hz</span>
            </label>
            <input type="range" min="150" max="800" step="5" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>

          {/* Water Level Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>AIR COLUMN LENGTH (L)</span>
              <span style={{ color: theme.yellow, fontWeight: 'bold' }}>{airLength.toFixed(2)} m</span>
            </label>
            <input type="range" min="0.1" max="1.0" step="0.01" value={airLength} onChange={(e) => setAirLength(Number(e.target.value))} style={sliderStyle(theme.yellow)} />
          </div>
          
          {/* Speed of sound (mostly static but fun to tweak) */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px', color: theme.subText }}>
              <span>SPEED OF SOUND (v)</span>
              <span>{speedOfSound} m/s</span>
            </label>
            <input type="range" min="300" max="400" step="1" value={speedOfSound} onChange={(e) => setSpeedOfSound(Number(e.target.value))} style={sliderStyle('#555')} />
          </div>

        </div>

        {/* VISIBILITY TOGGLES */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '25px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '15px' }}>VISUALIZATION OVERLAYS</h3>
          
          <label style={checkboxStyle(showDisplacement, theme.green)}>
            <input type="checkbox" checked={showDisplacement} onChange={(e) => setShowDisplacement(e.target.checked)} style={inputStyle(theme.green)} />
            <span>Show Displacement Envelope (Green)</span>
          </label>
          
          <label style={checkboxStyle(showPressure, theme.red)}>
            <input type="checkbox" checked={showPressure} onChange={(e) => setShowPressure(e.target.checked)} style={inputStyle(theme.red)} />
            <span>Show Pressure Envelope (Red)</span>
          </label>

          <label style={checkboxStyle(showParticles, '#fff')}>
            <input type="checkbox" checked={showParticles} onChange={(e) => setShowParticles(e.target.checked)} style={inputStyle('#fff')} />
            <span>Show Longitudinal Air Particles</span>
          </label>
        </div>

        {/* PLAY/PAUSE */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '100%', padding: '14px', cursor: 'pointer', fontSize: '12px', marginTop: 'auto', flexShrink: 0,
            transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '2px',
            background: isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
            border: `1px solid ${isPlaying ? theme.red : theme.green}`, 
            color: isPlaying ? theme.red : theme.green, 
            boxShadow: `0 0 15px ${isPlaying ? 'rgba(255, 42, 42, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
          }}
        >
          {isPlaying ? 'MUTE TUNING FORK' : 'STRIKE TUNING FORK'}
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={900} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

// UI Helpers
const sliderStyle = (color) => ({
  width: '100%', 
  accentColor: color, 
  cursor: 'pointer', 
  height: '4px',
  background: '#222',
  borderRadius: '2px',
  outline: 'none'
});

const checkboxStyle = (isChecked, activeColor) => ({
  display: 'flex', 
  alignItems: 'center', 
  marginBottom: '15px', 
  cursor: 'pointer',
  fontSize: '12px', 
  color: isChecked ? activeColor : '#888',
  transition: 'color 0.2s ease'
});

const inputStyle = (color) => ({
  width: '16px', 
  height: '16px', 
  accentColor: color, 
  marginRight: '12px',
  cursor: 'pointer'
});

export default AirColumnResonance;