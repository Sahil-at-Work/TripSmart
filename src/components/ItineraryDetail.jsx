import { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Navigation, Clock, Cloud, Edit2, Save, Plus, Trash2, Map as MapIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ItineraryDetail({ itinerary, onClose, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [availableAttractions, setAvailableAttractions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItineraryItems();
    loadAvailableAttractions();
  }, [itinerary.id]);

  async function loadItineraryItems() {
    const { data, error } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        attraction:attractions(*)
      `)
      .eq('itinerary_id', itinerary.id)
      .order('visit_date')
      .order('visit_order');

    if (!error && data) {
      setItems(data);
      generateWeatherData(data);
    }
    setLoading(false);
  }

  async function loadAvailableAttractions() {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('city_id', itinerary.city_id)
      .order('name');

    if (!error && data) {
      setAvailableAttractions(data);
    }
  }

  function getWeatherPrediction(date) {
    const targetDate = new Date(date);
    const month = targetDate.getMonth();

    const seasonalWeather = {
      0: ['Cold', 'Chilly', 'Crisp'],
      1: ['Cool', 'Mild', 'Pleasant'],
      2: ['Mild', 'Pleasant', 'Warm'],
      3: ['Pleasant', 'Warm', 'Sunny'],
      4: ['Warm', 'Sunny', 'Beautiful'],
      5: ['Hot', 'Sunny', 'Clear'],
      6: ['Hot', 'Very Warm', 'Sunny'],
      7: ['Hot', 'Very Warm', 'Sunny'],
      8: ['Warm', 'Pleasant', 'Sunny'],
      9: ['Mild', 'Pleasant', 'Cool'],
      10: ['Cool', 'Chilly', 'Crisp'],
      11: ['Cold', 'Chilly', 'Crisp'],
    };

    const options = seasonalWeather[month] || ['Pleasant'];
    return options[Math.floor(Math.random() * options.length)];
  }

  function generateWeatherData(itineraryItems) {
    const data = {};
    const allDates = getAllDatesInRange();
    allDates.forEach(date => {
      data[date] = getWeatherPrediction(date);
    });
    setWeatherData(data);
  }

  function getAllDatesInRange() {
    const dates = [];
    const start = new Date(itinerary.start_date);
    const end = new Date(itinerary.end_date);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
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
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i].attraction;
      const next = items[i + 1].attraction;
      total += calculateDistance(current.latitude, current.longitude, next.latitude, next.longitude);
    }
    return total;
  }

  function getTotalDuration() {
    return items.reduce((sum, item) => sum + item.attraction.estimated_duration_hours, 0);
  }

  function addAttraction(attraction, date) {
    const itemsOnDate = items.filter(i => i.visit_date === date);
    const newOrder = itemsOnDate.length + 1;

    const newItem = {
      id: `temp-${Date.now()}`,
      itinerary_id: itinerary.id,
      attraction_id: attraction.id,
      visit_date: date,
      visit_order: newOrder,
      notes: '',
      created_at: new Date().toISOString(),
      attraction: attraction,
    };

    setItems([...items, newItem]);
  }

  function removeItem(itemId) {
    setItems(items.filter(i => i.id !== itemId));
  }

  function changeItemDate(itemId, newDate) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const itemsOnNewDate = items.filter(i => i.visit_date === newDate && i.id !== itemId);
    const newOrder = itemsOnNewDate.length + 1;

    setItems(items.map(i =>
      i.id === itemId
        ? { ...i, visit_date: newDate, visit_order: newOrder }
        : i
    ));
  }

  async function saveChanges() {
    setSaving(true);

    try {
      await supabase
        .from('itinerary_items')
        .delete()
        .eq('itinerary_id', itinerary.id);

      const itemsToInsert = items.map((item, index) => ({
        itinerary_id: itinerary.id,
        attraction_id: item.attraction_id,
        visit_date: item.visit_date,
        visit_order: item.visit_order,
        notes: item.notes,
      }));

      const { error } = await supabase
        .from('itinerary_items')
        .insert(itemsToInsert);

      if (error) throw error;

      await loadItineraryItems();
      setIsEditMode(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Error saving changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const allDates = getAllDatesInRange();

  const itemsByDate = items.reduce((acc, item) => {
    if (!acc[item.visit_date]) {
      acc[item.visit_date] = [];
    }
    acc[item.visit_date].push(item);
    return acc;
  }, {});

  allDates.forEach(date => {
    if (!itemsByDate[date]) {
      itemsByDate[date] = [];
    }
  });

  const sortedDates = allDates;
  const unselectedAttractions = availableAttractions.filter(
    a => !items.some(i => i.attraction_id === a.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl relative overflow-hidden" style={{ width: '1200px', height: '720px' }}>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">{itinerary.title}</h2>
              <p className="text-lg text-blue-100 mb-3">{itinerary.city.name}, {itinerary.city.country}</p>
              <div className="flex items-center gap-4 text-blue-50 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(itinerary.start_date).toLocaleDateString()}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(itinerary.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowMap(!showMap)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <MapIcon size={18} />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              ) : (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex" style={{ height: 'calc(720px - 140px)' }}>
          {showMap && (
            <div className="w-1/2 bg-gray-100 border-r border-gray-300 relative">
              <div className="absolute inset-4 bg-white rounded-lg shadow-inner flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={48} className="text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Interactive Map</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Showing all attractions in {itinerary.city.name}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-left max-w-xs mx-auto">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                        <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <span className="text-gray-700">{item.attraction.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`overflow-y-auto p-6 ${showMap ? 'w-1/2' : 'w-full'}`}>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Navigation className="text-blue-600" size={20} />
                      <h3 className="font-bold text-gray-800 text-sm">Distance</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{getTotalDistance().toFixed(1)} km</p>
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="text-cyan-600" size={20} />
                      <h3 className="font-bold text-gray-800 text-sm">Time</h3>
                    </div>
                    <p className="text-2xl font-bold text-cyan-600">{getTotalDuration().toFixed(1)} hours</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="text-green-600" size={20} />
                      <h3 className="font-bold text-gray-800 text-sm">Places</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{items.length}</p>
                  </div>
                </div>

                {isEditMode && unselectedAttractions.length > 0 && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Plus size={16} className="text-green-600" />
                      Add Attractions
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {unselectedAttractions.map((attraction) => (
                        <div key={attraction.id} className="flex items-center justify-between bg-white p-2 rounded-lg text-xs">
                          <span className="font-medium text-gray-700">{attraction.name}</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addAttraction(attraction, e.target.value);
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Add to day...</option>
                            {sortedDates.map(date => (
                              <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-800">Your Travel Plan</h3>

                  {sortedDates.map((date, dayIndex) => {
                    const dayItems = itemsByDate[date] || [];
                    return (
                      <div key={date} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-300">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                Day {dayIndex + 1}
                              </span>
                              <h4 className="text-base font-bold text-gray-800">
                                {new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 ml-11">
                              {dayItems.length === 0 ? 'No activities planned' : `${dayItems.length} stop${dayItems.length > 1 ? 's' : ''} • ${dayItems.reduce((sum, item) => sum + item.attraction.estimated_duration_hours, 0).toFixed(1)}h`}
                            </p>
                          </div>
                          {weatherData[date] && (
                            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg shadow-sm">
                              <Cloud size={16} className="text-blue-600" />
                              <span className="font-medium text-gray-700 text-sm">{weatherData[date]}</span>
                            </div>
                          )}
                        </div>

                        {dayItems.length === 0 ? (
                          <div className="text-center py-6 bg-white rounded-xl">
                            <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">
                              {isEditMode ? 'Add attractions to this day using the section above' : 'No activities planned for this day'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dayItems.map((item, index) => (
                              <div key={item.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {item.visit_order}
                                  </div>
                                  {index < dayItems.length - 1 && (
                                    <div className="w-0.5 h-full bg-blue-200 flex-1 mt-1"></div>
                                  )}
                                </div>

                                <div className="flex-1 bg-white p-3 rounded-xl shadow-sm">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-bold text-gray-800">
                                        {item.attraction.name}
                                      </h5>
                                      <p className="text-xs text-blue-600 font-medium capitalize">
                                        {item.attraction.category}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                        <Clock size={12} />
                                        <span>{item.attraction.estimated_duration_hours}h</span>
                                      </div>
                                      {isEditMode && (
                                        <>
                                          <select
                                            value={item.visit_date}
                                            onChange={(e) => changeItemDate(item.id, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1"
                                          >
                                            {sortedDates.map(d => (
                                              <option key={d} value={d}>
                                                {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                                    {item.attraction.description}
                                  </p>
                                  {index < dayItems.length - 1 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-1 text-xs text-gray-500">
                                      <Navigation size={12} />
                                      <span>
                                        {calculateDistance(
                                          item.attraction.latitude,
                                          item.attraction.longitude,
                                          dayItems[index + 1].attraction.latitude,
                                          dayItems[index + 1].attraction.longitude
                                        ).toFixed(1)} km to next
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
