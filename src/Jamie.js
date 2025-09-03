import React, { useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

// ✅ Component to smoothly move (fly) map when position changes
function FlyToLocation({ position }) {
  const map = useMap(); // Hook to access map instance
  if (position) {
    // Smooth fly animation to new location
    map.flyTo(position, 10, { duration: 2 });
  }
  return null; // Nothing rendered
}

//  Custom marker icon 
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
});

function Weatherwork() {
  // 🔹 React State Hooks
  const [city, setCity] = useState(""); // stores user input city name
  const [weather, setWeather] = useState(null); // stores weather data
  const [loading, setLoading] = useState(false); // controls loading spinner
  const [error, setError] = useState(null); // stores error messages
  const [position, setPosition] = useState([51.505, -0.09]); // default map position (world view)

  // 🔹 Input field change handler
  const handleCityChange = (event) => {
    setCity(event.target.value); // update city name state
  };

  // 🔹 Fetch weather data based on city name
  const fetchWeather = async () => {
    try {
      // Reset states before fetching
      setLoading(true);
      setError(null);
      setWeather(null);

      // STEP 1: Get coordinates from Geocoding API
      const geoResponse = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1`
      );

      // If no city found → throw error
      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error("City not found");
      }

      // Extract city details (lat, lon, name, country)
      const cityData = geoResponse.data.results[0];

      // STEP 2: Fetch weather data for coordinates
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityData.latitude}&longitude=${cityData.longitude}&current=temperature_2m,precipitation,rain,snowfall,relative_humidity_2m,wind_speed_10m`
      );

      // Update weather state with structured data
      setWeather({
        name: cityData.name,
        country: cityData.country,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        current: weatherResponse.data.current,
      });

      // Update map position → moves marker & triggers fly animation
      setPosition([cityData.latitude, cityData.longitude]);
    } catch (error) {
      // Handle API errors
      setError("Failed to fetch weather data! Please enter a valid city name.");
      console.error(error);
    } finally {
      // Always stop loading at the end
      setLoading(false);
    }
  };

  // 🔹 Called on button click or Enter key
  const fetchClick = () => {
    if (city.trim()) {
      fetchWeather(); // only fetch if city input is not empty
    }
  };

  return (
    <div className="App">
      {/* 🌍 Fullscreen Map in the background */}
      <MapContainer
        center={position}
        zoom={3}
        className="map-background"
        zoomControl={false}
      >
        {/* Map style: OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Smooth map fly when position updates */}
        <FlyToLocation position={position} />

        {/* Marker showing searched city */}
        {position && (
          <Marker position={position} icon={customIcon}>
            <Popup>
              {weather
                ? `${weather.name}, ${weather.country}`
                : "Search for a city"}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ☁️ Overlay container on top of map */}
      <div className="Container">
        <h1>Weather Now</h1>
        <div className="Data-container">
          {/* Input field + button */}
          <div className="searchbox">
            <input
              type="text"
              className="city-input"
              placeholder="Enter city name"
              onChange={handleCityChange}
              // Allow Enter key to trigger fetch
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchClick();
                }
              }}
            />
            <button className="searchbutton" onClick={fetchClick}>
              Get Weather
            </button>
          </div>

          {/* Weather Information / Error / Loading spinner */}
          {(loading || error || weather) && (
            <div className="weatherinfo">
              {loading ? (
                // Show spinner when loading
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : error ? (
                // Show error message if city not found
                <p className="error">{error}</p>
              ) : (
                // Show fetched weather details
                <>
                  <h2>
                    City: {weather.name}, {weather.country} 📍
                  </h2>
                  <h2>Temperature: {weather.current.temperature_2m} °C 🌡️</h2>
                  <h2>Humidity: {weather.current.relative_humidity_2m} % 💧</h2>
                  <h2>Precipitation: {weather.current.precipitation} mm 🌧️</h2>
                  <h2>Wind: {weather.current.wind_speed_10m} km/h 🌪️</h2>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Weatherwork;
