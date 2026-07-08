import { useEffect, useState } from "react";

const base = import.meta.env.BASE_URL;

export default function About() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Background video (FULL VIEWPORT, GitHub Pages safe) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="bg-video"
      >
        <source src={`${base}about/about-bg.mp4`} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="overlay" />

      {/* Page content */}
      <section style={styles.content}>
        <p
          style={{
            ...styles.quote,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(12px)",
          }}
        >
          “Understanding is more powerful than memorization.”
        </p>

        <p
          style={{
            ...styles.statement,
            opacity: show ? 1 : 0,
            transform: show ? "scale(1)" : "scale(0.96)",
          }}
        >
          I AM IN PHYSICS AND PHYSICS IS IN ME
        </p>

        <p
          style={{
            ...styles.reason,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
          }}
        >
          This project started from a simple belief — physics should be seen,
          felt, and explored, not just solved on paper.
        </p>
        <p
          style={{
            ...styles.reason,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
          }}
        >
          "The road was never clear, the resources were never enough, and the timing was rarely perfect—but  kept walking anyway."
        </p>
        <p
          style={{
            ...styles.reason,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
          }}
        >
         ~
         NINGARAJ DAYAMANI
        </p>
         <p
          style={{
            ...styles.reason,
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
          }}
        >
         "
         ningarajdayamani24@gmail.com
         "
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
  },
  quote: {
    fontSize: 20,
    maxWidth: 720,
    marginBottom: 40,
    color: "#bdbdbd",
    transition: "all 0.8s ease",
  },
  statement: {
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: "1px",
    marginBottom: 36,
    color: "#ffffff",
    transition: "all 0.9s ease",
  },
  reason: {
    fontSize: 16,
    maxWidth: 640,
    lineHeight: 1.7,
    color: "#cfcfcf",
    transition: "all 0.9s ease",
  },
};
