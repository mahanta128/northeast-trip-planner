import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="absolute top-0 inset-x-0 z-50 print-hide">
      <div className="flex items-center justify-between px-6 sm:px-8 pt-5">

        {/* Logo — standalone floating circle */}
        <Link href="/" className="shrink-0 block">
          <div
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rhinotrek-logo.webp"
              alt="RhinoTrek — Northeast India"
              className="w-10 h-10 object-contain"
            />
          </div>
        </Link>

        {/* Desktop: floating white nav pill ─────────────────────── */}
        <div
          className="hidden md:flex items-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
            padding: "5px 5px 5px 28px",
          }}
        >
          {/* Nav links */}
          <div className="flex items-center gap-7">
            <a
              href="#destinations"
              className="text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors whitespace-nowrap flex items-center gap-1"
            >
              Destinations
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-40 mt-[1px] shrink-0">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </a>
            <a
              href="#about"
              className="text-[14px] font-medium text-[#374151] hover:text-[#111827] transition-colors whitespace-nowrap"
            >
              About
            </a>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[#D1D5DB] mx-6 shrink-0" />

          {/* CTA — nested dark pill */}
          <a
            href="#planner"
            className="bg-[#1C2333] text-white text-[14px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#2e3a50] transition-colors active:scale-95 whitespace-nowrap"
          >
            Plan Trip
          </a>
        </div>

        {/* Mobile: compact standalone CTA ────────────────────────── */}
        <a
          href="#planner"
          className="md:hidden bg-white text-[#1C2333] text-[13px] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
        >
          Plan Trip
        </a>

      </div>
    </nav>
  );
}
