# Petlingo — Release Readiness Review

Ngày review: 2026-08-30. Dựa trên đọc toàn bộ `TASKS.md` (1600+ dòng lịch sử
làm việc), `backend/prisma/schema.prisma`, `backend/src/app.ts`, `.env`/
`.env.example` cả 2 phía, `package.json` (backend+frontend), git log/status,
và `frontend/MOBILE_BUILD.md`'s checklist.

**Kết luận ngắn gọn: CHƯA nên release rộng rãi (App Store/Google Play công
khai) ngay. Đủ chín để dùng nội bộ/gia đình/beta kín (TestFlight nội bộ,
sideload Android) nhưng còn 1 nhóm "Blocker" phải xử lý trước khi đưa cho
người dùng thật trả tiền/công khai trên store.**

---

## 🔴 Blocker — phải xử lý trước khi release công khai

1. **Không có cổng thanh toán thật.** Premium, VIP mùa (Battle Pass), và
   "Nạp lần đầu"/"Gói combo" trong Shop đều là **demo one-click activation**
   (`PATCH /auth/me/premium`, `activateVipSeason()`, `purchasePackage()`) —
   không có App Store/Google Play IAP, không có Stripe/thẻ. Nếu ý định là
   thu tiền thật, đây là việc lớn nhất còn thiếu (cần tích hợp
   StoreKit/Billing Library, xác thực receipt, gia hạn/hết hạn thật).
   Nếu ý định ban đầu chỉ là app miễn phí + có gói ảo demo, mục này không
   phải blocker — nhưng cần xác nhận rõ trước khi công bố giá.
2. **Privacy/Terms đã có nền tảng kỹ thuật, nhưng chưa hoàn tất pháp lý.** App
   đã có policy VI/EN công khai không cần đăng nhập, link từ Login/Home/
   Settings, lưu phiên bản + thời điểm phụ huynh chấp nhận và chặn tạo hồ sơ
   trẻ ở server nếu chưa chấp nhận. Trước release vẫn phải điền pháp nhân/email
   thật, legal review từng thị trường, dịch JA/KO và triển khai phương thức xác
   minh đồng ý phụ huynh phù hợp nơi pháp luật yêu cầu. Xem `LEGAL_RELEASE.md`.
3. **Google/Facebook/Apple login: code xong nhưng chưa có credentials thật,
   chưa test đầu-cuối.** `.env`/`.env` (frontend) đang để trống
   `GOOGLE_CLIENT_ID`/`FACEBOOK_APP_ID`/`APPLE_CLIENT_ID` — 3 nút này hiện
   chỉ báo "chưa cấu hình". Riêng Apple **bắt buộc dùng flow native
   (`ASAuthorizationController`)** để được App Store duyệt — bản web JS hiện
   tại sẽ không qua review nếu app có nút "Sign in with Apple". Facebook cần
   Meta duyệt app mới cho user thật ngoài danh sách test dùng được.
4. **iOS: đang chạy bằng Apple ID miễn phí, app tự hết hạn sau 7 ngày.** Cần
   tài khoản Apple Developer trả phí ($99/năm) để build bản TestFlight/App
   Store thật. Chưa làm bước này.
5. **Android: chưa từng test trên thiết bị thật.** Máy dev chưa cài Android
   Studio/SDK. Cần cài + build + cài thử lên ít nhất 1 máy Android thật
   trước khi release — hiện tại 100% verify là qua iOS + web/Playwright.
6. **Backend chưa có domain HTTPS thật, đang test qua LAN IP/ngrok.** Phần
   cấu hình trong repo đã an toàn hơn: iOS/Android Release chặn HTTP thường,
   chỉ Debug cho phép LAN; `build:release` bắt buộc `VITE_API_URL` dùng HTTPS.
   Việc còn thiếu là cấp domain + TLS thật và điền URL đó vào `.env.release`.
7. **Chưa triển khai bộ secrets production thật.** Repo đã có
   `backend/.env.production.example` và backend từ chối JWT secret mẫu/yếu
   khi `NODE_ENV=production`; trước deploy vẫn phải tạo secrets ngẫu nhiên
   thật trong secret manager của hạ tầng, không commit vào git.

## 🟠 Nên xử lý trước khi release (không chặn cứng nhưng rủi ro/uy tín thật)

