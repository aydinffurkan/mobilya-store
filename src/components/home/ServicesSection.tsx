const services = [
  {
    icon: '🚚',
    title: 'Ücretsiz Nakliye',
    desc: 'Tüm Türkiye\'ye ücretsiz teslimat. Kapınıza kadar getiriyoruz.',
  },
  {
    icon: '🔧',
    title: 'Ücretsiz Kurulum',
    desc: 'Uzman ekibimiz mobilyanızı evinize kurar. Ek ücret yok.',
  },
  {
    icon: '🛡️',
    title: '2 Yıl Garanti',
    desc: 'Tüm ürünlerimiz 2 yıl fabrika garantisi ile teslim edilir.',
  },
  {
    icon: '↩️',
    title: '30 Gün İade',
    desc: 'Memnun kalmazsanız 30 gün içinde ücretsiz iade edebilirsiniz.',
  },
  {
    icon: '📦',
    title: 'Ücretsiz Emanet',
    desc: 'Ürününüzü 4 ay boyunca depomuzda ücretsiz bekletebilirsiniz.',
  },
  {
    icon: '🎨',
    title: 'Mimari Tasarım',
    desc: 'İç mekan tasarım hizmetimizden ücretsiz yararlanabilirsiniz.',
  },
]

export default function ServicesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Neden MobilyaStore?</h2>
        <p className="text-muted-foreground mt-2">Size en iyi alışveriş deneyimini sunmak için buradayız</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {services.map((s) => (
          <div key={s.title} className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl hover:bg-secondary transition-colors">
            <span className="text-4xl">{s.icon}</span>
            <div>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
