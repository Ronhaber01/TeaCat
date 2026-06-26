export default function TeaCatLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cat head */}
      <circle cx="50" cy="46" r="26" stroke="#7B2EFF" strokeWidth="1.5"/>

      {/* Left ear */}
      <path d="M26 30 L21 10 L40 22" stroke="#7B2EFF" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* Right ear */}
      <path d="M74 30 L79 10 L60 22" stroke="#7B2EFF" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* Left eye */}
      <circle cx="40" cy="43" r="2.5" fill="#7B2EFF"/>

      {/* Right eye */}
      <circle cx="60" cy="43" r="2.5" fill="#7B2EFF"/>

      {/* Teacup body */}
      <path d="M33 65 L37 80 L67 80 L71 65 Z" stroke="#A3FF12" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* Cup rim */}
      <line x1="33" y1="65" x2="71" y2="65" stroke="#A3FF12" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Handle */}
      <path d="M71 68 C81 68 81 76 71 76" stroke="#A3FF12" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

      {/* Steam curl 1 */}
      <path d="M44 60 C44 56 48 56 48 52 C48 48 44 48 44 44" stroke="#A3FF12" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

      {/* Steam curl 2 */}
      <path d="M52 60 C52 57 55 57 55 54 C55 51 52 51 52 48" stroke="#A3FF12" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
