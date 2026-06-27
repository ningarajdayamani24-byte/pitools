import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Simulations from "./pages/Simulations";
import Kinematics from "./pages/Kinematics";
import Mechanics  from "./pages/Mechanics"

// kinematics simulations
import VectorAddition from "./pages/kinematics/VectorAddition";
import VectorComponents from "./pages/kinematics/VectorComponents";
import UniformAcceleration1D from "./pages/kinematics/UniformAcceleration1D";
import MotionFromVelocity from "./pages/kinematics/MotionFromVelocity";
import UniformAccelerationSimulation from "./pages/kinematics/UniformAccelerationSimulation";
import TwoObjectKinematics1D from "./pages/kinematics/TwoObjectKinematics1D";
import ProjectileMotion from "./pages/kinematics/ProjectileMotion";
import ExploreProjectileConcepts from "./pages/kinematics/ExploreProjectileConcepts";
import MonkeyHunter from "./pages/kinematics/MonkeyHunter";
import BoatRiver from "./pages/kinematics/BoatRiver";

// mechanics simulations
import FrictionHorizontal from "./pages/mechanics/FrictionHorizontal";
import FrictionIncline from "./pages/mechanics/FrictionIncline";
import InclinePulley from "./pages/mechanics/InclinePulley";
import FreeBodyDiagram from "./pages/mechanics/FreeBodyDiagram";
import NewtonsLaws from "./pages/mechanics/NewtonsLaws";
import VerticalSpring from "./pages/mechanics/VerticalSpring";
import Collisions from "./pages/mechanics/Collisions";
import ExplosiveCollision from "./pages/mechanics/ExplosiveCollision";
import BallisticPendulum from "./pages/mechanics/BallisticPendulum";
import OscillatingMass from "./pages/mechanics/OscillatingMass";
import CenterOfMass from "./pages/mechanics/CenterOfMass";
import Pendulum from "./pages/mechanics/Pendulum";
import ConicalPendulum from "./pages/mechanics/ConicalPendulum";
import RollingBasics from "./pages/mechanics/RollingBasics";
import RollingFriction from "./pages/mechanics/RollingFriction";
import RollingMotion from "./pages/mechanics/RollingMotion";
import MomentOfInertia from "./pages/mechanics/MomentOfInertia";
import Torque from "./pages/mechanics/Torque";
import RotationalLab from "./pages/mechanics/RotationalLab";
import TorqueEquilibrium from "./pages/mechanics/TorqueEquilibrium";
import AngularCollision from "./pages/mechanics/AngularCollision";
import RotatingPlatform from "./pages/mechanics/RotatingPlatform";
import RotatingDisks from "./pages/mechanics/RotatingDisks";
import Kepler from "./pages/mechanics/Kepler";

// general pages
import About from "./pages/About";
import Waves from "./pages/Waves";

// === WAVES SIMULATIONS ===
import SHMCircular from "./pages/waves/SHMCircular"; // Make sure the path matches where you saved it!
import MassOnSpring from "./pages/waves/MassOnSpring";
import LissajousFigures from "./pages/waves/Complex Oscillations (Lissajous)";
import FourierSynthesizer from "./pages/waves/FourierSynthesizer";
import AcousticBeats from "./pages/waves/AcousticBeats";
import PulseInterference from "./pages/waves/PulseInterference";
import AdvancedInterference from "./pages/waves/AdvancedInterference";
import WaveSimulation from "./pages/waves/WaveSimulation";
import TransverseSuperposition from "./pages/waves/TransverseSuperposition";
import PhasorProjections from "./pages/waves/PhasorProjections";
import PhaseShiftSuperposition from "./pages/waves/PhaseShiftSuperposition";
import LongitudinalWaves from "./pages/waves/longitudinal";
import TransverseVsLongitudinal from "./pages/waves/TransverseVsLongitudinal"; 
import StandingWaves from "./pages/waves/StandingWaves";
import StringResonance from "./pages/waves/StringResonance";
import WaveReflection from "./pages/waves/WaveReflection";
import AirColumnResonance from "./pages/waves/AirColumnResonance";
import KundtsTube from "./pages/waves/KundtsTube";
import DopplerEffect from "./pages/waves/DopplerEffect";
import WaveInterference from "./pages/waves/WaveInterference";
import SurfaceWaves from "./pages/waves/SurfaceWaves";
import ChladniFigures from "./pages/waves/ChladniFigures";

