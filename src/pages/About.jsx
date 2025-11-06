import { Plane, Heart, Users, Target } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About TripSmart</h1>
          <p className="text-xl text-blue-50 leading-relaxed">
            Your intelligent companion for planning unforgettable journeys
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            TripSmart was created to simplify travel planning and make exploring the world more
            accessible to everyone. We believe that travel should be exciting, not stressful, and
            that planning your next adventure should be as enjoyable as the trip itself.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            By combining detailed destination guides, smart itinerary planning, and real-time
            weather forecasts, we help travelers make informed decisions and create memorable
            experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Target size={28} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become the go-to platform for travelers seeking simple, smart, and personalized
              trip planning solutions that adapt to their unique preferences and needs.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="bg-cyan-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Heart size={28} className="text-cyan-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">What We Love</h3>
            <p className="text-gray-600 leading-relaxed">
              We're passionate about helping people discover new places, experience different
              cultures, and create lasting memories through well-planned and thoughtful travel.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8 md:p-12 text-white mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Plane size={32} />
            <h2 className="text-3xl font-bold">What We Offer</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xl font-bold mb-2">Curated Destinations</h4>
              <p className="text-blue-50 leading-relaxed">
                Hand-picked cities with comprehensive guides, attractions, and insider tips
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Smart Itineraries</h4>
              <p className="text-blue-50 leading-relaxed">
                AI-powered planning with weather forecasts and optimized routes
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Travel Insights</h4>
              <p className="text-blue-50 leading-relaxed">
                Best times to visit, local customs, and important travel information
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Personal Organization</h4>
              <p className="text-blue-50 leading-relaxed">
                Save and manage all your trips in one convenient place
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
              <Users size={32} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Join Our Community</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Whether you're a weekend wanderer or a globe-trotting adventurer, TripSmart is here
            to make your travel planning simple, smart, and stress-free. Start exploring today
            and discover your next great adventure.
          </p>
        </div>
      </div>
    </div>
  );
}
