# FOG Social - UI/UX Style Guide & Theme Documentation

This document defines the design tokens, color palette, typography sizes, card patterns, and micro-interactions used across the FOG Social platform (Dashboard and Tournaments pages).

---

## 1. Color Palette

The FOG Social design system utilizes a tailored warm-neutral palette. Surfaces carry a faint warm orange/cream tint so the interface never feels clinical or cold.

### Core Variables (`globals.css`)

| Token | Light Mode Value (Oklch / Hex) | Dark Mode Value (Oklch / Hex) | sUsage |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(1 0 0)` / `#ffffff` | `oklch(0.13 0.006 36.5)` / `#201f1e` | Main page background |
| `--foreground` | `oklch(0.12 0.005 36.5)` | `oklch(0.97 0 0)` | General body text color |
| `--primary` | `oklch(0.679 0.213 36.5)` / `#ff5722` | `oklch(0.73 0.19 36.5)` / `#ff6f43` | FOG Orange brand color, active highlights |
| `--primary-foreground`| `oklch(0.1 0 0)` | `oklch(0.1 0 0)` | Dark text on top of primary orange backgrounds |
| `--muted-foreground` | `oklch(0.5 0.012 36.5)` / `#8a7f77` | `oklch(0.63 0.01 36.5)` / `#a89d94` | Helper text, secondary metadata |
| `--border` | `oklch(0.908 0.012 36.5)` / `#e5e1dc` | `oklch(1 0 0 / 10%)` | General border color |
| `--card` | `oklch(0.99 0.002 36.5)` / `#faf9f8` | `oklch(0.18 0.008 36.5)` / `#2d2b2a` | Default cards and panels surface |

### Specific Dashboard Theme Accents

- **Warm Cream Accent** (`#D9CFC7` / `oklch(0.85 0.01 36.5)`): Used for default card borders and panel frames.
- **Forest Green Profile Accent** (Welcome Back):
  - Dark Green text: `text-[#335c49]`
  - Medium Green title: `text-[#5e8b76]`
  - Avatar border: `border-[#BED4CB]/50`
- **Telemetry Card Accents**:
  - **Games Played (Cyan)**: Border `border-cyan-300`, background `bg-cyan-50/70`, icon gradient `from-cyan-400 to-cyan-600`, text gradient `from-cyan-600 to-blue-600`
  - **Best Score (Amber)**: Border `border-amber-300`, background `bg-amber-50/70`, icon gradient `from-amber-400 to-orange-500`, text gradient `from-amber-600 to-orange-600`
  - **Global Rank (Violet)**: Border `border-indigo-300`, background `bg-indigo-50/70`, icon gradient `from-violet-400 to-indigo-600`, text gradient `from-violet-600 to-indigo-600`
  - **Tournament Arena Card (Pink)**: Border `border-pink-300`, background `bg-pink-50/80`, icon gradient `from-pink-400 to-pink-600`

---

## 2. Typography & Text Colors

FOG Social uses a mix of clean sans-serif typography for headings/body text and monospace font weights for numeric statistics or status metadata.

### Font Families
- **Sans-Serif (`font-sans`)**: Geist Sans (primary interface text).
- **Monospace (`font-mono`)**: Geist Mono (numbers, timestamps, tags, and small utility text).

### Sizes & Colors Reference

| Class Name | Font Weight / Letter Spacing | Color Token | Usage |
| :--- | :--- | :--- | :--- |
| `text-2xl sm:text-3xl` | `font-black font-sans tracking-tight uppercase` | `text-zinc-900` | Main Page Titles (e.g. Tournaments, Welcome Back) |
| `font-mono text-xs sm:text-sm` | `font-bold tracking-wide sm:tracking-[0.25em] uppercase` | `text-muted-foreground/60` | Section Panel Header Labels (e.g. Active, Past) |
| `text-sm sm:text-base` | `font-bold font-sans` | `text-zinc-900` / `text-zinc-950` | Primary Card Titles (e.g. Tournament labels) |
| `text-xs sm:text-sm` | `font-medium leading-relaxed` | `text-zinc-500` / `text-[#6e635c]` | General description texts |
| `font-mono text-xs sm:text-sm` | `font-bold tabular-nums` | `text-zinc-900` | Scores, Ranks, and Player counts |
| `font-mono text-[9px] sm:text-[10px]`| `font-bold tracking-wider uppercase` | Custom (e.g. `text-orange-700`, `text-zinc-650`) | Small status pills, detail badges |

---

## 3. Card & Panel Layout System

Dashboard and list items utilize structured containers to establish page grid flow.

### 1. Panel Wrap Containers
For wrapping lists or cards into uniform groups:
```html
<div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#D9CFC7] bg-white p-4 sm:p-6 shadow-sm">
  <!-- Header border-b section -->
  <!-- Cards stack inside -->
</div>
```
- **Border**: `border-[#D9CFC7]`
- **Background**: `bg-white`
- **Padding**: Mobile `p-4`, Desktop `p-6`
- **Roundings**: `rounded-2xl`
- **Shadow**: `shadow-sm`

### 2. Tournament List Cards (Uniform Sizing)
```html
<Link className="group relative flex items-center justify-between rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:shadow-sm">
```
- **Padding**: Mobile `p-3`, Desktop `p-4`
- **Roundings**: `rounded-xl`
- **Transitions**: `transition-all duration-300 hover:shadow-sm`
- **Active Arenas variation**:
  - Border: `border-orange-200`
  - Background: `bg-orange-50/15`
  - Hover states: `hover:border-orange-400 hover:bg-orange-50/25`
- **Completed History variation**:
  - Border: `border-[#D9CFC7]/40`
  - Background: `bg-white`
  - Hover states: `hover:border-[#D9CFC7]/80 hover:bg-[#D9CFC7]/15`

### 3. Icon Badges
- **Size**: `size-10 flex shrink-0 items-center justify-center rounded-xl`
- **Active**: `bg-orange-100 text-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.15)]`
- **Muted**: `bg-[#D9CFC7]/30 text-[#6e635c]`

---

## 4. Interactive Transitions & FX

- **Heartbeat Status Pulse**:
  - Pinging active dot: `h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping`
  - Pulsing live dot: `size-1.5 animate-pulse rounded-full bg-orange-500`
- **Hover Micro-Animations**:
  - Card hover displacement: `hover:-translate-y-1 hover:shadow-md`
  - Card icon zoom: `group-hover:scale-105`
  - Chevron offset: `group-hover:translate-x-0.5`
- **Radial Lighting Overlay**:
  - Backlight backdrop: `absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] rounded-full bg-zinc-300/40 blur-[130px]`
