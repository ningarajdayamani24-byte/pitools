import { useEffect, useState } from "react";

const base = import.meta.env.BASE_URL;

export default function Waves() {
  const text = "WAVES  ≈  ∂²ψ/∂t² = v² ∂²ψ/∂x²";
  const [display, setDisplay] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i < text.length) {
      const t = setTimeout(() => {
        setDisplay(text.slice(0, i + 1));
        setI(i + 1);
      }, 70);
      return () => clearTimeout(t);
    }
  }, [i, text]);

  return (
    <>
      {/* Background video (FULL VIEWPORT, GitHub Pages safe) */}
      <video
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={`${base}waves-bg.mp4`} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="overlay" />

      {/* Page content */}
      <section className="waves-page" style={styles.content}>
        <h1 style={styles.title}>
          {display}
          <span style={styles.cursor}>|</span>
        </h1>

        <p style={styles.subtitle}>Coming Soon</p>

        <p style={styles.desc}>
          Oscillations, interference, superposition — visualized.
        </p>
      </section>
    </>
  );
}

const styles = {
  content: {
    position: "relative",
    zIndex: 5,
    minHeight: "100vh",
    padding: "120px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#e5e5e5",
    fontFamily: "JetBrains Mono, monospace",
  },
  title: {
    fontSize: "2.6rem",
    marginBottom: "1.2rem",
    letterSpacing: "1px",
  },
  cursor: {
    marginLeft: "4px",
    opacity: 0.7,
  },
  subtitle: {
    fontSize: "1.05rem",
    marginTop: "0.6rem",
    color: "#cfcfcf",
  },
  desc: {
    marginTop: "0.6rem",
    fontSize: "0.95rem",
    color: "#9aa4b2",
  },
};
