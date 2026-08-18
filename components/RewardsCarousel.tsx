"use client"
// Touch to force compile
import { useState, useEffect } from "react"

interface Slide {
  url: string
  title: string
  subtitle?: string
  rank?: number
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
  const r1 = rewards?.find((r) => Number(r.rank) === 1)
  const r2 = rewards?.find((r) => Number(r.rank) === 2)
  const r3 = rewards?.find((r) => Number(r.rank) === 3)

  if (r1) {
    if (r1.image_url) {
      slides.push({
        url: r1.image_url,
        title: r1.title || "1st Place Reward",
        rank: 1,
      })
    } else {
      slides.push({
        url: "cash-reward",
        title: r1.title || "1st Place Reward",
        subtitle: r1.prize_money || r1.title,
        rank: 1,
      })
    }
  }
  if (r2) {
    if (r2.image_url) {
      slides.push({
        url: r2.image_url,
        title: r2.title || "2nd Place Reward",
        rank: 2,
      })
    } else {
      slides.push({
        url: "cash-reward",
        title: r2.title || "2nd Place Reward",
        subtitle: r2.prize_money || r2.title,
        rank: 2,
      })
    }
  }
  if (r3) {
    if (r3.image_url) {
      slides.push({
        url: r3.image_url,
        title: r3.title || "3rd Place Reward",
        rank: 3,
      })
    } else {
      slides.push({
        url: "cash-reward",
        title: r3.title || "3rd Place Reward",
        subtitle: r3.prize_money || r3.title,
        rank: 3,
      })
    }
  }

  const [currentSlide, setCurrentSlide] = useState(0)

  // Swipe navigation logic for carousel
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (!touchStart) return
    const touch = e.changedTouches[0]
    const diffX = touchStart.x - touch.clientX
    const diffY = touchStart.y - touch.clientY

    // Ensure it's a clear horizontal swipe (more horizontal than vertical, and > 50px delta)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe Left -> Next Slide
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      } else {
        // Swipe Right -> Previous Slide
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      }
    }
    setTouchStart(null)
  }

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [slides.length])

  const hasPodium = !!(r1 || r2 || r3)

  if (slides.length === 0) return null

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${hasPodium ? "h-[200px] sm:h-[240px]" : "h-[100px] sm:h-[120px]"} rounded-2xl overflow-hidden shadow-md select-none group border border-amber-500/25`}
      style={{ perspective: "1200px" }}
    >
      {/* Background container holding the slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="h-full transition-all duration-500 origin-center"
            style={{
              width: `${100 / slides.length}%`,
              transform: idx === currentSlide ? "scale(1) rotateY(0deg)" : idx < currentSlide ? "scale(0.96) rotateY(6deg)" : "scale(0.96) rotateY(-6deg)",
              opacity: idx === currentSlide ? 1 : 0.25,
              filter: idx === currentSlide ? "none" : "blur(0.5px)",
              pointerEvents: idx === currentSlide ? "auto" : "none",
            }}
          >
            {/* Santa's Lucky Spin style: full-bleed background card layout */}
            <div className={`relative w-full h-full flex bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white transition-all duration-300 ${slide.url === "all-rewards"
              ? (hasPodium ? "flex-col justify-start items-center text-center p-4 sm:p-5 pt-3 pb-7 gap-2" : "flex-col justify-center items-center text-center p-4 sm:p-5")
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
                    {r3 && (
                      <div className="relative h-[80%] sm:h-[88%] aspect-square flex flex-col items-center justify-center glass-pill-3d !bg-white/95 !border-white/90 p-1.5 rounded-xl shadow-md text-center">
                        {r3.image_url ? (
                          <img
                            src={r3.image_url}
                            alt="3rd Place Reward"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center select-none">
                            <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🥉</span>
                            <span className="font-sans text-[8px] sm:text-[10px] font-black text-zinc-955 tracking-tight leading-none px-1 break-words max-w-full">
                              {r3.prize_money || r3.title}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {r1 && (
                      <div className="relative h-[95%] sm:h-[100%] aspect-square flex flex-col items-center justify-center glass-pill-3d !bg-white/98 !border-white/95 p-1.5 rounded-xl shadow-lg z-10 animate-[float_4s_ease-in-out_infinite] text-center">
                        {r1.image_url ? (
                          <img
                            src={r1.image_url}
                            alt="1st Place Reward"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center select-none">
                            <span className="text-2xl sm:text-3xl mb-0.5 sm:mb-1.5">🥇</span>
                            <span className="font-sans text-[9px] sm:text-[11px] font-black text-zinc-955 tracking-tight leading-none px-1 break-words max-w-full">
                              {r1.prize_money || r1.title}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {r2 && (
                      <div className="relative h-[85%] sm:h-[92%] aspect-square flex flex-col items-center justify-center glass-pill-3d !bg-white/95 !border-white/90 p-1.5 rounded-xl shadow-md text-center">
                        {r2.image_url ? (
                          <img
                            src={r2.image_url}
                            alt="2nd Place Reward"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center select-none">
                            <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🥈</span>
                            <span className="font-sans text-[8px] sm:text-[10px] font-black text-zinc-955 tracking-tight leading-none px-1 break-words max-w-full">
                              {r2.prize_money || r2.title}
                            </span>
                          </div>
                        )}
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

                  {/* Right side floating/hovering content */}
                  <div className="relative h-full w-[42%] flex items-center justify-center z-20 animate-[float_4s_ease-in-out_infinite]">
                    {slide.url === "cash-reward" ? (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center glass-pill-3d rounded-2xl p-3 !bg-white/95 border-white shadow-md text-center">
                        <span className="text-2xl sm:text-3xl mb-1 sm:mb-1.5 select-none">
                          {slide.rank === 1 ? "🥇" : slide.rank === 2 ? "🥈" : "🥉"}
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-extrabold text-zinc-955 tracking-tight leading-none">
                          {slide.subtitle}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={slide.url}
                        alt={slide.title}
                        className="max-h-[96%] max-w-full object-contain rounded-xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmerSweep_6s_infinite_linear]" />
            </div>
          </div>
        ))}
      </div>

      {/* Slide dots indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`size-2 rounded-full transition-all duration-305 ${idx === currentSlide ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
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
