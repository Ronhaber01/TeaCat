import LegalBackButton from '@/components/LegalBackButton'
import BottomNav from '@/components/BottomNav'

export default function TermsPage() {
  return (
    <div className='min-h-screen bg-[#111111] pb-28'>
      <div className='px-5 pt-14 pb-10 max-w-xl mx-auto'>
        <LegalBackButton />

        <h1 className='text-white font-black text-3xl mb-1'>Terms of Service</h1>
        <p className='text-gray-500 text-sm mb-8'>Last updated: July 1, 2026</p>

        <div className='flex flex-col gap-6 text-gray-400 text-base leading-relaxed'>
          <p>Welcome to TeaCat. By using our platform, you agree to these Terms of Service. Please read them carefully.</p>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>1. What TeaCat Is</h2>
            <p>TeaCat is a nightlife event discovery and ticketing platform based in New York City. We connect event hosts with attendees. TeaCat is not an event organizer — we are a technology platform that facilitates ticket sales between hosts and buyers.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>2. Accounts</h2>
            <p>You must provide a valid phone number to create an account. You are responsible for all activity that occurs under your account. You must be 18 or older to use TeaCat.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>3. Tickets and QR Codes</h2>
            <p>Each ticket purchase generates a unique QR code sent to your email. QR codes are single-use and non-transferable. TeaCat is not responsible for lost, stolen, or screenshot-shared QR codes used fraudulently.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>4. Fees</h2>
            <p>TeaCat charges a flat $2 buyer fee per ticket at checkout. This fee is non-refundable. Hosts keep 100% of their base ticket revenue. TeaCat does not take a percentage of ticket sales.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>5. Host Responsibilities</h2>
            <p>Hosts are responsible for the accuracy of their event listings including date, time, location, and capacity. Hosts who cancel events are responsible for issuing refunds to buyers via the TeaCat platform.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>6. Prohibited Conduct</h2>
            <p>You may not use TeaCat to list or purchase tickets for illegal events, resell tickets above face value, create fake events or accounts, or engage in any fraudulent activity. Violations may result in account termination and referral to law enforcement.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>7. Limitation of Liability</h2>
            <p>TeaCat is a platform — we are not liable for the conduct of hosts or attendees, the quality or safety of events, or any damages arising from your use of the platform. Your use of TeaCat is at your own risk.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>8. Changes to These Terms</h2>
            <p>We may update these Terms at any time. Continued use of TeaCat after changes are posted constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>9. Contact</h2>
            <p>For questions about these Terms, contact us at <a href='mailto:teacatnyc@gmail.com' className='text-[#7B2EFF]'>teacatnyc@gmail.com</a>.</p>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
