import { useEffect, useState } from 'react';
import { Calendar, MapPin, Plus, Trash2, Save, Cloud, Navigation, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import { getWeatherByCoordinates } from '../services/weatherService';

export default function ItineraryPlanner() {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [selectedAttractions, setSelectedAttractions] = useState([]);
  const [itineraryTitle, setItineraryTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [weatherData, setWeatherData] = useState({});

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
  }

  async function handleCitySelect(cityId) {
    const city = cities.find(c => c.id === cityId);
    if (!city) return;

    setSelectedCity(city);
    setItineraryTitle(`Trip to ${city.name}`);

    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('city_id', cityId)
      .order('name');

    if (!error && data) {
      setAttractions(data);
    }

    if (city.latitude && city.longitude) {
      const weather = await getWeatherByCoordinates(city.latitude, city.longitude);
      if (weather) {
        setWeatherData({ current: weather });
      }
    }
  }

  function addAttraction(attraction) {
    if (!startDate) {
      alert('Please select start date first');
      return;
    }

    const existingOrder = selectedAttractions.filter(sa => sa.date === startDate).length;

    setSelectedAttractions([
      ...selectedAttractions,
      {
        attraction,
        date: startDate,
        order: existingOrder + 1,
      },
    ]);
  }

  function removeAttraction(index) {
    setSelectedAttractions(selectedAttractions.filter((_, i) => i !== index));
  }

  function getWeatherDisplay() {
    if (weatherData.current) {
      return {
        temp: `${weatherData.current.temperature}°C`,
        description: weatherData.current.description,
        icon: weatherData.current.icon,
      };
    }
    return null;
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function getTotalDistance() {
    let total = 0;
    for (let i = 0; i < selectedAttractions.length - 1; i++) {
      const current = selectedAttractions[i].attraction;
      const next = selectedAttractions[i + 1].attraction;
      total += calculateDistance(current.latitude, current.longitude, next.latitude, next.longitude);
    }
    return total;
  }

  function getTotalDuration() {
    return selectedAttractions.reduce((sum, sa) => sum + sa.attraction.estimated_duration_hours, 0);
  }

  async function saveItinerary() {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!selectedCity || !itineraryTitle || !startDate || !endDate || selectedAttractions.length === 0) {
      alert('Please fill all fields and add at least one attraction');
      return;
    }

    setSaving(true);

    try {
      console.log('Saving itinerary for user:', user.id);

      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .insert([
          {
            user_id: user.id,
            city_id: selectedCity.id,
            title: itineraryTitle,
            start_date: startDate,
            end_date: endDate,
          },
        ])
        .select()
        .single();

      if (itineraryError) {
        console.error('Error saving itinerary:', itineraryError);
        throw itineraryError;
      }

      console.log('Itinerary saved:', itinerary);

      const items = selectedAttractions.map(sa => ({
        itinerary_id: itinerary.id,
        attraction_id: sa.attraction.id,
        visit_date: sa.date,
        visit_order: sa.order,
      }));

      const { error: itemsError } = await supabase
        .from('itinerary_items')
        .insert(items);

      if (itemsError) {
        console.error('Error saving itinerary items:', itemsError);
        throw itemsError;
      }

      console.log('Itinerary items saved successfully');
      alert('Itinerary saved successfully!');

      setSelectedCity(null);
      setSelectedAttractions([]);
      setItineraryTitle('');
      setStartDate('');
      setEndDate('');
      setAttractions([]);
    } catch (error) {
      console.error('Save itinerary error:', error);
      alert('Error saving itinerary: ' + (error.message || 'Unknown error. Please check the console for details.'));
    } finally {
      setSaving(false);
    }
  }


  const attractionsByDate = selectedAttractions.reduce((acc, sa) => {
    if (!acc[sa.date]) {
      acc[sa.date] = [];
    }
    acc[sa.date].push(sa);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center max-w-md">
          <Calendar size={64} className="text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8">
            Please sign in to create and save your travel itineraries
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Smart Itinerary Planner</h1>
          <p className="text-xl text-blue-50">Create your perfect travel plan with weather insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Trip Details</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination City
                  </label>
                  <select
                    value={selectedCity?.id || ''}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select a city</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    value={itineraryTitle}
                    onChange={(e) => setItineraryTitle(e.target.value)}
                    placeholder="My Amazing Trip"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {selectedCity && attractions.length > 0 && (
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Attractions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {attractions.map((attraction) => (
                    <div
                      key={attraction.id}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">{attraction.name}</h3>
                        <button
                          onClick={() => addAttraction(attraction)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                          title="Add to itinerary"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{attraction.description}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{attraction.estimated_duration_hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedAttractions.length > 0 && (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 rounded-2xl shadow-lg text-white">
                  <h3 className="text-xl font-bold mb-4">Trip Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Navigation size={20} />
                      <div>
                        <p className="text-sm text-blue-100">Total Distance</p>
                        <p className="text-lg font-bold">{getTotalDistance().toFixed(1)} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={20} />
                      <div>
                        <p className="text-sm text-blue-100">Total Duration</p>
                        <p className="text-lg font-bold">{getTotalDuration().toFixed(1)} hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={20} />
                      <div>
                        <p className="text-sm text-blue-100">Attractions</p>
                        <p className="text-lg font-bold">{selectedAttractions.length} places</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Your Itinerary</h3>

                  {Object.entries(attractionsByDate).sort().map(([date, items]) => (
                    <div key={date} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-blue-600" />
                          <h4 className="font-bold text-gray-800">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </h4>
                        </div>
                        {weatherData.current && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            <Cloud size={14} />
                            <span>{weatherData.current.temperature}°C - {weatherData.current.description}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg group"
                          >
                            <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {item.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">
                                {item.attraction.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.attraction.estimated_duration_hours}h
                              </p>
                            </div>
                            <button
                              onClick={() => removeAttraction(selectedAttractions.indexOf(item))}
                              className="text-red-600 hover:bg-red-50 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveItinerary}
                  disabled={saving}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Save size={24} />
                  {saving ? 'Saving...' : 'Save Itinerary'}
                </button>
              </>
            )}

            {selectedAttractions.length === 0 && selectedCity && (
              <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Add attractions to start building your itinerary
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
