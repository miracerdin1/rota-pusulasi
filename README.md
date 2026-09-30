# Yol Haritası

Kuzey Marmara, Avrasya Tüneli, Osmangazi gibi pahalı yolları tek tek kapatıp rotayı onlarsız hesaplar, sonra aynı rotayı **Google Maps** ya da **Yandex Navigasyon**'da sürebilmen için otoyolun tam üstüne ara duraklar koyan bir link üretir.

## Nasıl çalışır

1. **Yol verisi:** Hazır yolların (Kuzey Marmara, Avrasya, Osmangazi, 1915 Çanakkale) geometrisi, kavşakları ve Marmara otoyol ağı Netlify derlemesinde `npm run prefetch` ile OpenStreetMap'ten (Overpass) önceden indirilip siteye gömülür (`data/prebuilt.json`, haftada bir tazelenir). Elle eklenen yollar tarayıcıda canlı indirilir ve 30 gün saklanır. Yol, kavşak aralarına bölünür ve her aralığa tek bir küçük "kesim" konur (Kuzey Marmara için ~135 nokta). Köprü/viyadük parçaları kesilmez; altından geçen yollar yanlışlıkla engellenmesin diye.
2. **Rota:** Önce normal rota alınır. Kapalı yolların çevresine giren kısım, OpenRouteService'te kesimler yasaklanarak yeniden hesaplanır. ORS yasaklı isteklerde rotayı ~150 km ile sınırladığı için bu kısım, otoyol üstündeki ara noktalarla ≤90 km'lik parçalara bölünür.
3. **Google Maps durakları:** Google belirli bir yolu yasaklamaya izin vermediği için rota duraklarla sabitlenir:
   - _Kavşak kilidi:_ Rota kapalı yola 3 km'den fazla yaklaştığı her yerin hemen sonrasına bir durak (Google orada kapalı yola sapamasın).
   - _Dolgu:_ Kapalı yola paralel uzun kesimlerde ~30 km'de bir, kapalı yola en uzak noktaya durak.
   - Her durak için yakında yan yol/servis yolu olmayan otoyol noktası seçilir; yoksa Google durağı yan yola oturtup rotayı otoyoldan çıkarabilir.
   - Son olarak duraklarla yasaksız rota tekrar hesaplanır; hâlâ kapalı yola giriyorsa araya durak eklenir.
4. Google en fazla 10 nokta kabul ediyor (başlangıç + 8 durak + varış).
5. **Yandex:** Aynı duraklar Yandex Navigasyon'a (`yandexnavi://build_route_on_map`, `lat_via_N`/`lon_via_N`) ve Yandex Haritalar'a (`rtext`) koordinat olarak gönderilir. Yandex, imzasız (ticari anahtarsız) Navigasyon isteklerini yeni sürümlerde kısıtlayabiliyor; Navigasyon rotayı açmazsa "Yandex Haritalar" linki anahtarsız çalışır ve rota oradan navigasyona aktarılabilir.

26 Eylül 2026'da Hadımköy → Kargı (Çorum) için denendi: Google'ın 8 duraklı rotası 579 km / 7 sa, Kuzey Marmara'ya hiç girmiyor (Kuzey Marmara'lı rota 569 km / 6 sa 20 dk).

## Kurulum

İlk seferde ücretsiz bir **OpenRouteService** anahtarı gerekir: <https://openrouteservice.org/dev/#/signup> → giriş yap → _Tokens_ → _Create token_. Uygulamada ⚙ simgesinden yapıştır. Anahtar sadece o cihazın tarayıcısında saklanır. Ücretsiz planın günlük sınırları kişisel kullanım için fazlasıyla yeterli.

### Telefonda kullanmak (önerilen)

Site Netlify'da yayınlanır; Netlify GitHub reposuna bağlıdır ve ayarları `netlify.toml`'dan okur:

- `main` dalına her push'ta test + yol verisi tazeleme (`npm run prefetch`) + derleme çalışır ve canlı site güncellenir.
- Pull request'lerde test + derleme çalışır ve Netlify bir önizleme linki verir (yol verisi repodakinden alınır).
- Yol verisi, main'e push olmasa da haftada bir tazelenir: `.github/workflows/veri-tazele.yml` Pazartesi günleri Netlify'da yeni bir canlı derleme başlatır.

Bir kerelik kurulum:

1. Netlify'da _Project configuration → Build & deploy → Build hooks → Add build hook_ ile `main` dalı için bir hook oluştur, linkini kopyala.
2. GitHub'da _Settings → Secrets and variables → Actions_ altına `NETLIFY_BUILD_HOOK` adıyla ekle.
3. İsteğe bağlı: ORS anahtarını siteye gömmek için Netlify'da _Project configuration → Environment variables_ altına `VITE_ORS_KEY` ekle.
4. Linki telefonda aç, _Paylaş → Ana Ekrana Ekle_ ile uygulama gibi kullan.

### Bilgisayarda geliştirme

```bash
npm install
npm run dev      # http://localhost:5173 (aynı Wi-Fi'daki telefondan da açılır)
npm run build    # dist/index.html üretir
npm test         # kesim noktalarını gerçek O-7 verisiyle dener
npm run prefetch # hazır yol verisini public/data/prebuilt.json'a indirir (isteğe bağlı)
```

## Yeni yol eklemek

Listenin altındaki kutuya otoyol numarasını (`O-6`) ya da OSM'deki tam adını (`Fatih Sultan Mehmet Köprüsü`) yaz. Yol Türkiye genelinde aranır ve kapalı olarak eklenir.

## Bilinen sınırlar

- Google'ın rota tercihi trafiğe göre değişebilir. Açtığın rotanın yol tarifinde kapalı yol görünürse o bölgeye "+ Durak ekle" ile elle bir durak koy.
- Uzun ve kapalı yola paralel giden rotalarda 8 durak yetmeyebilir; uygulama bunu söyler.
- Elle eklenen yollarda ilk hesaplama Overpass'e bağlı olduğu için yavaş olabilir; hazır yollar siteyle birlikte gelir.
- Overpass sunucuları zaman zaman meşgul olur; uygulama sırayla üç sunucuyu dener.
- Adres araması Photon (komoot, OpenStreetMap) ile yapılır.

Yol verisi ve harita © OpenStreetMap katkıcıları (ODbL). Rota: OpenRouteService.
