import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Gestures from './pages/Gestures';
import ModelTraining from './pages/ModelTraining';
import ActionMapping from './pages/ActionMapping';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      {/* Ensure this flex container is visible */}
      <div className="flex bg-[#0d1117] min-h-screen text-slate-300">
        <Sidebar />
        <main className="flex-1 p-4">
          <Routes>
            {/* If you are at http://localhost:3000/ this route MUST exist */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/gestures" element={<Gestures />} />
            <Route path="/training" element={<ModelTraining />} /> 
            <Route path="/mapping" element={<ActionMapping />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;