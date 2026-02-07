"use client"

import { useState } from "react"
import { X, Utensils } from "lucide-react"

interface AuthModalProps {
  onClose: () => void
  onAuth: (user: { name: string; email: string }) => void
}

export default function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const displayName = formData.name.trim() || formData.email.split("@")[0]
    onAuth({ name: displayName, email: formData.email })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-full transition-all"
          aria-label="סגור"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-4 shadow-lg">
              <Utensils size={24} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">
              {authMode === "login" ? "ברוכים השבים!" : "הצטרפו ל-RESTOBOT"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {authMode === "login"
                ? "הכנסו לחשבון כדי לנהל את ההזמנות"
                : "צרו חשבון בחינם והתחילו להזמין"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 mr-1">
                  שם מלא
                </label>
                <input
                  type="text"
                  placeholder="ישראל ישראלי"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-ring outline-none text-card-foreground"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 mr-1">
                אימייל
              </label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-ring outline-none text-card-foreground"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 mr-1">
                סיסמה
              </label>
              <input
                type="password"
                required
                placeholder="--------"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-ring outline-none text-card-foreground"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl active:scale-[0.98]"
            >
              {authMode === "login" ? "התחברות" : "הרשמה למערכת"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              {authMode === "login"
                ? "אין לכם חשבון? הרשמו כאן"
                : "כבר רשומים? התחברו כאן"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
