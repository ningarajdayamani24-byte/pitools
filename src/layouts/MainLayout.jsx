import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />

      {/* GLOBAL SCROLL CONTAINER */}
      <div className="app-scroll">
        <Outlet />
      </div>
    </>
  );
}
