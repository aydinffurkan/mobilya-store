import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 mt-auto">
      {/* Services strip */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🚚', title: 'Ücretsiz Nakliye', desc: 'Tüm Türkiye' },
            { icon: '🔧', title: 'Ücretsiz Kurulum', desc: 'Tüm ürünlerde' },
            { icon: '🛡️', title: '2 Yıl Garanti', desc: 'Tüm mobilyalarda' },
            { icon: '🔒', title: 'Güvenli Ödeme', desc: '256-bit SSL' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <span className="text-xl font-bold text-[#c9a84c]">MOBİLYA<span className="text-white">STORE</span></span>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            Ulaşılabilir lüks anlayışıyla tasarlanmış özel mobilya koleksiyonları. Evinize değer katıyoruz.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="text-gray-400 hover:text-[#c9a84c] transition-colors text-sm font-medium">Facebook</a>
            <a href="#" className="text-gray-400 hover:text-[#c9a84c] transition-colors text-sm font-medium">Instagram</a>
            <a href="#" className="text-gray-400 hover:text-[#c9a84c] transition-colors text-sm font-medium">YouTube</a>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-semibold mb-4">Kategoriler</h3>
          <ul className="space-y-2 text-sm">
            {[
              ['Yatak Odası', 'yatak-odasi'],
              ['Yemek Odası', 'yemek-odasi'],
              ['Koltuk & Oturma', 'koltuk-oturma'],
              ['Genç Odası', 'genc-odasi'],
              ['TV Ünitesi', 'tv-unitesi'],
              ['Bahçe Mobilyası', 'bahce-mobilyasi'],
            ].map(([name, slug]) => (
              <li key={slug}>
                <Link href={`/kategori/${slug}`} className="hover:text-[#c9a84c] transition-colors">
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer service */}
        <div>
          <h3 className="text-white font-semibold mb-4">Müşteri Hizmetleri</h3>
          <ul className="space-y-2 text-sm">
            {[
              ['Ödeme Seçenekleri', '/odeme-secenekleri'],
              ['Garanti Koşulları', '/garanti'],
              ['İade & Değişim', '/iade'],
              ['Kargo Takibi', '/kargo'],
              ['Sıkça Sorulan Sorular', '/sss'],
              ['İletişim', '/iletisim'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-[#c9a84c] transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-4">İletişim</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone size={15} className="mt-0.5 text-[#c9a84c] flex-shrink-0" />
              <div>
                <p>444 21 05</p>
                <p className="text-gray-400">Haftaiçi 09:00–18:00</p>
              </div>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-[#c9a84c] flex-shrink-0" />
              <span>info@mobilyastore.com</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 text-[#c9a84c] flex-shrink-0" />
              <span>İstanbul, Türkiye</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© 2025 MobilyaStore. Tüm hakları saklıdır.</span>
          <div className="flex gap-4">
            <Link href="/gizlilik" className="hover:text-gray-300">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="hover:text-gray-300">Kullanım Koşulları</Link>
            <Link href="/kvkk" className="hover:text-gray-300">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
