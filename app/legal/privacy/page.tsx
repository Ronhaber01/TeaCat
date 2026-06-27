import LegalBackButton from '@/components/LegalBackButton'
import BottomNav from '@/components/BottomNav'

export default function PrivacyPage() {
  return (
    <div className='min-h-screen bg-[#111111] pb-28'>
      <div className='px-5 pt-14 pb-10 max-w-xl mx-auto'>
        <LegalBackButton />

        <h1 className='text-white font-black text-3xl mb-1'>Privacy Policy</h1>
        <p className='text-gray-500 text-sm mb-8'>Last updated: July 1, 2026</p>

        <div className='flex flex-col gap-6 text-gray-400 text-base leading-relaxed'>
          <p>TeaCat (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>1. What We Collect</h2>
            <ul className='flex flex-col gap-1 pl-4'>
              <li>Phone number (for account creation and OTP verification)</li>
              <li>Email address (for ticket delivery and account communications)</li>
              <li>Payment information (processed by Stripe — we never store card details)</li>
              <li>Event activity (events viewed, tickets purchased, events saved)</li>
              <li>Device and usage data (for app performance and analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>2. How We Use Your Data</h2>
            <ul className='flex flex-col gap-1 pl-4'>
              <li>To create and manage your account</li>
              <li>To deliver tickets and QR codes via email</li>
              <li>To send OTP verification codes via SMS</li>
              <li>To personalize your event discovery feed</li>
              <li>To send platform notifications (with your permission)</li>
              <li>To improve the TeaCat platform</li>
            </ul>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>3. Who We Share It With</h2>
            <p className='mb-2'>We do not sell your data. We share data only with the following service providers necessary to operate the platform:</p>
            <ul className='flex flex-col gap-1 pl-4'>
              <li>Stripe — payment processing</li>
              <li>Resend — transactional email delivery</li>
              <li>Supabase — secure database storage</li>
              <li>Vercel — platform hosting</li>
              <li>Twilio — SMS delivery</li>
              <li>OneSignal — push notifications</li>
            </ul>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>4. Data Storage and Security</h2>
            <p>Your data is stored securely via Supabase with row-level security enabled. All payment data is handled by Stripe and never stored on TeaCat&apos;s servers.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>5. Your Rights</h2>
            <p>You may request deletion of your account and associated data at any time by contacting us at <a href='mailto:teacatnyc@gmail.com' className='text-[#7B2EFF]'>teacatnyc@gmail.com</a>. We will process deletion requests within 30 days.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>6. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email. Continued use of TeaCat after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>7. Contact</h2>
            <p>For privacy-related questions, contact us at <a href='mailto:teacatnyc@gmail.com' className='text-[#7B2EFF]'>teacatnyc@gmail.com</a>.</p>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