import light from "./pages/light";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Layout route: Navbar appears on ALL pages */}
        <Route element={<MainLayout />}>

          {/* main pages */}
          <Route path="/" element={<Home />} />
          <Route path="/simulations" element={<Simulations />} />
          
          <Route path="/kinematics" element={<Kinematics />} />

          {/* kinematics simulations */}
          <Route path="/kinematics/vectors/addition" element={<VectorAddition />} />
          <Route path="/kinematics/vectors/components" element={<VectorComponents />} />
          <Route path="/kinematics/uniform-acceleration-1d" element={<UniformAcceleration1D />} />
          <Route path="/kinematics/motion-from-velocity" element={<MotionFromVelocity />} />
          <Route path="/kinematics/uniform-acceleration-simulation" element={<UniformAccelerationSimulation />} />
          <Route path="/kinematics/two-object-1d" element={<TwoObjectKinematics1D />} />
          <Route path="/kinematics/projectile-motion" element={<ProjectileMotion />} />
          <Route path="/kinematics/projectile-concepts" element={<ExploreProjectileConcepts />} />
          <Route path="/kinematics/monkey-hunter" element={<MonkeyHunter />} />
          <Route path="/kinematics/relative-velocity/boat-river" element={<BoatRiver />} />
          
          {/* mechanics */}
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/mechanics/friction-horizontal" element={<FrictionHorizontal />} />
          <Route path="/mechanics/friction-incline" element={<FrictionIncline />} />
          <Route path="/mechanics/incline-pulley" element={<InclinePulley />} />
          <Route path="/mechanics/free-body-diagram" element={<FreeBodyDiagram />} />
          <Route path="/mechanics/newtons-laws" element={<NewtonsLaws />} />
          <Route path="/mechanics/vertical-spring" element={<VerticalSpring />} />
          <Route path="/mechanics/collisions" element={<Collisions />} />
          <Route path="/mechanics/explosive-collision" element={<ExplosiveCollision />} />
          <Route path="/mechanics/ballistic-pendulum" element={<BallisticPendulum />} />  
          <Route path="/mechanics/oscillating-mass" element={<OscillatingMass />} />
          <Route path="/mechanics/center-of-mass" element={<CenterOfMass />} />
          <Route path="/mechanics/pendulum" element={<Pendulum />} />
          <Route path="/mechanics/conical-pendulum" element={<ConicalPendulum />} />
          <Route path="/mechanics/rolling-basics" element={<RollingBasics />} />
          <Route path="/mechanics/rolling-friction" element={<RollingFriction />} />
          <Route path="/mechanics/rolling-motion" element={<RollingMotion />} />
          <Route path="/mechanics/moment-of-inertia" element={<MomentOfInertia />} />       
          <Route path="/mechanics/torque" element={<Torque />} />
          <Route path="/mechanics/rotational-lab" element={<RotationalLab />} />
          <Route path="/mechanics/torque-equilibrium" element={<TorqueEquilibrium />} />    
          <Route path="/mechanics/angular-collision" element={<AngularCollision />} />     
          <Route path="/mechanics/rotating-platform" element={<RotatingPlatform />} />     
          <Route path="/mechanics/rotating-disks" element={<RotatingDisks />} />
          <Route path="/mechanics/kepler" element={<Kepler />} />
          
          <Route path="/about" element={<About />} />
        {/* === WAVES === */}
          <Route path="/waves" element={<Waves />} />
          <Route path="/waves/shm-circular-transverse" element={<SHMCircular />} />
          <Route path="/waves/mass-on-spring" element={<MassOnSpring />} /> {/* ADD THIS LINE */}
          <Route path="/waves/lissajous" element={<LissajousFigures />} />
          <Route path="/waves/fourier-synthesizer" element={<FourierSynthesizer />} />       
          <Route path="/waves/acoustic-beats" element={<AcousticBeats />} />
          <Route path="/waves/pulse-interference" element={<PulseInterference />} />
          <Route path="/waves/advanced-interference" element={<AdvancedInterference />} />
          <Route path="/waves/boundary-reflection" element={<WaveSimulation />} />
          <Route path="/waves/transverse-superposition" element={<TransverseSuperposition />} />
          <Route path="/waves/phasor-projections"     element={<PhasorProjections />} />
          <Route path="/waves/phase-shift" element={<PhaseShiftSuperposition />} />
          <Route path="/waves/longitudinal" element={<LongitudinalWaves />} />
          <Route path="/waves/comparison" element={<TransverseVsLongitudinal />} />
          <Route path="/waves/standing" element={<StandingWaves />} />
          <Route path="/waves/string-resonance" element={<StringResonance />} /> 
          <Route path="/waves/reflection" element={<WaveReflection />} />
          <Route path="/waves/air-column" element={<AirColumnResonance />} />
          <Route path="/waves/kundt" element={<KundtsTube />} />
          <Route path="/waves/doppler" element={<DopplerEffect />} />
          <Route path="/waves/interference" element={<WaveInterference />} />
          <Route path="/waves/surface" element={<SurfaceWaves />} />
          <Route path="/waves/chladni" element={<ChladniFigures />} />
          <Route path="/light" element={<light />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}