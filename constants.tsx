
import React from 'react';
import { Utensils, Search, Calendar, Users, MapPin, Clock } from 'lucide-react';

export const ICONS = {
  restaurant: <Utensils className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  date: <Calendar className="w-5 h-5" />,
  people: <Users className="w-5 h-5" />,
  location: <MapPin className="w-5 h-5" />,
  time: <Clock className="w-5 h-5" />,
};

export const MOCK_RESTAURANTS = [
  {
    name: "משייה",
    cuisine: "מרוקאי מודרני",
    location: "תל אביב",
    rating: 4.8,
  },
  {
    name: "מחניודה",
    cuisine: "שוק ירושלמי",
    location: "ירושלים",
    rating: 4.9,
  }
];
