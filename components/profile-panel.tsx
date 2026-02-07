"use client"

import {
  X,
  LogOut,
  History,
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  User as UserIcon,
} from "lucide-react"

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

interface ProfilePanelProps {
  currentUser: User | null
  onClose: () => void
  onLogout: () => void
  onLogin: () => void
}

export default function ProfilePanel({
  currentUser,
  onClose,
  onLogout,
  onLogin,
}: ProfilePanelProps) {
  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-background shadow-2xl animate-slide-in-right flex flex-col p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">אזור אישי</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        {currentUser ? (
          <>
            <div className="bg-card p-5 rounded-2xl shadow-sm border border-border mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-inner border-2 border-accent">
                  {currentUser.name[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-card-foreground truncate">
                    היי, {currentUser.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-secondary p-2 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground">הזמנות</p>
                  <p className="font-bold text-primary">
                    {currentUser.reservations.length}
                  </p>
                </div>
                <div className="bg-secondary p-2 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground">סטטוס</p>
                  <p className="font-bold" style={{ color: "hsl(var(--success))" }}>
                    פעיל
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full mt-4 text-xs text-destructive py-2 hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <LogOut size={14} /> התנתקות מהחשבון
              </button>
            </div>

            <div className="flex-1 space-y-4 pb-10">
              <h3 className="font-bold text-foreground flex items-center gap-2 px-1">
                <History className="w-4 h-4 text-primary" />
                ההזמנות שלי
              </h3>
              {currentUser.reservations.length > 0 ? (
                currentUser.reservations.map((res) => (
                  <div
                    key={res.id}
                    className="bg-card p-4 rounded-2xl shadow-sm border border-accent hover:border-primary/50 transition-all animate-bubble-in"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className="text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: "hsl(var(--success) / 0.1)",
                          color: "hsl(var(--success))",
                        }}
                      >
                        <CheckCircle size={10} />
                        מאושר
                      </span>
                      <Clock className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                    <h4 className="font-bold text-card-foreground mb-2">
                      {res.restaurantName}
                    </h4>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
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
                  <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs">עדיין אין הזמנות רשומות</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <UserIcon size={48} className="text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">
              עליך להתחבר כדי לצפות בהזמנות שלך
            </p>
            <button
              onClick={() => {
                onClose()
                onLogin()
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold active:scale-95 transition-all"
            >
              התחברות
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
