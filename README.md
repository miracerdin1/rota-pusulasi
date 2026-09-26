# Rota Pusulası

Kuzey Marmara, Avrasya Tüneli, Osmangazi gibi pahalı yolları tek tek kapatıp rotayı onlarsız hesaplar, sonra aynı rotayı **Google Maps**'te sürebilmen için otoyolun tam üstüne ara duraklar koyan bir link üretir.

## Nasıl çalışır

1. **Yol verisi:** Kapattığın yolun geometrisi ve kavşakları OpenStreetMap'ten (Overpass) çekilir, 30 gün tarayıcıda saklanır. Yol, kavşak aralarına bölünür ve her aralığa tek bir küçük "kesim" konur (Kuzey Marmara için ~135 nokta). Köprü/viyadük parçaları kesilmez; altından geçen yollar yanlışlıkla engellenmesin diye.
2. **Rota:** Önce normal rota alınır. Kapalı yolların çevresine giren kısım, OpenRouteService'te kesimler yasaklanarak yeniden hesaplanır. ORS yasaklı isteklerde rotayı ~150 km ile sınırladığı için bu kısım, otoyol üstündeki ara noktalarla ≤90 km'lik parçalara bölünür.
3. **Google Maps durakları:** Google belirli bir yolu yasaklamaya izin vermediği için rota duraklarla sabitlenir:
   - *Kavşak kilidi:* Rota kapalı yola 3 km'den fazla yaklaştığı her yerin hemen sonrasına bir durak (Google orada kapalı yola sapamasın).
   - *Dolgu:* Kapalı yola paralel uzun kesimlerde ~30 km'de bir, kapalı yola en uzak noktaya durak.
   - Her durak için yakında yan yol/servis yolu olmayan otoyol noktası seçilir; yoksa Google durağı yan yola oturtup rotayı otoyoldan çıkarabilir.
   - Son olarak duraklarla yasaksız rota tekrar hesaplanır; hâlâ kapalı yola giriyorsa araya durak eklenir.
4. Google en fazla 10 nokta kabul ediyor (başlangıç + 8 durak + varış).

26 Eylül 2026'da Hadımköy → Kargı (Çorum) için denendi: Google'ın 8 duraklı rotası 579 km / 7 sa, Kuzey Marmara'ya hiç girmiyor (Kuzey Marmara'lı rota 569 km / 6 sa 20 dk).

## Kurulum

İlk seferde ücretsiz bir **OpenRouteService** anahtarı gerekir: <https://openrouteservice.org/dev/#/signup> → giriş yap → *Tokens* → *Create token*. Uygulamada ⚙ simgesinden yapıştır. Anahtar sadece o cihazın tarayıcısında saklanır. Ücretsiz planın günlük sınırları kişisel kullanım için fazlasıyla yeterli.

### Telefonda kullanmak (önerilen)

`dist/index.html` tek başına çalışan bir dosya. Herhangi bir statik hostinge koyman yeterli:

- **GitHub Pages:** Yeni bir repo aç, `dist/index.html` dosyasını yükle, *Settings → Pages → Deploy from branch* ile yayınla.
- **Netlify / Vercel / Cloudflare Pages:** `dist` klasörünü sürükle-bırak.

Sonra linki telefonda aç, Safari'de *Paylaş → Ana Ekrana Ekle* ile uygulama gibi kullan.

### Bilgisayarda geliştirme

```bash
npm install
npm run dev      # http://localhost:5173 (aynı Wi-Fi'daki telefondan da açılır)
npm run build    # dist/index.html üretir
npm test         # kesim noktalarını gerçek O-7 verisiyle dener
```

## Yeni yol eklemek

Listenin altındaki kutuya otoyol numarasını (`O-6`) ya da OSM'deki tam adını (`Fatih Sultan Mehmet Köprüsü`) yaz. Yol Türkiye genelinde aranır ve kapalı olarak eklenir.

## Bilinen sınırlar

- Google'ın rota tercihi trafiğe göre değişebilir. Açtığın rotanın yol tarifinde kapalı yol görünürse o bölgeye "+ Durak ekle" ile elle bir durak koy.
- Uzun ve kapalı yola paralel giden rotalarda 8 durak yetmeyebilir; uygulama bunu söyler.
- İlk hesaplamada otoyol ağı indirildiği için ~1 dakika sürebilir; sonrası önbellekten gelir.
- Overpass sunucuları zaman zaman meşgul olur; uygulama sırayla üç sunucuyu dener.
- Adres araması Photon (komoot, OpenStreetMap) ile yapılır.

Yol verisi ve harita © OpenStreetMap katkıcıları (ODbL). Rota: OpenRouteService.
