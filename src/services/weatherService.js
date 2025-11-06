const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function getWeatherByCoordinates(latitude, longitude) {
  try {
    if (!OPENWEATHER_API_KEY) {
      console.warn('OpenWeather API key not configured, using mock data');
      return getMockWeather();
    }

    const url = `${SUPABASE_URL}/functions/v1/get-weather?lat=${latitude}&lon=${longitude}&apiKey=${OPENWEATHER_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Weather API request failed, using mock data');
      return getMockWeather();
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getMockWeather();
  }
}

export async function getWeatherByCity(cityName) {
  try {
    if (!OPENWEATHER_API_KEY) {
      console.warn('OpenWeather API key not configured, using mock data');
      return getMockWeather();
    }

    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      console.warn('Geocoding failed, using mock data');
      return getMockWeather();
    }

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.length === 0) {
      console.warn('City not found, using mock data');
      return getMockWeather();
    }

    const { lat, lon } = geocodeData[0];
    return await getWeatherByCoordinates(lat, lon);
  } catch (error) {
    console.error('Error fetching weather by city:', error);
    return getMockWeather();
  }
}

function getMockWeather() {
  const conditions = [
    { main: 'Clear', description: 'clear sky', temperature: 22 },
    { main: 'Clouds', description: 'few clouds', temperature: 18 },
    { main: 'Rain', description: 'light rain', temperature: 15 },
  ];
  const random = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    temperature: random.temperature,
    feelsLike: random.temperature - 2,
    humidity: 65,
    description: random.description,
    main: random.main,
    icon: '01d',
    windSpeed: 3.5,
    city: 'Unknown',
  };
}
