import { useNavigate } from "react-router-dom";

const base = import.meta.env.BASE_URL;

export default function Mechanics() {
  const navigate = useNavigate();

  return (
    <section className="mechanics-page">
      <h1 className="page-title">Mechanics</h1>
      <p className="page-subtitle">
        Forces, energy, rotation and motion — interactive mechanics simulations.
      </p>

      {/* ================= FORCES ================= */}
      <Section title="Forces & Newton’s Laws" />

      <div className="topic-grid">
        <Card
          title="Friction: Pulling a Box on a Horizontal Surface"
          desc="Static and kinetic friction on a flat surface."
          img={`${base}mechanics/previews/friction-horizontal.jpg`}
          onClick={() => navigate("/mechanics/friction-horizontal")}
        />
        <Card
          title="Static and Kinetic Friction on an Inclined Plane"
          desc="Motion thresholds on slopes."
          img={`${base}mechanics/previews/friction-incline.jpg`}
          onClick={() => navigate("/mechanics/friction-incline")}
        />
        <Card
          title="Inclined Plane with Friction, Two Masses, and a Pulley"
          desc="Coupled systems with tension."
          img={`${base}mechanics/previews/incline-pulley.jpg`}
          onClick={() => navigate("/mechanics/incline-pulley")}
        />
        <Card
          title="Forces & Free Body Diagrams"
          desc="Visualize all forces acting on objects."
          img={`${base}mechanics/previews/free-body-diagram.jpg`}
          onClick={() => navigate("/mechanics/free-body-diagram")}
        />
        <Card
          title="Newton’s Laws of Motion"
          desc="Force, mass and acceleration."
          img={`${base}mechanics/previews/newtons-laws.jpg`}
          onClick={() => navigate("/mechanics/newtons-laws")}
        />
      </div>

      <Divider />

      {/* ================= CONSERVATION ================= */}
      <Section title="Conservation Laws" />

      <div className="topic-grid">
        <Card
          title="Energy: Mass on a Vertical Spring"
          desc="Energy exchange in oscillations."
          img={`${base}mechanics/previews/vertical-spring-energy.jpg`}
          onClick={() => navigate("/mechanics/vertical-spring")}
        />
        <Card
          title="Elastic & Inelastic Collisions"
          desc="Momentum and energy conservation."
          img={`${base}mechanics/previews/collisions.jpg`}
          onClick={() => navigate("/mechanics/collisions")}
        />
        <Card
          title="Explosive Collisions"
          desc="Internal forces and separation."
          img={`${base}mechanics/previews/explosive-collision.jpg`}
          onClick={() => navigate("/mechanics/explosive-collision")}
        />
        <Card
          title="The Ballistic Pendulum"
          desc="Projectile speed from momentum."
          img={`${base}mechanics/previews/ballistic-pendulum.jpg`}
          onClick={() => navigate("/mechanics/ballistic-pendulum")}
        />
        <Card
          title="Dropping Mass on an Oscillating Mass"
          desc="Energy transfer between systems."
          img={`${base}mechanics/previews/oscillating-mass.jpg`}
          onClick={() => navigate("/mechanics/oscillating-mass")}
        />
        <Card
          title="Center of Mass: Floating Raft"
          desc="Motion without external force."
          img={`${base}mechanics/previews/center-of-mass.jpg`}
          onClick={() => navigate("/mechanics/center-of-mass")}
        />
      </div>

      <Divider />

      {/* ================= OSCILLATIONS ================= */}
      <Section title="Oscillations" />

      <div className="topic-grid">
        <Card
          title="The Pendulum"
          desc="Simple harmonic motion."
          img={`${base}mechanics/previews/pendulum.jpg`}
          onClick={() => navigate("/mechanics/pendulum")}
        />
        <Card
          title="The Conical Pendulum"
          desc="Circular motion under tension."
          img={`${base}mechanics/previews/conical-pendulum.jpg`}
          onClick={() => navigate("/mechanics/conical-pendulum")}
        />
      </div>

      <Divider />

      {/* ================= ROTATION ================= */}
      <Section title="Rotation & Rigid Body Dynamics" />

      <div className="topic-grid">
        <Card
          title="Rolling Motion Basics"
          desc="Pure rolling and slipping."
          img={`${base}mechanics/previews/rolling-basics.jpg`}
          onClick={() => navigate("/mechanics/rolling-basics")}
        />
        <Card
          title="Sliding, Rolling & Friction"
          desc="Transitions between motion types."
          img={`${base}mechanics/previews/rolling-friction.jpg`}
          onClick={() => navigate("/mechanics/rolling-friction")}
        />
        <Card
          title="Rolling Motion"
          desc="Dynamics of rolling bodies."
          img={`${base}mechanics/previews/rolling-motion.jpg`}
          onClick={() => navigate("/mechanics/rolling-motion")}
        />
        <Card
          title="Moment of Inertia on an Incline"
          desc="Effect of mass distribution."
          img={`${base}mechanics/previews/moment-of-inertia.jpg`}
          onClick={() => navigate("/mechanics/moment-of-inertia")}
        />
        <Card
          title="Rotational Inertia & Torque"
          desc="Torque-driven rotation."
          img={`${base}mechanics/previews/torque.jpg`}
          onClick={() => navigate("/mechanics/torque")}
        />
        <Card
          title="Rotational Inertia Lab"
          desc="Compare rotational systems."
          img={`${base}mechanics/previews/rotational-lab.jpg`}
          onClick={() => navigate("/mechanics/rotational-lab")}
        />
        <Card
          title="Torque Equilibrium"
          desc="Static equilibrium problems."
          img={`${base}mechanics/previews/torque-equilibrium.jpg`}
          onClick={() => navigate("/mechanics/torque-equilibrium")}
        />
      </div>

      <Divider />

      {/* ================= ANGULAR MOMENTUM ================= */}
      <Section title="Angular Momentum" />

      <div className="topic-grid">
        <Card
          title="Angular Momentum Collision"
          desc="Rotational collisions."
          img={`${base}mechanics/previews/angular-collision.jpg`}
          onClick={() => navigate("/mechanics/angular-collision")}
        />
        <Card
          title="Person on a Rotating Platform"
          desc="Conservation of angular momentum."
          img={`${base}mechanics/previews/rotating-platform.jpg`}
          onClick={() => navigate("/mechanics/rotating-platform")}
        />
        <Card
          title="Rotating Disks"
          desc="Coupled rotating systems."
          img={`${base}mechanics/previews/rotating-disks.jpg`}
          onClick={() => navigate("/mechanics/rotating-disks")}
        />
      </div>

      <Divider />

      {/* ================= GRAVITATION ================= */}
      <Section title="Gravitation & Orbits" />

      <div className="topic-grid">
        <Card
          title="Elliptical Orbits & Kepler’s Second Law"
          desc="Planetary motion."
          img={`${base}mechanics/previews/kepler.jpg`}
          onClick={() => navigate("/mechanics/kepler")}
        />
      </div>
    </section>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Card({ title, desc, img, onClick }) {
  return (
    <div className="topic-card" onClick={onClick}>
      <div className="topic-media">
        <img src={img} alt={title} loading="lazy" />
      </div>
      <div className="topic-text">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function Section({ title }) {
  return <h2 className="section-title">{title}</h2>;
}

function Divider() {
  return <hr className="section-divider" />;
}
