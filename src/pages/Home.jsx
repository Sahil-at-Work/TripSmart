import { useEffect, useState } from 'react';
import { MapPin, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Home({ onNavigate }) {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (!error && data) {
      setCities(data);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Your Simple Travel Buddy
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-50 max-w-2xl mx-auto">
            Plan smarter trips with AI-powered itineraries, weather forecasts, and local insights
          </p>
          <button
            onClick={() => onNavigate(user ? 'planner' : 'locations')}
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition shadow-lg transform hover:scale-105"
          >
            {user ? 'Start Planning' : 'Explore Destinations'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <MapPin className="text-blue-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Discover Cities</h3>
            <p className="text-gray-600 leading-relaxed">
              Explore amazing destinations with detailed guides, attractions, and local tips
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-cyan-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Calendar className="text-cyan-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Smart Planning</h3>
            <p className="text-gray-600 leading-relaxed">
              Create optimized itineraries with weather forecasts and travel distance calculations
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-green-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Save Itineraries</h3>
            <p className="text-gray-600 leading-relaxed">
              Keep all your travel plans organized and accessible from anywhere
            </p>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Sparkles className="text-blue-600" size={32} />
            <h2 className="text-4xl font-bold text-gray-800">Popular Destinations</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-md">
              <MapPin size={48} className="text-blue-600 mx-auto mb-4" />
              <p className="text-gray-800 text-xl font-semibold mb-2">Ready to explore the world?</p>
              <p className="text-gray-600 text-lg mb-6">Sign up to start planning your trip, buddy!</p>
              {!user && (
                <button
                  onClick={() => onNavigate('locations')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
                >
                  Get Started
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => onNavigate('locations', city.id)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition group"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 relative overflow-hidden">
                    {city.image_url ? (
                      <img
                        src={city.image_url}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin size={64} className="text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{city.name}</h3>
                    <p className="text-blue-600 font-medium mb-3">{city.country}</p>
                    <p className="text-gray-600 line-clamp-2 mb-4">{city.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={16} />
                      <span>Best time: {city.best_time_to_visit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
