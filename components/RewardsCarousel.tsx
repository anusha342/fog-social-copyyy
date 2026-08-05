"use client"
// Touch to force compile
import { useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"

interface Slide {
  url: string
  title: string
  subtitle?: string
}

interface RewardsCarouselProps {
  bannerUrl?: string | null
  rewards?: any[]
  tournamentName?: string
}

export function RewardsCarousel({ bannerUrl, rewards, tournamentName }: RewardsCarouselProps) {
  const slides: Slide[] = []
  // Always push the tournament slide as the 1st option with all-rewards flag
  slides.push({
    url: "all-rewards",
    title: tournamentName || "Active Tournament",
    subtitle: "Join now to compete for rewards!",
  })

  // Find 1st, 2nd, 3rd rewards
  const r1 = rewards?.find((r) => r.rank === 1)
  const r2 = rewards?.find((r) => r.rank === 2)
  const r3 = rewards?.find((r) => r.rank === 3)

  if (r1?.image_url) {
    slides.push({
      url: r1.image_url,
      title: r1.title || "1st Place Reward",
    })
  }
  if (r2?.image_url) {
    slides.push({
      url: r2.image_url,
      title: r2.title || "2nd Place Reward",
    })
  }
  if (r3?.image_url) {
    slides.push({
      url: r3.image_url,
      title: r3.title || "3rd Place Reward",
    })
  }

  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <div className="relative w-full h-[200px] sm:h-[240px] rounded-2xl overflow-hidden shadow-md select-none group border border-amber-500/25">
      {/* Background container holding the slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Santa's Lucky Spin style: full-bleed background card layout */}
          <div className={`relative w-full h-full flex bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white transition-all duration-300 ${
            slide.url === "all-rewards" 
              ? "flex-col justify-start items-center text-center p-4 sm:p-5 pt-3 pb-7 gap-2" 
              : "flex-row justify-between items-center p-6 sm:p-8"
          }`}>
            
            {/* Festive Hanging Lights Overlay (SVG styled as Santa's lights decoration) */}
            <div className="absolute top-0 inset-x-0 h-8 opacity-40 pointer-events-none z-10 bg-repeat-x" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath d='M0,0 Q10,12 20,0 Q30,12 40,0' fill='none' stroke='white' stroke-width='1'/%3E%3Ccircle cx='10' cy='6' r='2' fill='%23ffeb3b'/%3E%3Ccircle cx='20' cy='0' r='2.5' fill='%23ff1744'/%3E%3Ccircle cx='30' cy='6' r='2' fill='%2300e676'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 20px'
            }} />

            {slide.url === "all-rewards" ? (
              <>
                {/* Top Text Content */}
                <div className="flex flex-col items-center text-center z-20 max-w-[85%] mt-1 sm:mt-1.5">
                  <h3 className="font-sans text-base sm:text-xl font-black tracking-tight leading-tight mt-0.5 sm:mt-1 text-white uppercase drop-shadow-sm">
                    {slide.title}
                  </h3>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] font-bold text-zinc-150 tracking-wide leading-none font-sans">
                    Join now to compete for rewards!
                  </p>
                </div>

                {/* Bottom Photos Content (Clean Side-by-Side Podium Row) */}
                <div className="flex items-center justify-center gap-3 sm:gap-4.5 w-full h-[95px] sm:h-[120px] mt-1 sm:mt-1.5 z-20">
                  {r3?.image_url && (
                    <div className="relative h-[80%] sm:h-[88%] aspect-square flex items-center justify-center bg-white p-1 rounded-xl border border-white/80 shadow-md">
                      <img
                        src={r3.image_url}
                        alt="3rd Place Reward"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  {r1?.image_url && (
                    <div className="relative h-[95%] sm:h-[100%] aspect-square flex items-center justify-center bg-white p-1 rounded-xl border border-white shadow-lg z-10 animate-[float_4s_ease-in-out_infinite]">
                      <img
                        src={r1.image_url}
                        alt="1st Place Reward"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  {r2?.image_url && (
                    <div className="relative h-[85%] sm:h-[92%] aspect-square flex items-center justify-center bg-white p-1 rounded-xl border border-white/80 shadow-md">
                      <img
                        src={r2.image_url}
                        alt="2nd Place Reward"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Left side text overlays */}
                <div className="flex flex-col justify-center text-left z-20 max-w-[55%]">
                  <h3 className="font-sans text-lg sm:text-2xl font-black tracking-tight leading-tight mt-1 text-white uppercase drop-shadow-sm">
                    {slide.title}
                  </h3>
                  {slide.subtitle && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-zinc-100 leading-snug font-sans bg-black/15 py-1 px-2.5 rounded-lg border border-white/10 w-fit">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                {/* Right side floating/hovering image */}
                <div className="relative h-full w-[42%] flex items-center justify-center z-20 animate-[float_4s_ease-in-out_infinite]">
                  <img
                    src={slide.url}
                    alt={slide.title}
                    className="max-h-[96%] max-w-full object-contain rounded-xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                  />
                </div>
              </>
            )}

            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmerSweep_6s_infinite_linear]" />
          </div>
        </div>
      ))}

      {/* Slide dots indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`size-2 rounded-full transition-all duration-305 ${
                idx === currentSlide ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Next/Chevron Button (Centered Vertically) */}
      {slides.length > 1 && (
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/25 text-white shadow-md active:scale-90 transition-all cursor-pointer backdrop-blur-xs select-none"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  )
}
