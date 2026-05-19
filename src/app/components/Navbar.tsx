import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#DDE8F7]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-[#1C2333]">Northeast</span><span className="text-[#2551CC]">Trips</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          <a href="#how-it-works" className="text-sm text-[#6B7280] hover:text-[#2551CC] transition font-medium">
            How it Works
          </a>
          <a href="#destinations" className="text-sm text-[#6B7280] hover:text-[#2551CC] transition font-medium">
            Destinations
          </a>
          <a href="#about" className="text-sm text-[#6B7280] hover:text-[#2551CC] transition font-medium">
            About
          </a>
        </div>

        <a
          href="#planner"
          className="ml-auto bg-gradient-to-r from-[#2551CC] to-[#163099] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-lg hover:shadow-[#2551CC]/20 hover:opacity-95 transition-all active:scale-95"
        >
          Plan Trip
        </a>

      </div>
    </nav>
  );
}
