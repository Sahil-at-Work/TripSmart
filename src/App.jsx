import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Locations from './pages/Locations';
import About from './pages/About';
import Profile from './pages/Profile';
import ItineraryPlanner from './pages/ItineraryPlanner';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCityId, setSelectedCityId] = useState();

  function handleNavigate(page, cityId) {
    setCurrentPage(page);
    setSelectedCityId(cityId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'locations':
        return <Locations selectedCityId={selectedCityId} onNavigate={handleNavigate} />;
      case 'about':
        return <About />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
      case 'planner':
        return <ItineraryPlanner />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        {renderPage()}
      </div>
    </AuthProvider>
  );
}

export default App;
