import React, { useState } from 'react';

export default function LightMixing() {
  const [colors, setColors] = useState({ red: 150, green: 150, blue: 150 });

  // Conversion Helpers
  const rgbToHex = (r, g, b) => 
    "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(0)}%, ${(l * 100).toFixed(0)}%)`;
  };

  const rgbStr = `rgb(${colors.red}, ${colors.green}, ${colors.blue})`;
  const hexStr = rgbToHex(colors.red, colors.green, colors.blue);
  const hslStr = rgbToHsl(colors.red, colors.green, colors.blue);

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.header}>Advanced Light Synthesis Lab</h1>
      
      <div style={styles.container}>
        <div style={styles.preview}>
          <div style={styles.gridPattern} />
          <div style={styles.stage}>
            <div style={{ ...styles.spot, background: `rgba(255, 0, 0, ${colors.red/255})`, left: '35%' }} />
            <div style={{ ...styles.spot, background: `rgba(0, 255, 0, ${colors.green/255})`, left: '45%' }} />
            <div style={{ ...styles.spot, background: `rgba(0, 0, 255, ${colors.blue/255})`, left: '55%' }} />
          </div>
        </div>

        <div style={styles.controls}>
          {['red', 'green', 'blue'].map((color) => (
            <div key={color} style={styles.controlGroup}>
              <label style={styles.label}>{color.toUpperCase()}</label>
              <input type="range" min="0" max="255" value={colors[color]} onChange={(e) => setColors(prev => ({ ...prev, [color]: parseInt(e.target.value) }))} style={{ ...styles.slider, accentColor: color }} />
            </div>
          ))}
          
          <div style={styles.dataPanel}>
            <div style={styles.dataRow}><span>RGB Value:</span> <code>{rgbStr}</code></div>
            <div style={styles.dataRow}><span>HEX Code:</span> <code>{hexStr}</code></div>
            <div style={styles.dataRow}><span>HSL Value:</span> <code>{hslStr}</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: '#050505', color: '#fff', padding: '60px 40px', fontFamily: 'monospace' },
  header: { fontSize: '24px', marginBottom: '40px', borderBottom: '1px solid #222', paddingBottom: '20px' },
  container: { maxWidth: '800px', margin: '0 auto', background: '#0a0a0c', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' },
  preview: { height: '350px', position: 'relative', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gridPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: '20px 20px' },
  stage: { position: 'relative', width: '300px', height: '200px' },
  spot: { position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', mixBlendMode: 'screen', transition: 'all 0.2s ease', filter: 'blur(30px)' },
  controls: { padding: '40px' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' },
  label: { width: '60px', fontSize: '12px', opacity: 0.7 },
  slider: { flex: 1, cursor: 'pointer', height: '4px', appearance: 'none', background: '#222' },
  dataPanel: { marginTop: '30px', padding: '20px', background: '#08080a', borderRadius: '8px', border: '1px solid #222' },
  dataRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#aaa' }
};