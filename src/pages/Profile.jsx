import { useEffect, useState } from 'react';
import { User, Mail, Calendar, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import ItineraryDetail from '../components/ItineraryDetail';

export default function Profile({ onNavigate }) {
  const { user, profile } = useAuth();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  useEffect(() => {
    if (user) {
      loadItineraries();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadItineraries() {
    if (!user) return;

    const { data, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        city:cities(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItineraries(data);
    }
    setLoading(false);
  }

  async function deleteItinerary(id) {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (!error) {
      setItineraries(itineraries.filter(i => i.id !== id));
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center max-w-md">
          <User size={64} className="text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8">
            Please sign in to view your profile and saved itineraries
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </div>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">My Profile</h1>
          <p className="text-xl text-blue-50">Manage your travel plans and preferences</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <User size={28} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">User Info</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <User size={16} />
                  Name
                </label>
                <p className="text-lg font-semibold text-gray-800">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <Mail size={16} />
                  Email
                </label>
                <p className="text-lg font-semibold text-gray-800">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <Calendar size={16} />
                  Member Since
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Saved Itineraries</h2>
              <button
                onClick={() => onNavigate('planner')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Create New
              </button>
            </div>

            {itineraries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">No itineraries saved yet</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition"
                >
                  Start planning your first trip
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {itineraries.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => setSelectedItinerary(itinerary)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{itinerary.title}</h3>
                        <p className="text-blue-600 font-medium">{itinerary.city.name}, {itinerary.city.country}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('locations', itinerary.city_id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View destination"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItinerary(itinerary.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete itinerary"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{new Date(itinerary.start_date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{new Date(itinerary.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedItinerary && (
        <ItineraryDetail
          itinerary={selectedItinerary}
          onClose={() => setSelectedItinerary(null)}
          onUpdate={() => {
            loadItineraries();
          }}
        />
      )}
    </div>
  );
}
