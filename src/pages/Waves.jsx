import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Ensure you have react-router-dom installed

/* ================= DATA SOURCE WITH PATHS ================= */
const TOPICS = [
  { 
    id: 1, 
    title: "SHM & Circular Motion", 
    desc: "Relating circular motion to transverse waves.",
    path: "/waves/shm-circular" 
  },
  { 
    id: 2, 
    title: "Mass on a Spring", 
    desc: "Simple harmonic motion dynamics and energy.",
    path: "/waves/spring-mass" 
  },
  { 
    id: 3, 
    title: "Oscillation Graphs Quiz", 
    desc: "Test your understanding of position, velocity, acceleration graphs.",
    path: "/waves/graphs-quiz" 
  },
  { 
    id: 4, 
    title: "SHM Tutorial", 
    desc: "Step-by-step guide to harmonic motion principles.",
    path: "/waves/shm-tutorial" 
  },
  { 
    id: 5, 
    title: "Waves Tutorial", 
    desc: "Introduction to wavelength, frequency, and speed.",
    path: "/waves/waves-tutorial" 
  },
  { 
    id: 6, 
    title: "Pulse Interference", 
    desc: "Superposition of two wave pulses.",
    path: "/waves/pulse-interference" 
  },
  { 
    id: 7, 
    title: "Interference Part 2", 
    desc: "Complex pulse interactions and superposition.",
    path: "/waves/interference-2" 
  },
  { 
    id: 8, 
    title: "Superposition Practice", 
    desc: "Interactive drills on adding wave amplitudes.",
    path: "/waves/superposition-practice" 
  },
  { 
    id: 9, 
    title: "Transverse Superposition", 
    desc: "Continuous wave interference patterns.",
    path: "/waves/transverse-superposition" 
  },
  { 
    id: 10, 
    title: "Oscillations", 
    desc: "General properties of oscillating systems.",
    path: "/waves/oscillations" 
  },
  { 
    id: 11, 
    title: "Phase Shift", 
    desc: "Understanding lead, lag, and phase angles.",
    path: "/waves/phase-shift" 
  },
  { 
    id: 12, 
    title: "Longitudinal Waves", 
    desc: "Compression and rarefaction in media.",
    path: "/waves/longitudinal" 
  },
  { 
    id: 13, 
    title: "Wave Basics", 
    desc: "Comparing longitudinal vs transverse motion.",
    path: "/waves/basics" 
  },
  { 
    id: 14, 
    title: "Standing Waves", 
    desc: "Nodes, antinodes, and harmonic series.",
    path: "/waves/standing-waves" 
  },
  { 
    id: 15, 
    title: "String Harmonics", 
    desc: "Standing waves on fixed-fixed strings.",
    path: "/waves/string-harmonics" 
  },
  { 
    id: 16, 
    title: "Pulse Reflection", 
    desc: "Boundary behaviors: Free vs. Fixed ends.",
    path: "/waves/reflection" 
  },
  { 
    id: 17, 
    title: "Air Column Resonance", 
    desc: "Sound waves in open and closed pipes.",
    path: "/waves/air-resonance" 
  },
  { 
    id: 18, 
    title: "Longitudinal Resonance", 
    desc: "Visualizing air particle displacement in pipes.",
    path: "/waves/longitudinal-resonance" 
  },
];

/* ================= MAIN COMPONENT ================= */
export default function WavesMenu() {
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.header}>Waves & Oscillations Library</h1>
      
      <div style={styles.grid}>
        {TOPICS.map((topic) => (
          <MenuCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}

/* ================= CARD COMPONENT ================= */
function MenuCard({ topic }) {
  const [hover, setHover] = useState(false);
  const imagePath = `/assets/waves/wave-${topic.id}.png`;

  return (
    // Wrap the card in a Link to make the whole area clickable
    <Link 
      to={topic.path} 
      style={{ textDecoration: 'none' }}
    >
      <div 
        style={{
          ...styles.card,
          borderColor: hover ? "#021651" : "#ffffff",
          transform: hover ? "translateY(-4px)" : "none",
          boxShadow: hover ? "0 10px 20px rgba(6, 48, 125, 0.75)" : "none"
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* IMAGE PREVIEW AREA */}
        <div style={styles.preview}>
          <div style={styles.gridPattern} />
          
          <img 
            src={imagePath} 
            alt={topic.title}
            style={{
              ...styles.image,
              opacity: hover ? 1 : 0.8,
              transform: hover ? "scale(1.05)" : "scale(1)"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.style.background = '#111';
            }}
          />
        </div>

        {/* TEXT CONTENT */}
        <div style={styles.content}>
          <h3 style={styles.title}>{topic.title}</h3>
          <p style={styles.desc}>{topic.desc}</p>
        </div>
      </div>
    </Link>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#050505',
    color: '#fff',
    padding: '60px 40px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    fontSize: '24px',
    fontWeight: '400',
    letterSpacing: '1px',
    marginBottom: '40px',
    borderBottom: '1px solid #222',
    paddingBottom: '20px',
    color: '#eee'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    background: '#0a0a0c',
    border: '1px solid #222',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  preview: {
    height: '160px',
    position: 'relative',
    borderBottom: '1px solid #1a1a1a',
    overflow: 'hidden',
    background: '#08080a',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'all 0.5s ease',
    display: 'block',
  },
  gridPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `
      linear-gradient(to right, #1a1a1a 1px, transparent 1px),
      linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
    opacity: 0.2,
    zIndex: 1,
    pointerEvents: 'none',
  },
  content: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#fff',
  },
  desc: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    lineHeight: '1.5',
  },
};