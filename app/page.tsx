"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Utensils, Send, Loader2, LogIn, LogOut } from "lucide-react"
import ChatBubble from "@/components/chat-bubble"
import AuthModal from "@/components/auth-modal"
import ProfilePanel from "@/components/profile-panel"

interface Reservation {
  id: string
  restaurantName: string
  date: string
  time: string
  guests: number
  status: "pending" | "confirmed" | "cancelled"
  createdAt: Date
}

interface User {
  id: string
  name: string
  email: string
  reservations: Reservation[]
}

interface Message {
  id: string
  role: "user" | "model"
  text: string
  timestamp: Date
  suggestions?: string[]
}

const STORAGE_KEY = "restobot_user_data"

const restaurantsByCategory: Record<string, string[]> = {
  "איטלקית": ["פסטה בסטה", "ויוינו", "רוסטיקו", "נאפולי", "איטלקית מקומית"],
  "בשרית": ["אל גאוצ'ו", "מו ומו", "התקווה", "מיטבר", "חוות התבלינים"],
  "אסייתית": ["תאילנדית בשוק", "ריבר", "ג'ירף", "ווק טו ווק", "האנוי"],
  "סושי": ["סושי בר", "אושי אושי", "ג'פניקה", "מון סושי", "קיושי"],
  "בית קפה": ["ארומה", "קפה קפה", "לנדוור", "קפה נטו", "קפה גרג"],
}

type BookingStep = "idle" | "category" | "restaurant" | "date" | "time" | "guests"

function loadUser(): User | null {
  if (typeof window === "undefined") return null
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved) as User
    parsed.reservations = parsed.reservations.map((res) => ({
      ...res,
      createdAt: new Date(res.createdAt),
    }))
    return parsed
  } catch {
    return null
  }
}

