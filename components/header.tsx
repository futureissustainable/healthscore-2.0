export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <nav className="container mx-auto max-w-7xl px-6 py-6 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <img
              src="https://cdn.prod.website-files.com/68724770b6ac4d56582886e7/68c9ac09ebd0fa4f4e6426b6_Healthscore%20logo.avif"
              alt="Healthscore Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-slate-900 tracking-tight">HEALTHSCORE</span>
          </div>
          <div className="text-xs text-slate-500 tracking-wider mt-1">BETA</div>
        </div>

        <div className="hidden sm:flex items-center space-x-8">
          <a href="#" className="text-slate-900 font-medium hover:text-slate-700 transition-colors relative">
            Score
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          </a>
          <span className="text-slate-400 cursor-not-allowed">Discover</span>
          <span className="text-slate-400 cursor-not-allowed">Meal Planner</span>
          <span className="text-slate-400 cursor-not-allowed">Preferences</span>
        </div>
      </nav>
    </header>
  )
}
