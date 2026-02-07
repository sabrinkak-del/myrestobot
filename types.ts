
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingUrls?: Array<{ title: string; uri: string }>;
  suggestions?: string[];
}

export interface Reservation {
  id: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  reservations: Reservation[];
}

export interface Restaurant {
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  image?: string;
}
