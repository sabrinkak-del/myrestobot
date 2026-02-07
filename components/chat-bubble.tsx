"use client"

import { Bot } from "lucide-react"

interface Message {
  id: string
  role: "user" | "model"
  text: string
  timestamp: Date
  suggestions?: string[]
}

interface ChatBubbleProps {
  message: Message
  onSuggestionClick: (text: string) => void
}

export default function ChatBubble({ message, onSuggestionClick }: ChatBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-bubble-in`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%]`}>
        {!isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm mb-1">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isUser
                ? "bg-primary text-primary-foreground rounded-bl-sm"
                : "bg-card text-card-foreground border border-border rounded-br-sm"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>

          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-xs px-3 py-2 rounded-xl border border-primary/30 bg-accent text-accent-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <span className="text-[10px] text-muted-foreground px-1">
            {message.timestamp.toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
