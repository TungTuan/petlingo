# Build app di động (iOS + Android) để test trên điện thoại thật

Hướng dẫn này giả định bạn đang ở macOS, đã có repo này, và backend chạy
được bằng `cd backend && npm run dev` (xem `backend/README.md` nếu chưa).

## Đã làm sẵn (không cần làm lại)

- Đã cài `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- Đã chạy `npx cap init` — `capacitor.config.ts` (appId hiện tại `com.tungnguyentuan.petlingo` — đổi từ `com.petlingo.app` ban đầu vì bị trùng với người khác đã đăng ký trên Apple, tên hiển thị "Petlingo")
- Đã khoá hướng màn hình về landscape-only (`ios/App/App/Info.plist`'s `UISupportedInterfaceOrientations` + `android/.../AndroidManifest.xml`'s `android:screenOrientation="sensorLandscape"`) — app không tự xoay dọc nữa
- Khung thiết kế (`index.css`'s `.device-frame`) đã đổi 2 lần từ bản gốc 1194×834: nới tỉ lệ lên ~2.01:1 (giảm viền trống 2 bên trên điện thoại) rồi thu giá trị tuyệt đối xuống **1260×626** (giữ nguyên tỉ lệ đó, chỉ để chữ/item to hơn ~33%) — xem mục "Vì sao không full màn hình thật, và về việc chỉnh cỡ chữ/item" bên dưới để hiểu 2 đòn bẩy này khác nhau thế nào. Phần viền trống còn lại đã đổi từ màu trơn sang gradient màu thương hiệu (`ScreenFrame.tsx`) thay vì để trống trơn; **đã kiểm chứng bằng thực nghiệm là KHÔNG nên "phóng to lấp đầy màn hình"** vì sẽ cắt mất toàn bộ thanh điều hướng dưới cùng + thanh trạng thái trên cùng
- Đã tạo `ios/` và `android/` (2 project native thật, đã có trong repo)
- Đã cài CocoaPods qua Homebrew (`brew install cocoapods`) và chạy `pod install` cho iOS
- **Xcode 26.6 đã được cài** (`/Applications/Xcode.app`, đủ platform iPhoneOS/iPhoneSimulator) — chỉ còn thiếu 1 bước bạn cần tự làm (cần mật khẩu sudo, tôi không chạy thay được), xem Bước 1
- Đã sinh icon + splash screen thật cho cả 2 nền tảng (từ logo có sẵn ở `public/favicon.svg`, nguồn ảnh gốc ở `assets/`) — không phải icon mặc định của Capacitor nữa
- Bản Debug cho phép HTTP LAN qua manifest riêng của Android và
  `Info-Debug.plist` của iOS; bản Release đã chặn cleartext/ATS exception.
  Xem mục "Trước khi release thật" cuối file
- Đã cài `ngrok` qua Homebrew — dùng được nếu bạn muốn expose backend qua HTTPS công khai thay vì IP LAN, xem Bước 0
- Backend's CORS (`backend/src/app.ts`) đã tự động cho phép mọi origin `https://*.ngrok-free.app`/`*.ngrok.io`/`*.ngrok.app` (chỉ ngoài production) — **không cần sửa `CORS_ORIGIN` tay mỗi lần ngrok đổi URL**
- Đã thêm script `npm run build:mobile` (build web + trỏ `VITE_API_URL` sang file `.env.mobile`) và `npm run cap:sync` (build:mobile rồi đồng bộ sang cả 2 project native)
- `ScreenFrame.tsx` đã tự ẩn khung bezel "máy tính bảng giả" khi chạy native thật (`Capacitor.isNativePlatform()`) — trên điện thoại thật app sẽ full-screen, không có khung viền tối bao quanh nữa

**Về câu hỏi "cần build ra file":** không cần — để chạy trên chính iPhone của
bạn qua cáp (Bước 3), Xcode build **và cài thẳng lên máy** trong 1 lần bấm
Run, không có file `.ipa` riêng nào để bạn tự cầm đi cài. Chỉ khi nào cần
**gửi file cho người khác cài** (không cắm cáp được) hay lên **TestFlight**
thì mới cần "build ra file" thật sự (archive/export) — xem Bước 4.