- **Vật phẩm test "Đói ngay" (`test-lam-doi`, 1 coin) vẫn đang sống trong
  Shop thật** — nội dung debug lộ ra cho người dùng cuối, nên gỡ hoặc ẩn
  (`isActive: false`) trước khi release.
- **16/40 pet vẫn thiếu ảnh "sad"** (angel, aqua, berry, blaze, ember,
  frostwing, gargo, glacio, mystic, nocty, papillon, prism, sprout, stella,
  umbra, void) — pet đói của 16 loài này lặng lẽ rơi về ảnh vui bình thường,
  không lỗi nhưng thiếu nhất quán cảm xúc nếu người dùng để ý.
- **Test coverage tự động rất mỏng**: chỉ 1 file (`backend/tests/
  progress.service.test.ts`). Toàn bộ phần verify trong lịch sử `TASKS.md`
  là test tay (curl/Playwright) từng tính năng lúc code — không có safety
  net tự động để bắt regression khi sửa code sau này. Không chặn release
  đầu tiên, nhưng rủi ro tăng dần theo thời gian nếu không bổ sung.
- **Premium vẫn quảng cáo 2 quyền lợi chưa có gì backing thật**: "Báo cáo
  phụ huynh chi tiết" (`ParentArea.tsx` 100% mock, chưa có hạ tầng log nào)
  và "Tải bài học offline" (chưa làm). App đã tự gỡ 1 dòng quảng cáo sai
  tương tự ("Mở toàn bộ 6 vùng") vì lý do này — nên áp dụng cùng chuẩn cho
  2 dòng còn lại: hoặc làm thật, hoặc gỡ khỏi danh sách quyền lợi trước khi
  người dùng trả tiền cho Premium.
- **Token đăng nhập lưu ở `localStorage`** thay vì Keychain/Keystore native
  (`@capacitor/preferences`) — chấp nhận được để test, nên nâng cấp trước
  khi release rộng vì đây là nơi lưu access/refresh token.
- **Trạng thái trận Đấu trường chỉ sống trong RAM của 1 process** — riêng
  process crash/restart giữa trận sẽ mất trận đang chơi (không mất dữ liệu
  vĩnh viễn nào, chỉ mất 1 trận đang dở). Chấp nhận được ở quy mô nhỏ, cần
  Redis pub/sub nếu scale ra nhiều instance sau này.
- **Không có helmet/security-headers middleware**, `@fastify/rate-limit`
  đăng ký `global: false` (chỉ áp dụng ở route nào tự khai) — nên rà lại
  xem các route nhạy cảm (login, register, social login, admin) đều có rate
  limit áp dụng, và cân nhắc thêm header bảo mật cơ bản (CSP/HSTS ở tầng
  reverse proxy khi có domain thật).

## 🟡 Hạn chế đã biết, chấp nhận được cho bản release đầu (ghi lại để minh bạch)

- WorldMap/khung game cố định 1194×834, không full màn hình thật trên điện
  thoại ngang (viền gradient 2 bên) — đã cân nhắc kỹ, đổi cần thiết kế lại
  ~30 màn hình, để dành sau.
- Admin panel 100% tiếng Việt, không đa ngôn ngữ (có chủ đích — chỉ phụ
  huynh/chủ app dùng, không phải người học).
- Nhiều loại nội dung (Shop/Home/Rpg/WordTrain/Detective/EchoParrot/
  ChatBuddy) chưa có trang tạo trong "Nội dung của tôi" — chỉ admin/seed
  soạn được, phụ huynh không tự thêm được loại này (API self-serve đã có
  sẵn, chỉ thiếu UI).
- Coin/XP hiển thị trong lúc chơi ở English Shop/Home/Word Train/Detective/
  Echo Parrot/Chat Buddy là **số đếm phiên**, không cộng vào `Progress.coins`
  thật (khác Lesson/Word Catch/Memory Match/Word RPG/Đấu trường — có cộng
  thật). Đã ghi nhận nhất quán trong `TASKS.md`, không phải lỗi, nhưng nên
  quyết định dứt điểm có muốn thống nhất tất cả game đều cộng thật không,
  trước khi người dùng nhận ra sự khác biệt và hỏi.
- Chưa có hệ thống mùa/reset cho Đường đua Hạng — rating tích luỹ vĩnh viễn.
- `tsconfig.json` của backend không bao gồm `prisma/`, nên `prisma/seed.ts`
  không bao giờ được `tsc` kiểm tra — verify cho file này luôn phải chạy
  seed thật, đã là thói quen trong suốt phiên làm việc, nhưng đáng để biết
  nếu người khác join dự án sau này.
