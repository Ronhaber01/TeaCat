import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
  variant?: 'featured' | 'grid' | 'list'
}

export default function EventCard({ event, variant = 'grid' }: EventCardProps) {
  const startTime = new Date(event.starts_at)
  const isBoosted = event.boost_active

  if (variant === 'featured') {
    return (
      <Link href={`/events/${event.id}`} className='block flex-shrink-0 w-72'>
        <div className='relative rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform'>
          <div className='relative h-80 w-full bg-[#2A2A2A]'>
            {event.flyer_url ? (
              <Image src={event.flyer_url} alt={event.title} fill className='object-cover' unoptimized />
            ) : (
              <FlyerPlaceholder category={event.category} title={event.title} />
            )}
            {isBoosted && <BoostBadge />}
            <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent' />
            <div className='absolute bottom-3 left-3 right-3'>
              <p className='text-xs text-[#A3FF12] font-semibold uppercase tracking-wider mb-1'>
                {event.neighborhood || event.city}
              </p>
              <h3 className='text-white font-bold text-lg leading-tight line-clamp-2'>{event.title}</h3>
            </div>
          </div>
          <div className='px-3 py-3 flex items-center justify-between'>
            <div className='flex items-center gap-2 text-gray-400 text-sm'>
              <ClockIcon />
              <span>{format(startTime, 'EEE, MMM d · h:mm a')}</span>
            </div>
            <PriceTag event={event} />
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'list') {
    return (
      <Link href={`/events/${event.id}`} className='block'>
        <div className='flex gap-3 p-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform'>
          <div className='relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#2A2A2A]'>
            {event.flyer_url ? (
              <Image src={event.flyer_url} alt={event.title} fill className='object-cover' unoptimized />
            ) : (
              <FlyerPlaceholder category={event.category} title={event.title} small />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <h3 className='font-bold text-white text-sm leading-tight line-clamp-2'>{event.title}</h3>
              {isBoosted && <span className='text-[#A3FF12] text-xs font-bold flex-shrink-0'>↑ HOT</span>}
            </div>
            <p className='text-gray-500 text-xs mt-1'>{event.venue_name || event.neighborhood}</p>
            <div className='flex items-center justify-between mt-2'>
              <span className='text-gray-400 text-xs'>{format(startTime, 'EEE · h:mm a')}</span>
              <PriceTag event={event} small />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Default: grid
  return (
    <Link href={`/events/${event.id}`} className='block'>
      <div className='relative rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform'>
        <div className='relative h-44 bg-[#2A2A2A]'>
          {event.flyer_url ? (
            <Image src={event.flyer_url} alt={event.title} fill className='object-cover' unoptimized />
          ) : (
            <FlyerPlaceholder category={event.category} title={event.title} />
          )}
          {isBoosted && <BoostBadge />}
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent' />
          <div className='absolute bottom-2 left-3 right-3'>
            <h3 className='text-white font-bold text-sm leading-tight line-clamp-2'>{event.title}</h3>
          </div>
        </div>
        <div className='px-3 py-2 flex items-center justify-between'>
          <div>
            <p className='text-gray-400 text-xs'>{event.neighborhood || event.venue_name}</p>
            <p className='text-gray-500 text-xs'>{format(startTime, 'EEE, MMM d · h:mm a')}</p>
          </div>
          <PriceTag event={event} small />
        </div>
      </div>
    </Link>
  )
}

function BoostBadge() {
  return (
    <div className='absolute top-2 right-2 bg-[#A3FF12] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10'>
      Hot
    </div>
  )
}

// FIX: divide by 100 — price_min is stored in cents
function PriceTag({ event, small }: { event: Event; small?: boolean }) {
  const cls = small ? 'text-xs font-bold' : 'text-sm font-bold'
  if (event.is_free) return <span className={`text-[#A3FF12] ${cls}`}>Free</span>
  if (event.price_min === 0) return <span className={`text-[#A3FF12] ${cls}`}>Free+</span>
  return <span className={`text-white ${cls}`}>${(event.price_min / 100).toFixed(0)}</span>
}

function ClockIcon() {
  return (
    <svg width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <circle cx='12' cy='12' r='10' /><path strokeLinecap='round' d='M12 6v6l4 2' />
    </svg>
  )
}

function FlyerPlaceholder({ category, title, small }: { category: string | null; title: string; small?: boolean }) {
  const categoryColors: Record<string, string> = {
    club: 'from-purple-900 to-purple-700',
    house: 'from-orange-900 to-orange-700',
    techno: 'from-gray-900 to-gray-700',
    rave: 'from-pink-900 to-purple-900',
    live: 'from-blue-900 to-blue-700',
    date: 'from-rose-900 to-rose-700',
    rooftop: 'from-sky-900 to-sky-700',
    bar: 'from-amber-900 to-amber-700',
    community: 'from-green-900 to-green-700',
    other: 'from-gray-900 to-gray-700',
  }
  const gradient = categoryColors[category || 'other'] || 'from-gray-900 to-gray-700'
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      {!small && (
        <span className='text-white/20 font-black text-2xl text-center px-4 leading-tight line-clamp-3'>
          {title}
        </span>
      )}
    </div>
  )
}
