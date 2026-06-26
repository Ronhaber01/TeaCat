'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Magnifying glass with spark — Explore icon
function ExploreIcon({ active }: { active: boolean }) {
  const c = active ? '#A3FF12' : '#666'
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Magnifying glass */}
      <circle cx="10" cy="10" r="6"/>
      <line x1="14.5" y1="14.5" x2="20" y2="20"/>
      {/* Spark rays from top-right */}
      <line x1="17" y1="3" x2="17" y2="5"/>
      <line x1="21" y1="5" x2="19.5" y2="6.5"/>
      <line x1="23" y1="9" x2="21" y2="9"/>
      {/* Sparkle dot */}
      <circle cx="18.5" cy="5.5" r="0.75" fill={c} stroke="none"/>
    </svg>
  )
}

const leftTabs = [
  { href: '/', label: 'Home', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A3FF12' : '#666'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { href: '/tickets', label: 'Tickets', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A3FF12' : '#666'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )},
]

const rightTabs = [
  { href: '/host/create', label: 'Create', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A3FF12' : '#666'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )},
  { href: '/profile', label: 'Profile', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A3FF12' : '#666'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )},
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const exploreActive = pathname.startsWith('/explore')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-[#1A1A1A]">
      <div className="grid grid-cols-5 items-end pb-safe">
        {leftTabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-end pb-3 pt-2 gap-0.5 active:scale-90 transition-transform"
            >
              {tab.icon(active)}
              <span className="text-[10px] font-semibold" style={{ color: active ? '#A3FF12' : '#666' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* Center floating Explore button */}
        <div className="flex flex-col items-center -mt-7 pb-2">
          <Link
            href="/explore"
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#7B2EFF]/40 active:scale-90 transition-transform mb-0.5"
            style={{ background: exploreActive ? '#A3FF12' : '#7B2EFF' }}
          >
            <ExploreIcon active={false} />
          </Link>
          <span className="text-[10px] font-semibold" style={{ color: exploreActive ? '#A3FF12' : '#666' }}>
            Explore
          </span>
        </div>

        {rightTabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-end pb-3 pt-2 gap-0.5 active:scale-90 transition-transform"
            >
              {tab.icon(active)}
              <span className="text-[10px] font-semibold" style={{ color: active ? '#A3FF12' : '#666' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
