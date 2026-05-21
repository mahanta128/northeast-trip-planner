import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#DDE8F7] print-hide">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">

        <Link href="/" className="shrink-0">
          <div className="w-11 h-11 rounded-full bg-white/80 border border-[#DDE8F7] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rhinotrek-logo.webp"
              alt="RhinoTrek — Northeast India"
              className="w-9 h-9 object-contain"
            />
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          <a href="#how-it-works" className="text-sm text-[#6B7280] hover:text-[#1C2333] transition font-medium">
            How it Works
          </a>
          <a href="#destinations" className="text-sm text-[#6B7280] hover:text-[#1C2333] transition font-medium">
            Destinations
          </a>
          <a href="#about" className="text-sm text-[#6B7280] hover:text-[#1C2333] transition font-medium">
            About
          </a>
        </div>

        <a
          href="#planner"
          className="ml-auto bg-[#1C2333] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:bg-[#2e3a50] hover:shadow-md transition-all active:scale-95"
        >
          Plan Trip
        </a>

      </div>
    </nav>
  );
}
