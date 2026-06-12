import { Resend } from 'resend'
import { format } from 'date-fns'

export async function sendTicketEmail({
  to,
  eventTitle,
  startsAt,
  venueName,
  neighborhood,
  ticketCode,
  tier,
  pricePaid,
  flyerUrl,
}: {
  to: string
  eventTitle: string
  startsAt: string
  venueName: string | null
  neighborhood: string | null
  ticketCode: string
  tier: string
  pricePaid: number
  flyerUrl?: string | null
}) {
  // Lazy init — do NOT instantiate at module level or Next.js build will throw
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`teacat://ticket/${ticketCode}`)}&size=280x280&margin=12&color=111111&bgcolor=ffffff`
  const eventDate = format(new Date(startsAt), "EEEE, MMMM d 'at' h:mm a")
  const priceLabel = pricePaid === 0 ? 'Free' : `$${(pricePaid / 100).toFixed(2)}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#111111;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">🍵 TeaCat</span>
        </td></tr>
        <tr><td style="background:#1A1A1A;border-radius:24px;border:1px solid #2A2A2A;padding:28px;">
          ${flyerUrl ? `<img src="${flyerUrl}" alt="${eventTitle}" width="100%" style="border-radius:16px;margin-bottom:20px;display:block;max-height:200px;object-fit:cover;" />` : ''}
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7B2EFF;">Your ticket</p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#ffffff;line-height:1.2;">${eventTitle}</h1>
          <p style="margin:0 0 4px;font-size:14px;color:#9CA3AF;">${eventDate}</p>
          ${venueName ? `<p style="margin:0;font-size:14px;color:#6B7280;">${venueName}${neighborhood ? ` · ${neighborhood}` : ''}</p>` : ''}
          <table width="100%" style="margin-top:20px;border-top:1px solid #2A2A2A;padding-top:16px;">
            <tr>
              <td style="font-size:13px;color:#6B7280;">${tier.charAt(0).toUpperCase() + tier.slice(1)} · 1 ticket</td>
              <td align="right" style="font-size:16px;font-weight:900;color:#A3FF12;">${priceLabel}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:20px;">
          <table width="100%" style="background:#1A1A1A;border-radius:24px;border:1px solid #2A2A2A;padding:28px;" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <p style="margin:0 0 20px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B7280;">Show this at the door</p>
              <div style="background:#ffffff;border-radius:16px;padding:12px;display:inline-block;">
                <img src="${qrUrl}" width="200" height="200" alt="QR Code" style="display:block;" />
              </div>
              <p style="margin:20px 0 4px;font-size:20px;font-weight:900;letter-spacing:4px;color:#7B2EFF;">${ticketCode.toUpperCase()}</p>
              <p style="margin:0;font-size:12px;color:#4B5563;">One-time use · Non-transferable</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#374151;">Questions? Email <a href="mailto:hello@teacat.app" style="color:#7B2EFF;text-decoration:none;">hello@teacat.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#1F2937;">© TeaCat · NYC Nightlife</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

  await resend.emails.send({
    from: 'TeaCat <tickets@teacat.app>',
    to,
    subject: `Your ticket for ${eventTitle} 🎟️`,
    html,
  })
}
