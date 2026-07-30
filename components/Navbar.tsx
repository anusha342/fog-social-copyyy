"use client"

import { useState, useEffect, useRef, useMemo, useCallback, createElement } from "react"
import Image from "next/image"
import Link from "next/link"
import { Zap, LogOut, ChevronDown } from "lucide-react"
import { signOut } from "next-auth/react"

interface Props {
  name: string | null | undefined
  image: string | null | undefined
}

export function Navbar({ name, image }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 select-none">
      {/* Clickable FOG SOCIAL Logo Link */}
      <Link href="/dashboard" className="group flex items-center gap-2 cursor-pointer select-none">
        <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
          <Zap size={13} className="fill-primary text-primary group-hover:scale-110 transition-transform" aria-hidden />
        </div>
        <span className="text-sm font-black tracking-tight uppercase">
          <span className="text-foreground transition-colors group-hover:text-primary">FOG</span>
          <span className="text-primary transition-colors group-hover:text-foreground"> SOCIAL</span>
        </span>
      </Link>

      {/* Interactive Profile Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 hover:opacity-80 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <span className="hidden text-sm font-bold text-zinc-700 sm:block">{name}</span>
          <div className="size-8 overflow-hidden rounded-full bg-primary/20 border border-primary/10 shadow-sm">
            {image ? (
              <Image src={image} alt="" width={32} height={32} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-black text-primary">
                {name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150 origin-top-right">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-red-600 font-mono uppercase tracking-wide hover:bg-red-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogOut size={12} className="text-red-500" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export interface TextTypeProps {
  text: string | string[]
  as?: React.ElementType
  typingSpeed?: number
  initialDelay?: number
  pauseDuration?: number
  deletingSpeed?: number
  loop?: boolean
  className?: string
  showCursor?: boolean
  hideCursorWhileTyping?: boolean
  cursorCharacter?: string | React.ReactNode
  cursorClassName?: string
  cursorBlinkDuration?: number
  textColors?: string[]
  variableSpeed?: { min: number; max: number }
  onSentenceComplete?: (sentence: string, index: number) => void
  startOnVisible?: boolean
  reverseMode?: boolean
  style?: React.CSSProperties
  isHovered?: boolean
}

export function TextType({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  isHovered = false,
  ...props
}: TextTypeProps) {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const initialText = textArray[0] || '';
  const processedText = reverseMode ? initialText.split('').reverse().join('') : initialText;

  const [displayedText, setDisplayedText] = useState(processedText);
  const [currentCharIndex, setCurrentCharIndex] = useState(processedText.length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const containerRef = useRef<HTMLElement>(null);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'inherit';
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: NodeJS.Timeout;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText(prev => prev + processedText[currentCharIndex]);
              setCurrentCharIndex(prev => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete
  ]);

  const lines = displayedText.split('\n');
  const line1 = lines[0] || '';
  const line2 = lines[1] || '';

  return (
    <>
      <style>{`
        .text-type {
          display: inline-block;
          white-space: pre-wrap;
        }
      `}</style>
      {createElement(
        Component,
        {
          ref: containerRef,
          className: `text-type ${className}`,
          ...props
        },
        <span 
          className="block text-zinc-950"
          style={{ 
            fontSize: "clamp(72px, 11vw, 140px)", 
            lineHeight: 0.88,
            textShadow: '1px 1px 0px #ffffff, 2px 2px 0px #e4e4e7, 3px 3px 0px #cbd5e1, 4px 4px 0px #94a3b8, 5px 5px 8px rgba(0,0,0,0.15)',
            transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          {line1 || '\u200b'}
        </span>,
        <span 
          className="block text-orange-500"
          style={{ 
            fontSize: "clamp(72px, 11vw, 140px)", 
            lineHeight: 0.88,
            textShadow: '1px 1px 0px #ffffff, 2px 2px 0px #fed7aa, 3px 3px 0px #f97316, 4px 4px 0px #ea580c, 5px 5px 0px #9a3412, 6px 6px 12px rgba(0,0,0,0.2)',
            transform: isHovered ? 'translateZ(45px)' : 'translateZ(0px)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          {line2 || '\u200b'}
        </span>
      )}
    </>
  );
}

export function InteractiveLogo() {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const logoRef = useRef<HTMLHeadingElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (!logoRef.current) return
    const rect = logoRef.current.getBoundingClientRect()
    
    // Calculate cursor position relative to logo center (range: -0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    
    // Cap tilt angles (max 28 degrees rotation)
    setCoords({ x: x * 28, y: -y * 28 })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setCoords({ x: 0, y: 0 })
  }

  const transformStyle = isHovered
    ? `perspective(1000px) rotateX(${coords.y}deg) rotateY(${coords.x}deg) scale3d(1.04, 1.04, 1.04)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'

  return (
    <>
      <style>{`
        @keyframes float-logo {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .logo-float {
          animation: float-logo 6s ease-in-out infinite;
          animation-delay: 1.2s;
        }
      `}</style>
      <h1 
        ref={logoRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="font-black leading-none tracking-tighter select-none font-sans uppercase logo-float cursor-pointer relative z-20 text-center flex flex-col items-center justify-center"
        style={{
          transform: transformStyle,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        <TextType 
          text={"FOG\nSOCIAL"}
          as="span"
          typingSpeed={120}
          deletingSpeed={80}
          pauseDuration={4000}
          showCursor={false}
          isHovered={isHovered}
        />
      </h1>
    </>
  )
}
