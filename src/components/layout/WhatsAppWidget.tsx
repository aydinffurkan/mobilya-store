'use client'

interface Props {
  phone: string
  message?: string
}

export default function WhatsAppWidget({ phone, message }: Props) {
  const href =
    'https://wa.me/' +
    phone.replace(/\D/g, '') +
    (message ? '?text=' + encodeURIComponent(message) : '')

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geçin"
      className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
      style={{ backgroundColor: '#25D366' }}
    >
      {/* WhatsApp SVG */}
      <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.632 4.64 1.832 6.64L2.667 29.333l6.88-1.8A13.253 13.253 0 0 0 16.004 29.333c7.36 0 13.33-5.973 13.33-13.333 0-7.36-5.97-13.333-13.33-13.333Zm0 24c-2.12 0-4.2-.573-6.027-1.653l-.427-.253-4.08 1.067 1.093-3.973-.28-.44A10.627 10.627 0 0 1 5.333 16c0-5.88 4.787-10.667 10.667-10.667S26.667 10.12 26.667 16 21.88 26.667 16.004 26.667Zm5.853-7.987c-.32-.16-1.893-.933-2.187-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-.96 1.253-.133.213-.267.24-.587.08-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.147-.14.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.627-.52-.54-.72-.547h-.613c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.253 3.44 5.453 4.827.76.327 1.353.52 1.817.667.763.24 1.46.207 2.013.127.613-.093 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373Z"/>
      </svg>
    </a>
  )
}
