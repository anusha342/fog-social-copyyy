"use client"

import Image from "next/image"
import { Zap } from "lucide-react"
import { SignOutButton } from "./SignOutButton"

interface Props {
  name: string | null | undefined
  image: string | null | undefined
}

export function Navbar({ name, image }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-1.5">
        <Zap size={11} className="fill-primary text-primary" aria-hidden />
        <span className="text-sm font-black tracking-tight">
          <span className="text-foreground">FOG</span>
          <span className="text-primary"> SOCIAL</span>
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="size-7 overflow-hidden rounded-full bg-primary/20">
          {image ? (
            <Image src={image} alt="" width={28} height={28} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-[11px] font-bold text-primary">
              {name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="hidden text-sm font-medium text-foreground sm:block">{name}</span>
        <SignOutButton />
      </div>
    </div>
  )
}
