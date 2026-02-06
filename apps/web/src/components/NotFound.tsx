import { Link } from '@tanstack/react-router'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="relative max-w-2xl mx-auto text-center">
        <div className="absolute inset-0 bg-linear-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-8 mx-auto">
            <Search className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mb-4">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 flex items-center gap-2"
              aria-label="Go to home page"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 flex items-center gap-2"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
