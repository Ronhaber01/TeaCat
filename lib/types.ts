export type Database = {
  public: {
    Tables: {
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> }
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      tickets: { Row: Ticket; Insert: Partial<Ticket>; Update: Partial<Ticket> }
      hosts: { Row: Host; Insert: Partial<Host>; Update: Partial<Host> }
      saved_events: { Row: SavedEvent; Insert: Partial<SavedEvent>; Update: Partial<SavedEvent> }
      crew: { Row: Crew; Insert: Partial<Crew>; Update: Partial<Crew> }
    }
  }
}

export type Event = {
  id: string
  host_id: string | null
  title: string
  description: string | null
  flyer_url: string | null
  venue_name: string | null
  address: string | null
  neighborhood: string | null
  city: string
  starts_at: string
  ends_at: string | null
  category: 'club' | 'house' | 'techno' | 'rave' | 'live' | 'date' | 'rooftop' | 'bar' | 'community' | 'popup' | 'other' | null
  vibe_tags: string[] | null
  price_min: number
  price_max: number | null
  is_free: boolean
  ticket_capacity: number | null
  tickets_sold: number
  is_published: boolean
  is_cancelled: boolean
  boost_active: boolean
  boost_expires_at: string | null
  created_at: string
  updated_at: string
  // joined
  host?: Host
}

export type Host = {
  id: string
  user_id: string | null
  name: string
  slug: string
  bio: string | null
  logo_url: string | null
  cover_url: string | null
  neighborhood: string | null
  city: string
  instagram_handle: string | null
  website_url: string | null
  host_type: 'venue' | 'promoter' | 'brand' | 'dj' | 'collective' | null
  is_verified: boolean
  boost_credits: number
  created_at: string
  updated_at: string
}

export type User = {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  neighborhood: string | null
  city: string
  tc_score: number
  created_at: string
  updated_at: string
}

export type Ticket = {
  id: string
  event_id: string | null
  user_id: string | null
  ticket_code: string
  tier: string
  price_paid: number
  currency: string
  stripe_payment_id: string | null
  status: 'active' | 'used' | 'cancelled' | 'refunded'
  checked_in_at: string | null
  created_at: string
  event?: Event
}

export type SavedEvent = {
  id: string
  user_id: string | null
  event_id: string | null
  created_at: string
  event?: Event
}

export type Crew = {
  id: string
  user_id: string | null
  friend_id: string | null
  status: 'pending' | 'accepted'
  created_at: string
  friend?: User
}

// Main event categories (venue / event type)
export const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'genres', label: 'Music Genres' },
  { value: 'club', label: 'Club' },
  { value: 'bar', label: 'Bar' },
  { value: 'popup', label: 'Pop Up' },
  { value: 'live', label: 'Live Music' },
  { value: 'community', label: 'Community' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'rave', label: 'Rave' },
] as const

// Music genres — stored in vibe_tags[]
export const GENRES = [
  'House',
  'Techno',
  'Drum & Bass',
  'Jungle / Breaks',
  'Trance',
  'Ambient / Downtempo',
  'Afrobeats',
  'Hip-Hop / Rap',
  'R&B',
  'Funk / Soul',
  'Jazz',
  'Reggaeton',
  'Latin / Salsa',
  'Dancehall',
  'UK Garage / Bass',
  'Dubstep',
  'Hardstyle',
  'Experimental',
  'Pop',
  'Rock / Indie',
] as const

export type Genre = typeof GENRES[number]

export const VIBES = [
  { value: 'on_fire', label: 'On Fire' },
  { value: 'dance', label: 'Dance' },
  { value: 'chill', label: 'Chill' },
  { value: 'late_night', label: 'Late Night' },
  { value: 'underground', label: 'Underground' },
]

export const SITUATIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'date', label: 'Date' },
  { value: 'group', label: 'Group' },
  { value: 'last_min', label: 'Last Minute' },
]