---

## Bước 0 — Cho điện thoại "thấy" được backend

Điện thoại không gọi được `localhost` của Mac. Chọn 1 trong 2 cách:

### Cách A — IP LAN (đơn giản, chỉ dùng được cùng 1 wifi)

1. Lấy IP LAN của Mac:
   ```bash
   ipconfig getifaddr en0
   ```
   Ví dụ ra `192.168.1.2`. Nếu đổi wifi/router, IP này có thể đổi — chạy lại
   lệnh trên và lặp lại bước 2 mỗi lần đổi.

2. Sửa `frontend/.env.mobile` (đã tạo sẵn, chỉ cần đổi số IP):
   ```
   VITE_API_URL=http://192.168.1.2:4000
   ```

3. `backend/.env`'s `CORS_ORIGIN` đã có sẵn entry LAN — chỉ cần sửa lại đúng
   IP hiện tại của bạn trong đó nếu khác:
   ```
   CORS_ORIGIN="http://localhost:5173,capacitor://localhost,http://localhost,http://192.168.1.2:5173"
   ```
   **Khởi động lại `npm run dev` ở `backend/`** sau khi sửa `.env` — process
   đang chạy không tự đọc lại file này.

### Cách B — ngrok (dùng được ở bất kỳ mạng nào, tự có HTTPS)

Không cần cùng wifi, không cần lo IP đổi, và HTTPS thật nên không cần dựa vào
`NSAllowsArbitraryLoads`/cleartext nữa. Đánh đổi: URL đổi mỗi lần chạy lại
`ngrok` (trừ khi trả phí để giữ cố định 1 domain).

1. Đăng ký tài khoản free tại https://dashboard.ngrok.com/signup, lấy
   authtoken ở https://dashboard.ngrok.com/get-started/your-authtoken.
2. Chạy 1 lần (lưu token vào máy):
   ```bash
   ngrok config add-authtoken <TOKEN_CỦA_BẠN>
   ```
3. Mỗi lần muốn test, mở 1 tab Terminal riêng, để chạy song song với backend:
   ```bash
   ngrok http 4000
   ```
   Ngrok in ra 1 dòng dạng `Forwarding  https://abcd1234.ngrok-free.app -> http://localhost:4000`.
4. Copy đúng URL đó vào `frontend/.env.mobile`:
   ```
   VITE_API_URL=https://abcd1234.ngrok-free.app
   ```
   **Không cần sửa `CORS_ORIGIN`** — backend đã tự nhận diện origin ngrok (xem mục "Đã làm sẵn" ở trên).
5. Đóng tab ngrok = tunnel mất, phải lấy URL mới và sửa lại `.env.mobile` — nếu
   thấy phiền, quay lại Cách A cho việc test hàng ngày, dùng ngrok khi cần test
   ngoài mạng nhà (quán cafe, 4G...) hoặc gửi cho người khác test cùng.

### Chung cho cả 2 cách

Đảm bảo backend đang lắng nghe mọi network interface (đã đúng sẵn —
`backend/.env` có `HOST=0.0.0.0`), và (nếu dùng Cách A) tường lửa macOS không
chặn cổng 4000 (System Settings → Network → Firewall — nếu bật, cho phép Node
nhận kết nối đến).

**Test nhanh không cần build native:** trong lúc chờ hoàn tất Bước 1, mở
`http://192.168.1.2:5173` (Cách A) hoặc chạy thêm `ngrok http 5173` ở 1 tab
khác rồi mở URL nó in ra (Cách B) bằng trình duyệt trên điện thoại để xem
giao diện — không phải app thật, không có
icon riêng, nhưng test UI/logic được ngay.

---

## Bước 1 — Cài công cụ cần thiết

### iOS — Xcode đã cài, chỉ còn 1 bước cần bạn tự làm

