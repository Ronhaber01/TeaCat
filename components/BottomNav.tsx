'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? '#7B2EFF' : 'none'} viewBox="0 0 24 24" stroke={active ? '#7B2EFF' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={active ? '#7B2EFF' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={active ? '#7B2EFF' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill={active ? '#7B2EFF' : 'none'} viewBox="0 0 24 24" stroke={active ? '#7B2EFF' : '#666'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-[#111111] border-t border-[#2A2A2A] z-50"
      style={{ maxWidth: 430 }}
    >
      <div className="flex items-center justify-around px-2 pt-3 pb-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 min-w-[60px] active:scale-90 transition-transform"
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-[#7B2EFF]' : 'text-[#666]'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
