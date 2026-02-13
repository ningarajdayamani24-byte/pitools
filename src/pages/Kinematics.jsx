import { useNavigate } from "react-router-dom";


const base = import.meta.env.BASE_URL;

export default function Kinematics() {
  const navigate = useNavigate();

  return (
    <>
      {/* NAVBAR */}
     

      <div className="kinematics-page">
        <h1 className="page-title">Kinematics</h1>
        <p className="page-subtitle">
          Study of motion without considering the forces that cause it.
        </p>

        {/* ================= VECTORS ================= */}
        <Section title="Vectors (Foundation)">
          <Topic
            title="Vector Addition"
            desc="Head-to-tail and parallelogram methods of vector addition."
            image={`${base}images/kinematics/vector-addition.png`}
            active
            onClick={() => navigate("/kinematics/vectors/addition")}
          />

          <Topic
            title="Vector Components"
            desc="Resolving vectors into horizontal and vertical components."
            image={`${base}images/kinematics/vector-components.png`}
            active
            onClick={() => navigate("/kinematics/vectors/components")}
          />
        </Section>

        {/* ================= 1D MOTION ================= */}
        <Section title="Motion in One Dimension">
          <Topic
            title="Uniform Acceleration in One Dimension"
            desc="Position, velocity, and acceleration as functions of time."
            image={`${base}images/kinematics/uniform-acceleration-1d.png`}
            active
            onClick={() => navigate("/kinematics/uniform-acceleration-1d")}
          />

          <Topic
            title="Position, Velocity, and Acceleration vs Time"
            desc="x–t, v–t, and a–t motion graphs."
            image={`${base}images/kinematics/motion-graphs.png`}
            active
            onClick={() => navigate("/kinematics/motion-from-velocity")}
          />

          <Topic
            title="Uniform Acceleration (Equations)"
            desc="Kinematic equations and their physical interpretation."
            image={`${base}images/kinematics/kinematic-equations.png`}
            active
            onClick={() =>
              navigate("/kinematics/uniform-acceleration-simulation")
            }
          />

          <Topic
            title="Two Object System (1D)"
            desc="Relative separation and meeting of two objects."
            image={`${base}images/kinematics/two-object-1d.png`}
            active
            onClick={() => navigate("/kinematics/two-object-1d")}
          />
        </Section>

        {/* ================= 2D MOTION ================= */}
        <Section title="Motion in Two Dimensions">
          <Topic
            title="Projectile Motion"
            desc="Motion of a body projected under gravity."
            image={`${base}images/kinematics/projectile-motion.png`}
            active
            onClick={() => navigate("/kinematics/projectile-motion")}
          />

          <Topic
            title="Exploring Projectile Motion Concepts"
            desc="Time of flight, range, and maximum height."
            image={`${base}images/kinematics/projectile-concepts.png`}
            active
            onClick={() => navigate("/kinematics/projectile-concepts")}
          />

          <Topic
            title="Projectile Motion – Monkey and Hunter"
            desc="Why aiming directly always hits the monkey."
            image={`${base}images/kinematics/monkey-hunter.png`}
            active
            onClick={() => navigate("/kinematics/monkey-hunter")}
          />
        </Section>

        {/* ================= RELATIVE MOTION ================= */}
        <Section title="Relative Motion">
          <Topic
            title="Boat Crossing a River"
            desc="Relative velocity in different reference frames."
            image={`${base}images/kinematics/boat-river.png`}
            active
            onClick={() =>
              navigate("/kinematics/relative-velocity/boat-river")
            }
          />
        </Section>
      </div>
    </>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="kin-section">
      <h2 className="section-title">{title}</h2>
      <div className="topic-grid">{children}</div>
    </div>
  );
}

function Topic({ title, desc, image, onClick, active }) {
  return (
    <div
      className={`topic-card ${active ? "active" : "disabled"}`}
      onClick={active ? onClick : undefined}
    >
      <div className="topic-media">
        <img src={image} alt={title} loading="lazy" />
      </div>

      <div className="topic-text">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}
