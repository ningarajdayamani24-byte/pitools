import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="nav-left" onClick={() => navigate("/")}>
        PiTools
      </div>

      <div className="nav-right">
        <span onClick={() => navigate("/")}>Home</span>
        <span onClick={() => navigate("/simulations")}>Simulations</span>
        <span onClick={() => navigate("/about")}>About</span>
      </div>
    </nav>
  );
}