**Xcode 26.6 đã có sẵn** ở `/Applications/Xcode.app` (đủ platform iOS) — chỉ
còn thiếu đồng ý license, việc này cần mật khẩu sudo nên phải tự bạn chạy
(tôi không nhập mật khẩu thay được). Mở Terminal, chạy:
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```
Chạy xong, `npx cap sync ios` (hoặc `npm run cap:sync`) sẽ hết báo lỗi
`xcodebuild requires Xcode`. CocoaPods đã cài sẵn (`pod --version` để kiểm tra).

### Android — cần Android Studio (khuyên dùng) hoặc JDK + Android SDK riêng lẻ

Cách dễ nhất: cài **Android Studio** (https://developer.android.com/studio) —
nó tự kèm JDK + Android SDK, có nút "Run" bấm là cài thẳng lên điện thoại nối
qua cáp, không cần biết Gradle. Mở Android Studio 1 lần đầu để nó tải SDK mặc định.

---

## Bước 2 — Android: chạy trên điện thoại thật

1. Trên điện thoại Android: **Settings → About phone**, bấm liên tục vào "Số
   bản dựng" (Build number) 7 lần để bật **Developer options**, rồi vào
   **Settings → Developer options**, bật **USB debugging**.
2. Nối điện thoại vào Mac bằng cáp USB, chọn "Cho phép gỡ lỗi USB" trên điện thoại khi được hỏi.
3. Từ `frontend/`:
   ```bash
   npm run cap:sync          # build web (dùng .env.mobile) + đồng bộ sang android/
   npx cap open android      # mở project trong Android Studio
   ```
4. Trong Android Studio: đợi Gradle sync xong (lần đầu khá lâu), chọn điện
   thoại của bạn ở dropdown thiết bị trên thanh công cụ, bấm nút ▶ **Run**.
   App cài thẳng lên điện thoại và tự mở.

**Không muốn mở Android Studio, chỉ cần file APK để cài tay/gửi người khác test:**
```bash
cd android && ./gradlew assembleDebug
# File ra ở: android/app/build/outputs/apk/debug/app-debug.apk
```
Copy file này qua điện thoại (AirDrop/USB/Drive) rồi bấm mở để cài — điện
thoại sẽ hỏi "Cài nguồn không xác định", đồng ý là được, không cần tài khoản
Google Play gì cả.

Mỗi lần sửa code frontend: chạy lại `npm run cap:sync` rồi Run/build lại.

---

## Bước 3 — iOS: chạy trên điện thoại thật (chưa cần trả phí)

Bạn chọn dùng Apple ID thường (miễn phí) — cài thẳng lên máy mình qua Xcode,
**không qua TestFlight**. App sẽ tự hết hạn sau **7 ngày** (giới hạn của Apple
cho tài khoản free) rồi cần cắm cáp cài lại — bù lại không tốn phí, làm ngay được.

0. Trên iPhone: **Settings → Privacy & Security** → kéo xuống cuối → bật
   **Developer Mode** → máy sẽ hỏi khởi động lại → mở khoá máy sau khi khởi
   động lại → xác nhận **Turn On** khi được hỏi. Bắt buộc từ iOS 16 trở lên,
   không bật thì Xcode không cài được gì lên máy.
1. Từ `frontend/`:
   ```bash
   npm run cap:sync      # build web (dùng .env.mobile) + đồng bộ sang ios/
   npx cap open ios      # mở project trong Xcode
   ```
2. Trong Xcode, chọn target **App** ở sidebar trái (bấm vào dòng **App** trên
   cùng có icon xanh dương, không phải icon folder vàng bên dưới nó) → tab
   **Signing & Capabilities**:
   - **Team**: bấm dropdown → **Add an Account…** → đăng nhập bằng Apple ID
     thường (không cần trả phí) → quay lại dropdown Team, chọn tên bạn
     ("Tên bạn (Personal Team)").
   - Tick **Automatically manage signing**.
   - Nếu Xcode báo **"Failed Registering Bundle Identifier"** (`com.petlingo.app`
     đã có người khác đăng ký trước — Bundle ID phải duy nhất toàn cầu trên
     Apple) — sửa ô **Bundle Identifier** thành thứ khác duy nhất (project này
     hiện đang dùng `com.tungnguyentuan.petlingo`, đổi luôn `appId` tương ứng
     trong `capacitor.config.ts` cho khớp), bấm **Try Again**.
3. Nối iPhone vào Mac bằng cáp, mở khoá máy, chọn "Trust this computer" nếu được hỏi.
4. Chọn iPhone của bạn ở dropdown thiết bị trên thanh công cụ Xcode (thay vì
   simulator), bấm nút ▶ **Run**.
5. Lần đầu chạy, iPhone sẽ báo "Untrusted Developer" khi mở app — vào
   **Settings → General → VPN & Device Management** trên iPhone, chọn tên
   Apple ID của bạn, bấm **Trust**.
6. `codesign` có thể hỏi mật khẩu Keychain lúc build — đó là **mật khẩu đăng
   nhập macOS** của bạn (không phải Apple ID) — bấm **Always Allow** để khỏi bị hỏi lại.

Mỗi lần sửa code frontend: chạy lại `npm run cap:sync` rồi bấm Run lại trong Xcode.

**Không muốn mở Xcode, build/cài thẳng từ terminal:** (cách tôi đã dùng để cài
lên máy bạn)
```bash
DEVICE_ID=$(xcrun devicectl list devices | grep iPhone | awk '{print $3}')
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug \
  -destination "id=$DEVICE_ID" -allowProvisioningUpdates build
APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -path '*Debug-iphoneos/App.app' -maxdepth 6 2>/dev/null | head -1)"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"
xcrun devicectl device process launch --device "$DEVICE_ID" com.tungnguyentuan.petlingo
```

---

## Bước 4 — Nâng lên TestFlight thật (khi có tài khoản Apple Developer trả phí)

Khi bạn đăng ký xong [developer.apple.com/programs](https://developer.apple.com/programs/)
($99/năm, duyệt có thể mất 1-2 ngày), làm theo các bước sau — không cần đổi
gì trong code, chỉ khác ở khâu build/upload:

1. **App Store Connect** (https://appstoreconnect.apple.com) → **My Apps** →
   dấu **+** → **New App**. Điền tên "Petlingo", chọn đúng Bundle ID
   `com.tungnguyentuan.petlingo` (Xcode tự đồng bộ danh sách này nếu team đã
   chọn đúng — đổi lại nếu bạn đổi `appId` khác trước khi lên bản chính thức),
   ngôn ngữ chính, category.
2. Trong Xcode, đổi **Team** ở Signing & Capabilities từ "Personal Team" sang
   team trả phí thật của bạn.
3. Trên thanh công cụ Xcode, chọn đích build là **Any iOS Device (arm64)**
   (không phải iPhone cụ thể/simulator).
4. Menu **Product → Archive**. Đợi build xong, cửa sổ **Organizer** hiện ra.
5. Chọn bản archive vừa tạo → **Distribute App** → **App Store Connect** →
   **Upload** → để mặc định các bước tiếp theo → **Upload**.
6. Chờ vài phút tới ~1 giờ để Apple xử lý xong build (có email báo). Vào lại
   App Store Connect → **TestFlight** tab → chọn build vừa lên.
7. Điền **Test Information** (mô tả ngắn cho tester, bắt buộc trước khi mời
   người ngoài team) — nếu chỉ mời chính bạn/gia đình test nội bộ
   ("Internal Testing", tối đa 100 người, phải là thành viên trong team Apple
   Developer của bạn) thì **không cần** Apple duyệt, mời là dùng được ngay.
   Nếu muốn mời người ngoài team ("External Testing") thì cần Apple duyệt
   bản build trước (thường vài giờ tới 1-2 ngày).
8. Mời tester bằng email trong tab TestFlight — họ cài app **TestFlight**
   (app riêng của Apple, trên App Store) rồi nhận lời mời qua email/link để cài
   Petlingo qua đó, tự cập nhật khi bạn upload build mới, không tự hết hạn
   như cách cài trực tiếp ở Bước 3.

Mỗi lần muốn ra bản TestFlight mới: bump `CFBundleShortVersionString`/
`CFBundleVersion` trong Xcode (General tab), lặp lại từ bước 4.

---

## Bước 5 (tuỳ chọn) — Android lên Google Play Internal Testing

Tương đương TestFlight bên Android, cần tài khoản **Google Play Console**
($25 trả 1 lần, không phải theo năm). Không bắt buộc — sideload APK ở Bước 2
đã đủ để tự test hoặc gửi trực tiếp cho vài người quen cài thử.

Nếu muốn làm: `./gradlew bundleRelease` ra file `.aab` (cần tạo keystore ký
release trước — Android Studio có wizard **Build → Generate Signed Bundle**),
rồi tải `.aab` lên Google Play Console → Testing → Internal testing → tạo
release → mời tester bằng email, không cần Google duyệt cho internal testing.

---

## Vì sao không "full màn hình thật" 100%, và về việc chỉnh cỡ chữ/item

App được thiết kế trên 1 khung cố định — ban đầu **1194×834** (tỉ lệ ~1.43:1,
đúng bản mockup gốc), giờ là **1260×626** (tỉ lệ ~2.01:1) sau 2 lần chỉnh, xem
`index.css`'s `.device-frame`. Có **2 đòn bẩy độc lập** đáng phân biệt:

1. **Tỉ lệ khung (width÷height)** — quyết định viền trống 2 bên nhiều/ít.
   Màn hình điện thoại thật khi xoay ngang rộng hơn nhiều (iPhone 14 Pro Max
   ~932×430, tỉ lệ ~2.17:1) so với khung gốc 1.43:1, nên co giãn khung gốc để
   vừa **chiều cao** màn hình luôn thừa khoảng trống 2 bên ("pillarbox"). Đã
   nới tỉ lệ khung lên ~2.01:1 (gần khớp điện thoại hiện đại hơn) để giảm viền
   trống mỗi bên từ ~158px xuống ~33px trên iPhone 14 Pro Max — không phải
   100% (không có tỉ lệ cố định nào vừa hết mọi điện thoại), phần còn lại đã
   đổi từ màu trơn sang gradient nhẹ theo màu thương hiệu cho đỡ trống trải
   (`ScreenFrame.tsx`).

   **Đã thử nghiệm thực tế phương án "phóng to lấp đầy màn hình"** (scale theo
   chiều rộng thay vì chiều cao) và xác nhận: cách đó cắt mất hoàn toàn thanh
   điều hướng dưới cùng (Home/World/Pets/Bag/More) và cả thanh trạng thái trên
   cùng (avatar/coin/tim) — không dùng được. Vì vậy KHÔNG áp dụng cách này.

2. **Giá trị tuyệt đối của khung (cùng tỉ lệ)** — quyết định chữ/item to hay
   nhỏ. Cùng 1 tỉ lệ, khung tham chiếu càng NHỎ thì mỗi giá trị px trong code
   (font-size, padding, kích thước icon...) càng chiếm phần trăm lớn hơn của
   khung, nên render ra TO hơn trên màn hình thật — dù khung ngoài vẫn chiếm
   đúng diện tích màn hình y hệt (không ảnh hưởng gì tới viền trống ở mục 1).
   Ban đầu nới khung lên 1680×834 (ưu tiên giảm viền trống trước), sau đó thu
   lại còn 1260×626 (giữ nguyên tỉ lệ ~2.01) vì chữ/item quá nhỏ khi test thật
   — chữ/nút to hơn ~33% mà không cần sửa font-size nào trong code. **Đánh
   đổi:** khung nhỏ hơn = ít "chỗ" hơn cho nội dung cố định kích thước (sidebar
   `w-[NNpx]`...) trước khi tràn — đã phát hiện & sửa 1 trường hợp thật
   (`Premium.tsx`'s nút mua bị đẩy khuất màn hình, xem TASKS.md) khi giảm
   xuống 1260, đừng giảm thêm nhiều nữa mà không rà lại các sidebar cố định.

Cách duy nhất để thật sự lấp đầy màn hình mà không có viền trống nào (khác với
việc chỉnh 2 đòn bẩy trên, vốn không cần đổi code từng màn hình) là **thiết kế
lại layout của từng màn hình** theo tỉ lệ khung hình rộng hơn (hoặc responsive
hoàn toàn thay vì kích thước cố định theo pixel) — khối lượng công việc lớn
(rà lại ~30 màn hình), chưa làm, có thể cân nhắc sau nếu cần.

---

## Troubleshooting

- **App mở lên nhưng không load được gì / lỗi mạng:** kiểm tra lại Bước 0 —
  IP trong `.env.mobile` đúng chưa, backend đã restart sau khi sửa
  `CORS_ORIGIN` chưa, điện thoại và Mac có chắc cùng 1 wifi không (mạng
  guest/khách thường bị cô lập, 2 thiết bị không thấy nhau).
- **iOS báo lỗi CORS dù đã sửa `CORS_ORIGIN`:** origin của app iOS thật sự gửi
  lên là `capacitor://localhost` — kiểm tra đúng chính tả trong `.env`, không
  phải `https://localhost`.
