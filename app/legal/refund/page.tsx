import LegalBackButton from '@/components/LegalBackButton'
import BottomNav from '@/components/BottomNav'

export default function RefundPage() {
  return (
    <div className='min-h-screen bg-[#111111] pb-28'>
      <div className='px-5 pt-14 pb-10 max-w-xl mx-auto'>
        <LegalBackButton />

        <h1 className='text-white font-black text-3xl mb-1'>Refund Policy</h1>
        <p className='text-gray-500 text-sm mb-8'>Last updated: July 1, 2026</p>

        <div className='flex flex-col gap-6 text-gray-400 text-base leading-relaxed'>
          <p>All ticket sales on TeaCat are final. By completing a purchase, you agree to this policy.</p>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>TeaCat Buyer Fee</h2>
            <p>The $2 TeaCat buyer fee is non-refundable under all circumstances. This fee covers platform infrastructure and is collected at time of purchase.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>Event Cancellations by Host</h2>
            <p>If a host cancels an event, buyers are eligible for a refund of the base ticket price only (the amount paid minus the $2 TeaCat fee). Refunds are issued to the original payment method via Stripe and may take 5–10 business days to appear.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>No Other Refunds</h2>
            <p className='mb-3'>Refunds are not issued for any reason other than host-initiated event cancellation. This includes but is not limited to:</p>
            <ul className='flex flex-col gap-1 pl-4'>
              <li>Change of plans or personal schedule conflicts</li>
              <li>Weather conditions</li>
              <li>Dissatisfaction with the event</li>
              <li>Reduced attendance or atmosphere</li>
              <li>Any circumstance outside of a formal host cancellation</li>
            </ul>
            <p className='mt-3'>As long as an event proceeds as listed and is safe to attend, no refund will be issued regardless of external conditions.</p>
          </section>

          <section>
            <h2 className='text-white font-bold text-base mb-2'>How to Request a Refund</h2>
            <p>If a host has cancelled an event and you have not received an automatic refund within 10 business days, contact us at <a href='mailto:teacatnyc@gmail.com' className='text-[#7B2EFF]'>teacatnyc@gmail.com</a> with your order details.</p>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