export default function RestoBotPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [bookingStep, setBookingStep] = useState<BookingStep>("idle")
  const [tempBooking, setTempBooking] = useState({
    restaurantName: "",
    category: "",
    date: "",
    time: "",
    guests: 0,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load user and set initial message on mount
  useEffect(() => {
    const user = loadUser()
    setCurrentUser(user)
    setMessages([
      {
        id: "1",
        role: "model",
        text: user
          ? `שלום ${user.name}! כיף לראות אותך שוב. לאיזו מסעדה תרצה להזמין מקום היום?`
          : "שלום! אני RESTOBOT, העוזר האישי שלכם. לאיזו מסעדה תרצו להזמין מקום היום?",
        timestamp: new Date(),
        suggestions: ["הזמן מקום", "ההזמנות שלי"],
      },
    ])
  }, [])

  // Save user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentUser])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
      const textToSend = textOverride || inputValue
      if (!textToSend.trim() || isLoading) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        text: textToSend,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue("")
      setIsLoading(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 600))

        let botText = ""
        let suggestions: string[] = []
        let nextStep = bookingStep
        const updatedBooking = { ...tempBooking }
        const normalizedText = textToSend.trim()

        if (
          normalizedText === "הזמן מקום" ||
          normalizedText === "הזמן מקום עכשיו"
        ) {
          botText = "איזה סוג מסעדה תרצו להזמין היום?"
          suggestions = [
            "איטלקית",
            "בשרית",
            "אסייתית",
            "סושי",
            "בית קפה",
          ]
          nextStep = "category"
        } else if (bookingStep === "category") {
          const choices = restaurantsByCategory[normalizedText] || []
          if (choices.length > 0) {
            updatedBooking.category = normalizedText
            botText = `מעולה! הנה כמה מסעדות מומלצות ב${normalizedText}. איזו מהן תרצו להזמין?`
            suggestions = choices
            nextStep = "restaurant"
          } else {
            updatedBooking.restaurantName = normalizedText
            botText = `מעולה, לתיאום ב${normalizedText}. לאיזה תאריך תרצו להזמין?`
            nextStep = "date"
          }
        } else if (bookingStep === "restaurant") {
          updatedBooking.restaurantName = normalizedText
          botText = `מעולה, לתיאום ב${normalizedText}. לאיזה תאריך תרצו להזמין?`
          nextStep = "date"
        } else if (bookingStep === "date") {
          updatedBooking.date = normalizedText
          botText = "באיזו שעה תרצו להגיע?"
          const timeSlots: string[] = []
          for (let hour = 8; hour <= 23; hour++) {
            const hourStr = hour.toString().padStart(2, "0")
            timeSlots.push(`${hourStr}:00`)
            if (hour < 23) {
              timeSlots.push(`${hourStr}:30`)
            }
          }
          suggestions = timeSlots
          nextStep = "time"
        } else if (bookingStep === "time") {
          updatedBooking.time = normalizedText
          botText = "כמה סועדים תהיו?"
          suggestions = ["זוג (2)", "3 סועדים", "4 סועדים", "5 סועדים"]
          nextStep = "guests"
        } else if (bookingStep === "guests") {
          const guestsNum = parseInt(
            normalizedText.match(/\d+/)?.[0] || "2"
          )
          updatedBooking.guests = guestsNum

          const newReservation: Reservation = {
            id: Math.random().toString(36).substr(2, 9),
            restaurantName: updatedBooking.restaurantName,
            date: updatedBooking.date,
            time: updatedBooking.time,
            guests: guestsNum,
            status: "confirmed",
            createdAt: new Date(),
          }

          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              reservations: [newReservation, ...currentUser.reservations],
            }
            setCurrentUser(updatedUser)
            botText = `מעולה ${currentUser.name}! ההזמנה ל${updatedBooking.restaurantName} אושרה בהצלחה ל-${updatedBooking.date} בשעה ${updatedBooking.time} ל-${guestsNum} סועדים. היא מחכה לך באזור האישי!`
          } else {
            botText = `הכנתי את ההזמנה ל${updatedBooking.restaurantName} ל-${updatedBooking.date} בשעה ${updatedBooking.time}. כדאי להתחבר כדי לשמור אותה!`
            suggestions = ["התחברות עכשיו"]
          }
          nextStep = "idle"
        } else {
          botText =
            "אני כאן לעזור לכם להזמין מקום במסעדה. תרצו להתחיל בהזמנה?"
          suggestions = ["הזמן מקום", "ההזמנות שלי"]
        }

        setTempBooking(updatedBooking)
        setBookingStep(nextStep)

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: botText,
          timestamp: new Date(),
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        }

        setMessages((prev) => [...prev, botMessage])
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "שגיאה לא ידועה"
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "model",
            text: `מצטערת, חלה שגיאה: ${errorMessage}. בואו ננסה שוב.`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [inputValue, isLoading, bookingStep, tempBooking, currentUser]
  )

  const onSuggestionClick = useCallback(
    (text: string) => {
      if (text === "התחברות עכשיו" || text === "התחברות מחדש") {
        setShowAuthModal(true)
      } else if (text === "ההזמנות שלי") {
        if (currentUser) {
          setShowProfile(true)
        } else {
          setShowAuthModal(true)
        }
      } else {
        handleSendMessage(text)
      }
    },
    [currentUser, handleSendMessage]
  )

  const handleAuth = useCallback(
    (userData: { name: string; email: string }) => {
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: userData.name,
        email: userData.email,
        reservations: [],
      }
      setCurrentUser(mockUser)
      setShowAuthModal(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: `שלום ${userData.name}, ברוך הבא ל-RESTOBOT! המערכת תזכור אותך מעכשיו.`,
          timestamp: new Date(),
          suggestions: ["הזמן מקום עכשיו"],
        },
      ])
    },
    []
  )

  const handleLogout = useCallback(() => {
    setCurrentUser(null)
    setShowProfile(false)
    setMessages([
      {
        id: Date.now().toString(),
        role: "model",
        text: "התנתקת מהחשבון. אשמח לעזור לך שוב כשתחזור!",
        timestamp: new Date(),
        suggestions: ["התחברות מחדש"],
      },
    ])
  }, [])

  const getPlaceholder = () => {
    switch (bookingStep) {
      case "category":
        return "בחרו סוג מסעדה..."
      case "restaurant":
        return "כתבו את שם המסעדה..."
      default:
        return "כתבו כאן..."
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg">
            <Utensils className="text-primary-foreground w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-card-foreground tracking-tight">
              RESTOBOT
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 md:gap-3 p-1 pr-3 md:p-2 bg-accent rounded-full border border-primary/20 hover:bg-primary/15 transition-all"
            >
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-card-foreground max-w-[100px] truncate">
                  {currentUser.name}
                </p>
                <p className="text-[9px] text-primary font-medium">
                  לצפייה בהזמנות
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base border-2 border-card shadow-sm">
                {currentUser.name[0].toUpperCase()}
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs md:text-sm font-bold transition-all"
            >
              <LogIn size={14} className="md:w-4 md:h-4" />
              התחברות
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        <div className="flex-1 flex flex-col min-w-0 bg-card md:border-x border-border relative overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
          >
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onSuggestionClick={onSuggestionClick}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-bubble-in">
                <div className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">
                    RESTOBOT חושב...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div
              className={`flex items-end gap-2 bg-secondary rounded-2xl p-2 border transition-all ${
                isLoading
                  ? "opacity-50"
                  : "focus-within:ring-2 ring-ring ring-opacity-30 border-primary/30"
              }`}
            >
              {bookingStep === "date" ? (
                <input
                  type="date"
                  className="flex-1 bg-transparent border-none focus:ring-0 py-2 px-3 text-right text-foreground min-h-[44px] outline-none"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const dateValue = e.target.value
                    if (dateValue) {
                      handleSendMessage(dateValue)
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
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isLoading}
                  placeholder={getPlaceholder()}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-right text-foreground min-h-[44px] outline-none placeholder:text-muted-foreground"
                  rows={1}
                />
              )}
              <button
                onClick={() => handleSendMessage()}
                disabled={
                  (!inputValue.trim() && bookingStep !== "date") || isLoading
                }
                className="p-3 rounded-xl bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground shadow-sm active:scale-95 transition-all"
                aria-label="שלח הודעה"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Panel */}
      {showProfile && (
        <ProfilePanel
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onLogin={() => setShowAuthModal(true)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      )}
    </div>
  )
}
