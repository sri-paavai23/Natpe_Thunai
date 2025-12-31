"use client";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import OfflinePage from './pages/OfflinePage'; // Import the new OfflinePage

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/offline" element={<OfflinePage />} /> {/* Add the offline route */}
        {/* You can add a catch-all route for 404s that also redirects to offline if needed */}
        <Route path="*" element={<OfflinePage />} />
      </Routes>
    </Router>
  );
}

export default App;