- `.gitignore`/secrets: đã rà 1 lượt kỹ trước lần push đầu tiên (redact mật
  khẩu trong TASKS.md, thêm `.env`/`src/generated/` vào gitignore) — hiện
  tại `backend/.env` có secrets thật hợp lý (JWT secret ngẫu nhiên đủ dài,
  không phải giá trị mặc định "change-me"/"admin1234" nữa).

## ✅ Đã kiểm chứng chạy tốt (không cần rà lại)

- Hệ thống học chính: 6 world × nhiều bài học (906 câu hỏi), Story/Memory
  Match/Word Catch, Từ điển offline + Từ đã lưu (SRS thật), Word Train
  Adventure — nội dung phong phú, seed idempotent, đã verify qua API/
  Playwright nhiều đợt.
- 7 mini-game phụ (English Shop/Home/Word RPG/Word Train/English Detective
  100 vụ án/Echo Parrot 360 vòng/Chat with Buddy 100 chủ đề) — tất cả đã
  build + test tay qua Playwright, độ khó tăng dần có thiết kế thật (không
  chỉ nhãn), không phạt sai (trừ Word RPG cố tình có rủi ro HP thật).
- Đấu trường thời gian thực (WebSocket, 2-10 người, khoảng chờ kết nối lại
  20s, chống gian lận server-authoritative) + Đường đua Hạng (rating, 6 bậc)
  — đã test bằng nhiều trình duyệt/WebSocket thô thật, không chỉ đọc code.
  Kiến trúc chấp nhận scale nhỏ-vừa (~10k WS đồng thời/process) theo ước
  tính đã trao đổi.
- Battle Pass theo mùa (30 mốc, track Free/VIP) — verify sâu cả curl lẫn
  Playwright, DB constraint chống nhận thưởng trùng.
- Premium: 3/5 quyền lợi thật (tắt quảng cáo, +2 pet Legendary/tháng, khôi
  phục mua hàng) — đã enforce và verify thật, không chỉ toast giả.
- Đăng nhập: lỗi mạng khi mở app không còn xoá phiên oan (phân biệt đúng
  lỗi mạng vs token thật sự sai) — đã test bằng Playwright chặn request.
- Thông báo: xây lại hoàn toàn từ sự kiện thật (mở khoá pet, điểm danh, phối
  pet, nhận thưởng nhiệm vụ, hoàn thành bài học), trạng thái đã đọc lưu
  server-side thật, không còn reset khi rời màn.
- i18n: ~25 màn hình dịch Anh/Nhật/Hàn (UI chrome + nội dung học phần lớn),
  script kiểm tra parity 3 dictionary chạy sạch xuyên suốt phiên làm việc.
- Đóng gói Capacitor: icon/splash thật, build/sync sạch, **đã chạy + cài +
  mở được trên iPhone thật qua terminal** (không chỉ giả lập) — chỉ còn
  thiếu bước Android tương ứng (mục Blocker #5) và nâng cấp tài khoản trả
  phí (Blocker #4).

---

## Đề xuất thứ tự xử lý

1. Gỡ/ẩn vật phẩm test "Đói ngay" khỏi Shop thật.
2. Quyết định rõ mô hình kinh doanh (miễn phí hoàn toàn, hay có thu phí thật)
   — quyết định này chi phối toàn bộ Blocker #1, #2 (nếu thu phí thật thì
   Privacy Policy càng bắt buộc và cần kỹ hơn).
3. Nếu nhắm iOS trước: mua Apple Developer ($99/năm), điền credentials Apple
   Sign-In + chuyển sang flow native, chuẩn bị domain HTTPS thật.
4. Nếu nhắm cả Android: cài Android Studio, test build thật trên ≥1 máy
   Android thật, tạo keystore release + Google Play Console ($25 một lần).
5. Hoàn tất các mục ngoài code trong `LEGAL_RELEASE.md`: pháp nhân, email,
   legal review, bản dịch và verifiable parental consent nếu áp dụng.
6. Sau khi có domain HTTPS thật: tạo `.env.release` và secrets backend
   production từ các file `.example`, rồi chạy `npm run cap:sync:release`
   theo checklist trong `frontend/MOBILE_BUILD.md`.
