import { useNavigate } from "react-router-dom";

const base = import.meta.env.BASE_URL;

export default function Simulations() {
  const navigate = useNavigate();

  return (
    <>
      {/* NAVBAR (shared component) */}
      

      {/* SIMULATIONS PAGE CONTENT */}
      <section className="simulations-page">
        <h1 className="sim-title">Simulations</h1>

        <div className="sim-grid">

          {/* KINEMATICS CARD */}
          <div
            className="sim-card"
            onClick={() => navigate("/kinematics")}
          >
            <video
              src={`${base}simulations/kinematics-preview.mp4`}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="sim-info">
              <h3>Kinematics</h3>
              <p>Motion, velocity and acceleration visualized.</p>
            </div>
          </div>

          {/* MECHANICS CARD */}
          <div
            className="sim-card"
            onClick={() => navigate("/mechanics")}
          >
            <video
              src={`${base}simulations/mechanics-preview.mp4`}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="sim-info">
              <h3>Mechanics</h3>
              <p>Forces, motion and interactions explained.</p>
            </div>
          </div>

          
          <div
            className="sim-card"
            onClick={() => navigate("/waves")}
          >
            <video
              src={`${base}simulations/waves-preview.mp4`}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="sim-info">
              <h3>Waves</h3>
              <p>Oscillations, superposition, interference.</p>
            </div>
          </div>
          <div
            className="sim-card"
            onClick={() => navigate("/light")}
          >
            <video
              src={`${base}waves-bg.mp4`}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="sim-info">
              <h3>light</h3>
              <p>reflection ,refraction, interference.</p>
            </div>
          </div>


        </div>
      </section>
    </>
  );
}
