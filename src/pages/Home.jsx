import { useNavigate } from "react-router-dom";

const base = import.meta.env.BASE_URL;

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      
  <>
    
    {/* page content */}
  </>

      {/* Background Video */}
      <video
        className="bg-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={`${base}bg.mp4`} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="overlay"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">PiTools</div>
        <div className="nav-right">
         <div className="nav-right">
  <span onClick={() => navigate("/")}>Home</span>
  <span onClick={() => navigate("/simulations")}>Simulations</span>
  <span>About</span>
</div>

        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        {/* Floating Circular Logo */}
        <img
          src={`${base}logo.png`}
          alt="PiTools logo"
          className="logo"
        />

        {/* Typewriter Equation */}
        <h1 className="hero-title">
  <span className="static-line">π =</span>
  <span className="typewriter">tools.calculate(thought);</span>
</h1>


        <p>
          Seeing equations move is the shortest path to understanding.
        </p>

        {/* Interactive Button */}
        <button onClick={() => navigate("/simulations")}>
  Explore →
</button>

      </main>
    </>
  );
}
