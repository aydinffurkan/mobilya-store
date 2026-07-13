import { Star } from 'lucide-react'

const REVIEWS = [
  {
    name: 'Ayşe K.',
    time: '1 ay önce',
    rating: 5,
    text: 'Siparişim çok hızlı geldi, montaj ekibi harika iş çıkardı. Koltuk takımı beklentimin çok üzerinde, kumaş kalitesi mükemmel.',
  },
  {
    name: 'Mehmet Y.',
    time: '2 hafta önce',
    rating: 5,
    text: 'Yatak odası takımını aldım, renk ve kalite fotoğraftaki ile birebir. Fiyat/performans açısından en iyi seçimdi.',
  },
  {
    name: 'Selin Ö.',
    time: '3 hafta önce',
    rating: 5,
    text: 'Evimdeki en kaliteli eşya artık direkt olarak bu yatak odası takımı diyebilirim. Herkese tavsiye ediyorum!',
  },
  {
    name: 'Burak T.',
    time: '5 gün önce',
    rating: 5,
    text: 'Müşteri hizmetleri inanılmaz ilgiliydi. Ürün tam istediğim gibi geldi, hiçbir sorun yaşamadım.',
  },
  {
    name: 'Fatma D.',
    time: '1 hafta önce',
    rating: 5,
    text: 'Yemek odası takımım çok şık oldu. Misafirlerim her gelişinde tablo gibi diye bahsediyor. Teşekkürler!',
  },
  {
    name: 'Can A.',
    time: '2 ay önce',
    rating: 5,
    text: 'Parasını sonuna kadar hak eden bir malzeme kalitesine sahip. İkinci alışverişimi de buradan yapacağım.',
  },
  {
    name: 'Deniz M.',
    time: '3 gün önce',
    rating: 5,
    text: 'Teslimat süresi inanılmaz kısaydı. Montaj ekibi çok titiz çalıştı, evde hiçbir iz bırakmadan kurulumu tamamladılar.',
  },
  {
    name: 'Zeynep B.',
    time: '1 ay önce',
    rating: 5,
    text: 'Her parçası farklı bir uyum ve kalite. Düşünmeyin derim, gözleriniz kapalı sipariş verebilirsiniz.',
  },
  {
    name: 'Hakan S.',
    time: '5 ay önce',
    rating: 5,
    text: 'Gerçekten HARİKA! Aradığım şeyi net olarak buldum diyebilirim. Koltuk modeli tam beklediğim gibi.',
  },
  {
    name: 'Esra G.',
    time: '2 ay önce',
    rating: 5,
    text: 'Çocuk odası için baktığım her yeri gezdim, en iyi fiyat ve kaliteyi burada buldum. Kesinlikle tavsiye.',
  },
]

function ReviewCard({ name, time, rating, text }: typeof REVIEWS[0]) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl p-5 border border-[#f0ebe4] shadow-sm flex flex-col gap-3 mx-3">
      {/* Üst — isim + süre */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-[#222]">{name}</p>
        <span className="text-[11px] text-[#aaa] whitespace-nowrap flex items-center gap-1 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          {time}
        </span>
      </div>

      {/* Yıldızlar */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? 'fill-[#f5a623] text-[#f5a623]' : 'fill-none text-[#ddd]'}
          />
        ))}
      </div>

      {/* Yorum */}
      <p className="text-[13px] text-[#555] leading-relaxed line-clamp-3">{text}</p>
    </div>
  )
}

export default function ReviewsMarquee() {
  // Kartları iki kez tekrarlıyoruz — seamless loop için
  const doubled = [...REVIEWS, ...REVIEWS]

  return (
    <section className="w-full bg-white py-10 overflow-hidden">
      <div className="flex w-max animate-marquee">
        {doubled.map((r, i) => (
          <ReviewCard key={i} {...r} />
        ))}
      </div>
    </section>
  )
}
