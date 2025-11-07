import { useEffect, useState } from 'react';
import { MapPin, ArrowLeft, Calendar, AlertCircle, Clock, Cloud, Droplets, Wind } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getWeatherByCoordinates } from '../services/weatherService';

export default function Locations({ selectedCityId, onNavigate }) {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      loadCityDetails(selectedCityId);
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
      getWeatherByCoordinates(selectedCity.latitude, selectedCity.longitude)
        .then(weatherData => setWeather(weatherData));
    }
  }, [selectedCity]);

  async function loadCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (!error && data) {
      setCities(data);
      if (selectedCityId) {
        const city = data.find(c => c.id === selectedCityId);
        if (city) {
          setSelectedCity(city);
          loadAttractions(selectedCityId);
        }
      }
    }
    setLoading(false);
  }

  async function loadCityDetails(cityId) {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .maybeSingle();

    if (!error && data) {
      setSelectedCity(data);
      loadAttractions(cityId);

      if (data.latitude && data.longitude) {
        const weatherData = await getWeatherByCoordinates(data.latitude, data.longitude);
        setWeather(weatherData);
      }
    }
  }

  async function loadAttractions(cityId) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('city_id', cityId)
      .order('name');

    if (!error && data) {
      setAttractions(data);
    }
  }

  const attractionsByCategory = attractions.reduce((acc, attraction) => {
    if (!acc[attraction.category]) {
      acc[attraction.category] = [];
    }
    acc[attraction.category].push(attraction);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedCity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="relative h-80 bg-gradient-to-br from-blue-600 to-cyan-600 overflow-hidden">
          {selectedCity.image_url ? (
            <img
              src={selectedCity.image_url}
              alt={selectedCity.name}
              className="w-full h-full object-cover opacity-50"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <button
                onClick={() => setSelectedCity(null)}
                className="flex items-center gap-2 text-white mb-4 hover:text-blue-200 transition"
              >
                <ArrowLeft size={20} />
                Back to all cities
              </button>
              <h1 className="text-5xl font-bold text-white mb-2">{selectedCity.name}</h1>
              <p className="text-2xl text-blue-100">{selectedCity.country}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{selectedCity.description}</p>
              </div>

              {Object.keys(attractionsByCategory).length > 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-md">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Places to Visit</h2>
                  <div className="space-y-8">
                    {Object.entries(attractionsByCategory).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-xl font-bold text-gray-700 mb-4 capitalize flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          {category}
                        </h3>
                        <div className="grid gap-4">
                          {items.map((attraction) => (
                            <div
                              key={attraction.id}
                              className="bg-gray-50 p-5 rounded-xl hover:bg-gray-100 transition border border-gray-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-gray-800">{attraction.name}</h4>
                                <div className="flex items-center gap-1 text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                                  <Clock size={14} />
                                  <span>{attraction.estimated_duration_hours}h</span>
                                </div>
                              </div>
                              <p className="text-gray-600 leading-relaxed">{attraction.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-md text-center">
                  <p className="text-gray-600">No attractions available yet</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {weather && (
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Cloud size={24} />
                    <h3 className="text-xl font-bold">Current Weather</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-5xl font-bold">{weather.temperature}°C</span>
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.description}
                        className="w-16 h-16"
                      />
                    </div>
                    <p className="text-lg text-blue-50 capitalize">{weather.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-400">
                      <div className="flex items-center gap-2">
                        <Droplets size={18} />
                        <div>
                          <p className="text-xs text-blue-200">Humidity</p>
                          <p className="font-semibold">{weather.humidity}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind size={18} />
                        <div>
                          <p className="text-xs text-blue-200">Wind Speed</p>
                          <p className="font-semibold">{weather.windSpeed} m/s</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={24} />
                  <h3 className="text-xl font-bold">Best Time to Visit</h3>
                </div>
                <p className="text-lg text-orange-50">{selectedCity.best_time_to_visit}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={24} className="text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-800">Important Instructions</h3>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedCity.important_instructions}
                </p>
              </div>

              <button
                onClick={() => onNavigate('planner')}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md"
              >
                Plan Your Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Explore Destinations</h1>
          <p className="text-xl text-blue-50">Discover amazing places around the world</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cities.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-md text-center">
            <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No destinations available yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((city) => (
              <div
                key={city.id}
                onClick={() => {
                  setSelectedCity(city);
                  loadAttractions(city.id);
                }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition group"
              >
                <div className="h-56 bg-gradient-to-br from-blue-400 to-cyan-500 relative overflow-hidden">
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
                  <p className="text-gray-600 line-clamp-3 mb-4">{city.description}</p>
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
  );
}
