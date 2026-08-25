import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-500" />
          <span className="text-sm font-bold text-slate-900">
            Resume<span className="text-gradient-brand">AI</span>
          </span>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} ResumeAI. Built with React, LangChain & MongoDB.
        </p>
      </div>
    </footer>
  )
}
