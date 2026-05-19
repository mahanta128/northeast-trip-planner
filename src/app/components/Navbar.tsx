export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-[#1B4332] text-lg tracking-tight">
            Northeast<span className="text-emerald-500">Trips</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">
            How it Works
          </a>
          <a href="#destinations" className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">
            Destinations
          </a>
          <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition font-medium">
            About
          </a>
        </div>

        <a
          href="#planner"
          className="ml-auto bg-[#1B4332] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-800 transition-colors active:scale-95"
        >
          Plan Trip
        </a>
      </div>
    </nav>
  );
}
