
import React, { useState, useRef, useEffect } from 'react';
import { Message, Reservation, User } from './types';
import ChatBubble from './components/ChatBubble';
import {
  Utensils, Send, Calendar, Users, MapPin, Loader2,
  LogIn, User as UserIcon, LogOut, CheckCircle,
  Clock, History, X
} from 'lucide-react';

const STORAGE_KEY = 'restobot_user_data';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as User;
      parsed.reservations = parsed.reservations.map(res => ({
        ...res,
        createdAt: new Date(res.createdAt)
      }));
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: currentUser
        ? `שלום ${currentUser.name}! כיף לראות אותך שוב. לאיזו מסעדה תרצה להזמין מקום היום?`
        : 'שלום! אני RESTOBOT, העוזר האישי שלכם. לאיזו מסעדה תרצו להזמין מקום היום?',
      timestamp: new Date(),
      suggestions: ['הזמן מקום', 'ההזמנות שלי']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '' });

  // Local Booking State
  const [bookingStep, setBookingStep] = useState<'idle' | 'category' | 'restaurant' | 'date' | 'time' | 'guests'>('idle');
  const [tempBooking, setTempBooking] = useState({ restaurantName: '', category: '', date: '', time: '', guests: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Small artificial delay to simulate "thinking"
      await new Promise(resolve => setTimeout(resolve, 600));

      let botText = "";
      let suggestions: string[] = [];
      let nextStep = bookingStep;
      let updatedBooking = { ...tempBooking };

      const normalizedText = textToSend.trim();

      const restaurantsByCategory: Record<string, string[]> = {
        "איטלקית 🇮🇹": ["פסטה בסטה", "ויוינו", "רוסטיקו", "נאפולי", "איטלקית מקומית"],
        "בשרית 🥩": ["אל גאוצ'ו", "מו ומו", "התקווה", "מיטבר", "חוות התבלינים"],
        "אסייתית 🥢": ["תאילנדית בשוק", "ריבר", "ג'ירף", "ווק טו ווק", "האנוי"],
        "סושי 🍣": ["סושי בר", "אושי אושי", "ג'פניקה", "מון סושי", "קיושי"],
        "בית קפה ☕": ["ארומה", "קפה קפה", "לנדוור", "קפה נטו", "קפה גרג"]
      };

      if (normalizedText === 'הזמן מקום' || normalizedText === 'הזמן מקום עכשיו') {
        botText = "איזה סוג מסעדה תרצו להזמין היום?";
        suggestions = ['איטלקית 🇮🇹', 'בשרית 🥩', 'אסייתית 🥢', 'סושי 🍣', 'בית קפה ☕'];
        nextStep = 'category';
      } else if (bookingStep === 'category') {
        const choices = restaurantsByCategory[normalizedText] || [];
        if (choices.length > 0) {
          updatedBooking.category = normalizedText;
          botText = `מעולה! הנה כמה מסעדות מומלצות ב${normalizedText}. איזו מהן תרצו להזמין?`;
          suggestions = choices;
          nextStep = 'restaurant';
        } else {
          // If they typed something not in categories, assume it's a specific restaurant name
          updatedBooking.restaurantName = normalizedText;
          botText = `מעולה, לתיאום ב${normalizedText}. לאיזה תאריך תרצו להזמין?`;
          suggestions = [];
          nextStep = 'date';
        }
      } else if (bookingStep === 'restaurant') {
        updatedBooking.restaurantName = normalizedText;
        botText = `מעולה, לתיאום ב${normalizedText}. לאיזה תאריך תרצו להזמין?`;
        suggestions = [];
        nextStep = 'date';
      } else if (bookingStep === 'date') {
        updatedBooking.date = normalizedText;
        botText = "באיזו שעה תרצו להגיע?";

        // Generate time slots from 08:00 to 23:00 in 30-minute intervals
        const timeSlots: string[] = [];
        for (let hour = 8; hour <= 23; hour++) {
          const hourStr = hour.toString().padStart(2, '0');
          timeSlots.push(`${hourStr}:00`);
          if (hour < 23) {
            timeSlots.push(`${hourStr}:30`);
          }
        }
        suggestions = timeSlots;
        nextStep = 'time';
      } else if (bookingStep === 'time') {
        updatedBooking.time = normalizedText;
        botText = "כמה סועדים תהיו?";
        suggestions = ['זוג (2)', '3 סועדים', '4 סועדים', '5 סועדים'];
        nextStep = 'guests';
      } else if (bookingStep === 'guests') {
        const guestsNum = parseInt(normalizedText.match(/\d+/)?.[0] || "2");
        updatedBooking.guests = guestsNum;

        const newReservation: Reservation = {
          id: Math.random().toString(36).substr(2, 9),
          restaurantName: updatedBooking.restaurantName,
          date: updatedBooking.date,
          time: updatedBooking.time,
          guests: guestsNum,
          status: 'confirmed',
          createdAt: new Date()
        };

        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            reservations: [newReservation, ...currentUser.reservations]
          };
          setCurrentUser(updatedUser);
          botText = `מעולה ${currentUser.name}! ההזמנה ל${updatedBooking.restaurantName} אושרה בהצלחה ל-${updatedBooking.date} בשעה ${updatedBooking.time} ל-${guestsNum} סועדים. היא מחכה לך באזור האישי!`;
        } else {
          botText = `הכנתי את ההזמנה ל${updatedBooking.restaurantName} ל-${updatedBooking.date} בשעה ${updatedBooking.time}. כדאי להתחבר כדי לשמור אותה!`;
          suggestions = ['התחברות עכשיו'];
        }
        nextStep = 'idle';
      } else {
        botText = "אני כאן לעזור לכם להזמין מקום במסעדה. תרצו להתחיל בהזמנה?";
        suggestions = ['הזמן מקום', 'ההזמנות שלי'];
      }

      setTempBooking(updatedBooking);
      setBookingStep(nextStep);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botText,
        timestamp: new Date(),
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      console.error("Booking Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `מצטערת, חלה שגיאה: ${error.message || 'שגיאה לא ידועה'}. בואו ננסה שוב.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSuggestionClick = (text: string) => {
    if (text === 'התחברות עכשיו') {
      setAuthMode('login');
      setShowAuthModal(true);
    } else if (text === 'ההזמנות שלי') {
      if (currentUser) {
        setShowMobileProfile(true);
      } else {
        setAuthMode('login');
        setShowAuthModal(true);
      }
    } else {
      handleSendMessage(text);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    let displayName = authFormData.name.trim() || authFormData.email.split('@')[0];
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: displayName,
      email: authFormData.email,
      reservations: []
    };
    setCurrentUser(mockUser);
    setShowAuthModal(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `שלום ${displayName}, ברוך הבא ל-RESTOBOT! המערכת תזכור אותך מעכשיו.`,
      timestamp: new Date(),
      suggestions: ['הזמן מקום עכשיו', 'איזה מסעדות מומלצות?']
    }]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowMobileProfile(false);
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: 'התנתקת מהחשבון. אשמח לעזור לך שוב כשתחזור!',
      timestamp: new Date(),
      suggestions: ['התחברות מחדש']
    }]);
  };

  const UserProfileContent = () => (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner border-2 border-orange-200">
            {currentUser?.name[0].toUpperCase() || 'א'}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-gray-800 truncate">היי, {currentUser?.name}</h3>
            <p className="text-[10px] text-gray-400 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <p className="text-[10px] text-gray-400">הזמנות</p>
            <p className="font-bold text-orange-600">{currentUser?.reservations.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <p className="text-[10px] text-gray-400">סטטוס</p>
            <p className="font-bold text-green-600">פעיל</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-4 text-xs text-red-500 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut size={14} /> התנתקות מהחשבון
        </button>
      </div>

      <div className="flex-1 space-y-4 pb-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-orange-500" />
          ההזמנות שלי
        </h3>
        {(currentUser?.reservations.length || 0) > 0 ? (
          currentUser?.reservations.map((res) => (
            <div key={res.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 transition-all group animate-in slide-in-from-right-2">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle size={10} />
                  מאושר
                </span>
                <Clock className="w-3 h-3 text-gray-300" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">{res.restaurantName}</h4>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{res.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>{res.guests} סועדים</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>בשעה {res.time}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-40">
            <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">עדיין אין הזמנות רשומות</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl shadow-orange-200 shadow-lg">
            <Utensils className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">RESTOBOT</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setShowMobileProfile(true)}
              className="flex items-center gap-2 md:gap-3 p-1 pr-3 md:p-2 bg-orange-50 rounded-full border border-orange-100 hover:bg-orange-100 transition-all"
            >
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-gray-700 max-w-[100px] truncate">{currentUser.name}</p>
                <p className="text-[9px] text-orange-600 font-medium">לצפייה בהזמנות</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base border-2 border-white shadow-sm">
                {currentUser.name[0].toUpperCase()}
              </div>
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs md:text-sm font-bold transition-all"
            >
              <LogIn size={14} className="md:w-4 md:h-4" />
              התחברות
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full relative">
        <div className="flex-1 flex flex-col min-w-0 bg-white md:border-l md:border-r relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/30">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onSuggestionClick={onSuggestionClick} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-xs text-gray-500 font-medium">RESTOBOT חושב...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className={`flex items-end gap-2 bg-gray-50 rounded-2xl p-2 border transition-all ${isLoading ? 'opacity-50' : 'focus-within:ring-2 ring-orange-100 border-orange-200'}`}>
              {bookingStep === 'date' ? (
                <input
                  type="date"
                  className="flex-1 bg-transparent border-none focus:ring-0 py-2 px-3 text-right text-gray-700 min-h-[44px]"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      handleSendMessage(dateValue);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  placeholder={
                    bookingStep === 'idle'
                      ? "כתבו כאן..."
                      : bookingStep === 'category'
                        ? "בחרו סוג מסעדה..."
                        : bookingStep === 'restaurant'
                          ? "כתבו את שם המסעדה..."
                          : "הקלידו כאן..."
                  }
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-right text-gray-700 min-h-[44px]"
                  rows={1}
                />
              )}
              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && bookingStep !== 'date') || isLoading}
                className="p-3 rounded-xl bg-orange-500 text-white disabled:bg-gray-200 shadow-sm active:scale-95 transition-all"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {showMobileProfile && (
          <div className="fixed inset-0 z-40 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowMobileProfile(false)} />
            <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-gray-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">אזור אישי</h2>
                <button onClick={() => setShowMobileProfile(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              {currentUser ? (
                <UserProfileContent />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <UserIcon size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm mb-4">עליך להתחבר כדי לצפות בהזמנות שלך</p>
                  <button
                    onClick={() => { setShowMobileProfile(false); setShowAuthModal(true); }}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-all"
                  >
                    התחברות
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-100">
                  <Utensils size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {authMode === 'login' ? 'ברוכים השבים!' : 'הצטרפו ל-RESTOBOT'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {authMode === 'login' ? 'הכנסו לחשבון כדי לנהל את ההזמנות' : 'צרו חשבון בחינם והתחילו להזמין'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 mr-1 uppercase">שם מלא</label>
                    <input
                      type="text"
                      placeholder="ישראל ישראלי"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-orange-100 outline-none"
                      value={authFormData.name}
                      onChange={e => setAuthFormData({ ...authFormData, name: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 mr-1 uppercase">אימייל</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-orange-100 outline-none"
                    value={authFormData.email}
                    onChange={e => setAuthFormData({ ...authFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 mr-1 uppercase">סיסמה</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-orange-100 outline-none"
                    value={authFormData.password}
                    onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-[0.98]"
                >
                  {authMode === 'login' ? 'התחברות' : 'הרשמה למערכת'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-gray-500 hover:text-orange-500 font-medium transition-colors"
                >
                  {authMode === 'login' ? 'אין לכם חשבון? הרשמו כאן' : 'כבר רשומים? התחברו כאן'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