- **`pod install`/`cap sync` báo lỗi liên quan `xcodebuild`:** chưa hoàn tất
  Bước 1 (cần Xcode đầy đủ, không chỉ Command Line Tools) — chạy
  `xcode-select -p` phải ra `/Applications/Xcode.app/Contents/Developer`.
- **Android Studio báo thiếu SDK/JDK khi mở project lần đầu:** để nó tự tải
  qua SDK Manager (thường có banner "Install missing SDK" ngay khi mở), đồng
  ý hết là xong, không cần tải tay.
- **Sửa code xong mà app không thấy thay đổi:** quên chạy `npm run cap:sync`
  trước khi Run lại — Capacitor chỉ đóng gói đúng lúc `dist/` được build lại
  và copy sang `ios/`/`android/`, không tự theo dõi file thay đổi như `npm run dev`.

---

## Trước khi release thật lên App Store / Google Play

Checklist riêng, khác hẳn build test — đừng release với cấu hình test hiện tại:

- [ ] Backend phải có domain thật + HTTPS (chưa có ở thời điểm viết file
      này) — không được release app trỏ vào IP LAN nhà bạn
- [x] Release iOS dùng `Info.plist` không có `NSAllowsArbitraryLoads`; riêng
      Debug dùng `Info-Debug.plist` để tiếp tục test backend LAN qua HTTP
- [x] Release Android không bật cleartext; riêng
      `android/app/src/debug/AndroidManifest.xml` bật cho debug LAN
- [x] Đã bỏ `server.cleartext` khỏi `capacitor.config.ts`
- [ ] Copy `.env.release.example` thành `.env.release`, đổi sang domain HTTPS
      thật rồi chạy `npm run cap:sync:release`. Lệnh này tự từ chối URL HTTP
      hoặc URL bị bỏ trống
- [ ] Token đăng nhập hiện lưu ở `localStorage` (`tokenStorage.ts`) — nên
      chuyển sang `@capacitor/preferences` (Keychain/Keystore thật) trước khi
      phát hành rộng rãi (không bắt buộc để test, chỉ nên làm trước khi release)
- [ ] Rà lại safe-area (tai thỏ/status bar) trên các màn thường xuyên dùng —
      class `.safe-top`/`.safe-bottom` đã có sẵn trong `index.css` nhưng chưa
      được gắn vào screen nào; khung game tự co giãn nên phần lớn
      trường hợp không cần, nhưng nên kiểm tra lại trên máy có tai thỏ
