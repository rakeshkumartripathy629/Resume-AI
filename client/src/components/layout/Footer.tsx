import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-900">
            Resume<span className="text-indigo-600">AI</span>
          </span>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} ResumeAI. Built with React, LangChain & MongoDB.
        </p>
      </div>
    </footer>
  )
}
