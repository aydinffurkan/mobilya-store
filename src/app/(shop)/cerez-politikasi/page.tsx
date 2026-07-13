import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Çerez Politikası | MobilyaStore',
  description: 'MobilyaStore çerez kullanım politikası ve KVKK kapsamında çerez bilgilendirmesi.',
}

export default function CerezPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <h1 className="text-3xl font-light tracking-wide text-neutral-900 mb-2">Çerez Politikası</h1>
      <p className="text-sm text-neutral-400 mb-10">Son güncelleme: Haziran 2025</p>

      <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-8 text-neutral-700">

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">1. Çerez Nedir?</h2>
          <p>
            Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza yerleştirilen küçük metin dosyalarıdır.
            Oturum yönetimi, tercihlerinizin hatırlanması ve site performansının ölçülmesi gibi amaçlarla kullanılırlar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">2. Hangi Çerezleri Kullanıyoruz?</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-neutral-200">
                  <th className="text-left py-3 pr-4 font-semibold text-neutral-600 uppercase tracking-wider">Çerez Adı</th>
                  <th className="text-left py-3 pr-4 font-semibold text-neutral-600 uppercase tracking-wider">Tür</th>
                  <th className="text-left py-3 pr-4 font-semibold text-neutral-600 uppercase tracking-wider">Amaç</th>
                  <th className="text-left py-3 font-semibold text-neutral-600 uppercase tracking-wider">Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3 pr-4 font-mono text-neutral-500">sb-*</td>
                  <td className="py-3 pr-4">Zorunlu</td>
                  <td className="py-3 pr-4">Admin oturum kimlik doğrulaması (Supabase SSR)</td>
                  <td className="py-3">Oturum</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-neutral-500">cookie_consent*</td>
                  <td className="py-3 pr-4">Zorunlu</td>
                  <td className="py-3 pr-4">Çerez kategori tercihlerinizin hatırlanması</td>
                  <td className="py-3">Kalıcı</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-neutral-500">recently_viewed</td>
                  <td className="py-3 pr-4">Zorunlu</td>
                  <td className="py-3 pr-4">Son görüntülenen ürünlerin listelenmesi (localStorage)</td>
                  <td className="py-3">Kalıcı</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-neutral-500">_ga, _ga_*</td>
                  <td className="py-3 pr-4">Analitik</td>
                  <td className="py-3 pr-4">Ziyaretçi istatistikleri (Google Analytics 4) — yalnızca onay verilirse yüklenir</td>
                  <td className="py-3">2 yıl</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-neutral-500">_fbp, _fbc</td>
                  <td className="py-3 pr-4">Pazarlama</td>
                  <td className="py-3 pr-4">Hedefli reklamlar (Facebook Pixel) — yalnızca onay verilirse yüklenir</td>
                  <td className="py-3">90 gün</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-neutral-500 text-xs">
            * <strong>recently_viewed</strong> teknik olarak çerez değil, tarayıcı yerel deposudur (localStorage). Sunucuya gönderilmez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">3. Üçüncü Taraf Çerezleri</h2>
          <p>
            MobilyaStore, aşağıdaki üçüncü taraf hizmetlerini <strong>yalnızca kullanıcı onayı verildiğinde</strong> yüklemektedir:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-600">
            <li>
              <strong>Google Analytics 4</strong> — Ziyaretçi davranışlarını anonim olarak ölçmek için kullanılır.
              IP anonimleştirme (<code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">anonymize_ip: true</code>) aktiftir.
              Google Gizlilik Politikası: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:underline">policies.google.com/privacy</a>
            </li>
            <li>
              <strong>Facebook Pixel</strong> — Reklam kampanyalarının etkinliğini ölçmek için kullanılır.
              Meta Gizlilik Politikası: <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:underline">facebook.com/privacy/policy</a>
            </li>
          </ul>
          <p className="mt-3">
            Bu hizmetlerin hiçbiri "Sadece Zorunlu" veya "Reddet" seçeneği tercih edildiğinde yüklenmez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">4. Çerezleri Nasıl Kontrol Edebilirsiniz?</h2>
          <p>
            Tarayıcınızın ayarlarından tüm çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi
            durumunda admin girişi ve bazı site işlevleri çalışmayabilir.
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-neutral-600">
            <li>Chrome: Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
            <li>Firefox: Ayarlar → Gizlilik ve Güvenlik → Çerezler ve Site Verileri</li>
            <li>Safari: Tercihler → Gizlilik → Çerezleri yönet</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">5. KVKK Kapsamında Haklarınız</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca çerez verilerinize erişim, düzeltme veya silme talebinde
            bulunabilirsiniz. Talepleriniz için{' '}
            <a href="mailto:info@mobilyastore.com" className="text-[#c9a84c] hover:underline">
              info@mobilyastore.com
            </a>{' '}
            adresine yazabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">6. Politika Değişiklikleri</h2>
          <p>
            Bu politika gerektiğinde güncellenebilir. Önemli değişiklikler site üzerinden duyurulacaktır.
            Güncel versiyonu bu sayfadan takip edebilirsiniz.
          </p>
        </section>

      </div>
    </div>
  )
}