import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function TermsPage() {
  return (
    <div className='min-h-screen bg-[#111111] pb-28'>
      <div className='px-5 pt-14 pb-10 max-w-xl mx-auto'>
        <Link href='/' className='text-[#7B2EFF] text-sm font-semibold mb-6 block'>← Back</Link>

        <h1 className='text-white font-black text-3xl mb-2'>Terms of Service</h1>
        <p className='text-gray-500 text-sm mb-8'>Last updated: June 2026</p>

        <div className='flex flex-col gap-6 text-gray-400 text-sm leading-relaxed'>
          <section>
            <h2 className='text-white font-bold text-base mb-2'>1. What TeaCat is</h2>
            <p>TeaCat is a platform that helps you discover and buy tickets to nightlife events in New York City. We connect event hosts with attendees.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>2. Tickets &amp; Payments</h2>
            <p>All ticket sales are final. Refunds are at the discretion of the event host. Payments are processed securely by Stripe. TeaCat charges 0% platform fee — hosts receive 100% of ticket revenue.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>3. Your Account</h2>
            <p>You need a valid email address to use TeaCat. You are responsible for keeping your account secure. We use magic link authentication — no passwords stored.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>4. Event Hosts</h2>
            <p>Hosts are responsible for the accuracy of their event listings and for honouring tickets sold through TeaCat. TeaCat reserves the right to remove listings that violate our community standards.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>5. Privacy</h2>
            <p>We collect your email address to authenticate you and send ticket confirmations. We do not sell your data to third parties. Event hosts can see the number of tickets sold but not attendee personal details.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>6. No Spam</h2>
            <p>We will only email you for ticket confirmations and essential account notifications. No marketing emails without explicit opt-in.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>7. Contact</h2>
            <p>Questions? Email us at <a href='mailto:hello@tea-cat.com' className='text-[#7B2EFF]'>hello@tea-cat.com</a></p>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
