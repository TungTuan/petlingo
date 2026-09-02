# Petlingo — Task Tracker

Theo dõi việc đã làm và việc còn tồn cho cả backend + frontend. Đánh dấu
`[x]` khi xong, thêm mục mới ở cuối nhóm liên quan khi phát sinh việc mới.
`✅` = đã build/typecheck sạch và verify bằng test tay (curl/Playwright),
không chỉ viết code xong là coi như xong.

---

## Đã hoàn thành

### Ngôn ngữ giao diện (i18n)
- [x] Toàn bộ ~25 màn hình + component dùng chung dịch sang tiếng Anh, chọn được ở Cài đặt
- [x] `Parent.language` lưu ở backend, đồng bộ lại mỗi lần đăng nhập (`GET /auth/me`)
- [x] Nội dung từ vựng bài học (Story/MiniGame/WordCatch/SrsCard) **không** bị dịch — chỉ dịch UI chrome
- [x] Dictionary tại `frontend/src/lib/translations.ts` (500+ cụm)
- **(2026-08-23) Mở rộng lớn — xem mục "Chọn ngôn ngữ mẹ đẻ — nội dung học đa ngôn ngữ" bên dưới:** thêm Nhật/Hàn làm ngôn ngữ mẹ đẻ THẬT (đổi cả UI chrome LẪN ngôn ngữ giải nghĩa nội dung học, không chỉ UI như trước) — 2 dòng "không bị dịch"/"chỉ dịch UI chrome" ở trên giờ chỉ còn đúng với riêng chế độ "en" (giữ nguyên hành vi cũ để không phá trải nghiệm người dùng "en" hiện tại)

### Tài khoản admin
- [x] Seed tài khoản admin (role ADMIN) từ `ADMIN_EMAIL`/`ADMIN_PASSWORD` khai trong `backend/.env` (không commit — xem `.env.example`) qua `npm run prisma:seed`

### Đọc truyện — sửa lỗi audio + hạ tầng TTS
- [x] Phát hiện & sửa lỗi Web Speech API bị "câm" (voices load lỗi/thiếu ở nhiều trình duyệt/WebView)
- [x] Backend TTS cache thật (`msedge-tts`, không cần API key) — generate 1 lần theo hash(voice+text), cache vĩnh viễn ở `backend/storage/audio/`
- [x] `GET /tts?text=...` — có auth + rate limit riêng
- [x] Frontend fallback về Web Speech nếu mạng lỗi, không để im lặng hoàn toàn
- [x] Sửa 2 nút loa "chết" (SrsCard thiếu onClick; Story bấm từ vựng không phát âm)

### Nội dung học: Story / Memory Match / Word Catch
- [x] Model DB: `Story`/`StoryPage`, `MiniGameTopic`/`MiniGameWord`, `WordCatchTopic`/`WordCatchRound` (giống pattern World/Lesson/Question)
- [x] Admin CRUD routes cho cả 6 model (`/admin/stories`, `/admin/minigame-topics`, `/admin/wordcatch-topics`...)
- [x] Seed nội dung thật: 10 truyện (42 trang), 10 chủ đề Memory Match (40 cặp từ), 10 chủ đề Word Catch (50 lượt) — song ngữ Anh–Việt
- [x] Màn chọn (list → chi tiết) cho cả 3 tính năng thay vì nội dung cứng duy nhất
- [x] `MemoryCardDef` hỗ trợ thêm mặt thẻ "emoji" cho chủ đề không có ảnh pet phù hợp

### Nội dung của tôi (phụ huynh tự tạo)
- [x] Ownership model: `parentId` nullable trên Lesson/Story/MiniGameTopic/WordCatchTopic (null = hệ thống, có giá trị = riêng của phụ huynh đó)
- [x] `/my/*` routes (8 file) — phụ huynh thường (không cần ADMIN) chỉ quản lý được đúng nội dung của mình, đụng nội dung người khác → 404
- [x] Catalog đọc (`/catalog/*`) tự động trộn nội dung hệ thống + nội dung riêng của phụ huynh đang đăng nhập
- [x] Admin vẫn quản lý/xoá được mọi nội dung kể cả do phụ huynh tạo (kiểm duyệt)
- [x] Màn hình **"Nội dung của tôi"** (More → Nội dung của tôi) — 4 tab tạo/sửa/xoá, đơn giản hơn admin panel
- [x] Bài học tự tạo chơi được thật: WorldMap hiện màn chọn bài học (nhãn "Của bạn") khi 1 vùng có >1 bài

### Premium & giới hạn nội dung
- [x] `Parent.isPremium` (cờ demo, không hết hạn — app chưa có cổng thanh toán thật)
- [x] `PATCH /auth/me/premium` — nút "Dùng thử 7 ngày" ở trang Premium gọi thật, không còn là toast giả
- [x] Giới hạn 5 mục/loại cho tài khoản thường (Lesson, Story, MiniGame topic, WordCatch topic tính **riêng**, không cộng dồn); Premium bỏ giới hạn
- [x] `GET /my/quota` + badge "x/5" ở từng tab, form tạo bị thay bằng banner "Mở Premium" khi chạm ngưỡng

### Đấu trường (chế độ Fighting — phòng thời gian thực, 2-10 người)
- [x] Model DB `FightRoom`/`FightParticipant` + `@fastify/websocket` — bất kỳ ai có mã phòng 6 ký tự đều vào được (không cần hệ thống bạn bè), tối đa 10 người/phòng (`MAX_ROOM_PARTICIPANTS` trong `rooms.service.ts`)
- [x] `services/fight/liveRoomManager.ts` — gameplay thời gian thực chạy in-memory (không phải REST polling): server đẩy câu hỏi đồng thời cho cả phòng, ai trả lời đúng trước ghi điểm, KHÔNG BAO GIỜ gửi đáp án đúng xuống client (đúng triết lý anti-cheat của app)
- [x] Phòng là 1 lobby thật: ở trạng thái "waiting" (mở cho người vào) cho tới khi **host bấm nút "Bắt đầu trận đấu"** — không tự động vào trận khi đủ 2 người như trước; cần tối thiểu 2 người mới bấm được, chỉ host mới bấm được (server chặn người khác gửi lệnh start)
- [x] Người thắng (#1 theo điểm) được cộng thẳng coin vào Progress ngay khi trận đấu kết thúc (server tính, không tin điểm client báo lên) — hoà (nhiều người cùng điểm cao nhất) thì không ai nhận coin
- [x] Màn hình "Đấu trường" (More → Đấu trường): tạo phòng (chọn bài học) hoặc vào phòng bằng mã, màn lobby hiện danh sách người đã vào (tối đa 10 ô, ô trống hiện "?") + nút Bắt đầu cho host, màn đấu trực tiếp (bảng điểm 1v1 kiểu VS cho đúng 2 người, hoặc dải điểm cuộn ngang cho 3-10 người), màn kết quả (thắng/thua/hoà + coin thưởng, có bảng xếp hạng top 5 cho phòng đông người)
- [x] Mất kết nối giữa trận: phòng 3-10 người thì trận **vẫn tiếp tục** với những người còn kết nối, chỉ đe doạ kết thúc khi chỉ còn ≤1 người còn kết nối — xem dòng ngay dưới về khoảng chờ kết nối lại trước khi thật sự xử thua
- [x] Sửa 3 lỗi thật phát hiện khi test bằng nhiều trình duyệt thật: (1) room in-memory được tạo lúc host kết nối WS đầu tiên — trước khi đối thủ kịp vào phòng qua REST — nên đối thủ join sau bị từ chối "không thuộc phòng này"; (2) race giữa 2 effect phía frontend khiến màn hình bật lại "battle" ngay sau khi vừa chuyển sang "result"; (3) 1 socket cũ đóng trễ (do trang remount/hot-reload đúng lúc) có thể ghi đè nhầm làm mất kết nối của socket mới đang sống — bằng chứng thật: có trận bị xử thắng dù tỉ số 0-0, đúng dấu hiệu bị forfeit oan
- [x] **Khoảng chờ kết nối lại trước khi xử thua (2026-08-21)** — trước đây phòng 2 người (hoặc phòng đông người chỉ còn ≤1 người kết nối) bị xử thua/kết thúc trận **ngay lập tức** khi rớt mạng, dù chỉ vài giây. Giờ có khoảng chờ **20 giây** (`RECONNECT_GRACE_MS` trong `liveRoomManager.ts`) trước khi thật sự forfeit — logic "hồi lại trạng thái mid-match khi kết nối lại" đã có sẵn từ trước (`registerConnection()`) nên chỉ cần trì hoãn thời điểm gọi `endMatch()`, không cần viết lại luồng reconnect. Trong lúc chờ, đối thủ vẫn thấy trận tiếp diễn bình thường (không tạm dừng câu hỏi/đồng hồ đếm giờ) kèm banner "X mất kết nối — chờ Ns để kết nối lại…" đếm ngược real-time; nếu người rớt mạng quay lại kịp thì trận tiếp tục ngay (banner biến mất), nếu không thì xử thua đúng như cũ
  - Backend: thêm `disconnectGraceTimer` vào `LiveRoom`, message mới `opponent_disconnected`/`opponent_reconnected`. Frontend: `useFightSocket.ts` thêm `reconnectGrace` (tự đếm ngược 1 giây/lần phía client, không cần server gửi tick liên tục), `FightRoom.tsx`'s `BattleView` hiện banner vàng khi có
  - Test thật bằng WebSocket thô (2 child thật, script `ws` package trực tiếp, không phải mock): rớt kết nối B giữa trận → A nhận đúng `opponent_disconnected` (graceSeconds=20), trận KHÔNG kết thúc ngay; B kết nối lại trong lúc chờ → A nhận đúng `opponent_reconnected`, trận tiếp tục bình thường (B nhận lại đúng câu hỏi hiện tại); rớt kết nối B lần 2 và **không** kết nối lại → sau đúng ~20s trận mới kết thúc, A được xử thắng forfeit — đúng như thiết kế

### Đường đua Hạng (game leo rank)
- [x] `services/fight/rank.ts` — điểm rating riêng cho mỗi bé (`Progress.rating`, tách hẳn khỏi coins/gems), cập nhật mỗi khi kết thúc 1 trận Đấu trường (`liveRoomManager.ts`'s `endMatch()`). Cố tình **không zero-sum như Elo thật**: thắng luôn được cộng nhiều hơn thua bị trừ, có "upset bonus" khi thắng/thua trái kèo (±15), và rating có sàn 0 (không bao giờ âm) — để chuỗi thua không dìm bé xuống hố
- [x] 6 hạng leo dần theo điểm: Hạt Dẻ → Đồng → Bạc → Vàng → Kim Cương → Huyền Thoại, mỗi hạng có hệ số nhân coin thưởng khi thắng cao hơn (1× → 2×) — leo hạng có lợi ích thật, không chỉ là danh hiệu
- [x] Chỉ ghép trận qua mã phòng có sẵn của Đấu trường (không có ghép ngẫu nhiên/người lạ) — giữ đúng mô hình an toàn hiện có, không thêm rủi ro mới
- [x] `GET /fight/leaderboard` + `GET /fight/rank/:childId` — bảng xếp hạng **toàn bộ trẻ trong app** (không giới hạn nhóm tuổi/bạn bè), chỉ hiện tên hiển thị do phụ huynh đặt, không có chat/liên hệ
- [x] Màn "Đường đua Hạng" (`Rank.tsx`) viết lại hoàn toàn — bỏ dữ liệu mock (BOARD/PODIUM/PRIZES giả), nối thật vào API trên: bục vinh danh top 3, danh sách xếp hạng, vị trí + thanh tiến độ lên hạng tiếp theo của chính bé, trạng thái "chưa từng đấu"
- [x] Màn kết quả trận đấu (`FightRoom.tsx`'s `ResultView`) hiện thêm huy hiệu đổi điểm rating (▲/▼) + tên hạng ngay khi trận kết thúc
- [x] Test thật bằng Playwright 2-4 trình duyệt (không chỉ đọc code): trận thắng 5-0 → rating 0→25 hiện đúng trên màn kết quả lẫn bảng xếp hạng; trường hợp hoà bảng chỉ 2 người (chưa đủ 3 để hiện bục vinh danh); bục vinh danh 3 người hiện đúng thứ tự 2-1-3; trạng thái "chưa từng đấu"; toggle tiếng Anh cho câu ghép động ("Just 175 more points to reach Bronze.") đọc tự nhiên

### Sửa lỗi nhỏ (2026-08-20)
- [x] Nút "Trang sau" ở Đọc truyện (và 3 chỗ khác dùng cùng pattern sai: "Bắt đầu ôn" ở `Topics.tsx`, "Tiếp tục"/"Vào học ngay" ở `Onboarding.tsx`, "Dùng thử 7 ngày" ở `Premium.tsx`) — hiệu ứng lấp lánh `animate-shine` bị áp thẳng lên cả nút thay vì 1 dải sáng mỏng bên trong (đúng pattern `ChunkyButton`), khiến cả nút trượt xuyên màn hình liên tục theo chu kỳ 3.2s thay vì đứng yên. Verify bằng cách đo toạ độ nút qua nhiều thời điểm — đứng yên tuyệt đối sau khi sửa
- [x] Race condition ở `liveRoomManager.ts`: 1 socket cũ đóng trễ (do remount/hot-reload đúng lúc) có thể ghi đè nhầm làm mất kết nối của socket mới đang sống — vá bằng cách chỉ coi là rớt mạng thật khi đúng socket đang đóng vẫn là socket hiện tại của người chơi đó
- [x] `WorldMap.tsx` — trạng thái khoá/mở zone trước đây hardcode sai (Beach hiện mở dù thực tế chưa unlock), số sao (`starTotal`) và tiến độ mỗi zone (`done/total`) hoàn toàn bịa số. Đã nối khoá/mở với `Progress.unlockedWorlds` thật; bỏ hẳn số sao và tiến độ giả, thay bằng "Chưa theo dõi tiến độ" — không bịa số khi chưa có dữ liệu thật (xem "Việc còn tồn · Nội dung học có sẵn" — cần thêm bảng theo dõi bài học hoàn thành mới hiện lại được)

### 5 mini-game mới (2026-08-21) — cả 5 đã xong
Năm concept học từ vựng qua tình huống thực tế, cùng dạng "topic hệ thống +
tự tạo" như Memory Match/Word Catch. English Shop làm trước làm mẫu, English
Home dùng lại đúng khuôn đó, Word RPG thêm hệ thống HP/Level/XP lưu thật,
Word Train quay lại kiểu "không phạt" của Shop/Home nhưng thêm dạng câu hỏi
mới (điền chữ + xáo câu) thay vì chọn nghĩa/kéo thả, English Detective mở
rộng khuôn đó sang đối tượng người lớn/trẻ lớn hơn với 1 dạng chơi mới
(hỏi cung NPC trắc nghiệm + buộc tội) nhưng vẫn đặt chung màn "More"
riêng (không dùng chung khuôn round đơn giản của 2 game kia được).

- [x] **English Shop** — đọc 1 danh sách mua sắm bằng tiếng Anh ("Buy 2 apples and 1 banana."), chọn đúng món + đúng số lượng trên kệ hàng có cả món/số lượng gây nhiễu, xem "thu ngân" tính tiền (có câu thoại "How much is this?" / "It's $X." theo đúng ý tưởng gốc). Model DB `ShopTopic`/`ShopRound` (`shelf` = toàn bộ kệ hàng hiện ra kể cả hàng nhiễu, `required` = món/số lượng thực sự cần mua). Backend đầy đủ: admin CRUD + self-serve CRUD (`/my/shop-topics`, `/my/shop-rounds`, có giới hạn quota như Lesson/Story/MiniGame/WordCatch) + catalog đọc công khai (`/catalog/shop-topics`). Frontend: `EnglishShop.tsx` (màn chọn chủ đề + màn chơi), tile "English Shop" trong More. Test thật bằng Playwright: chọn đúng 2 táo + 1 chuối → giỏ hàng cập nhật đúng, hoá đơn hiện đúng tổng tiền, "Thanh toán" chuyển lượt tiếp đúng
  - **Dữ liệu mock (2026-08-21):** mở rộng từ 1 lên **7 chủ đề, 35 lượt chơi thật** — Siêu thị, Cửa hàng trái cây, Văn phòng phẩm, Cửa hàng đồ chơi, Cửa hàng quần áo, Tiệm bánh, Cửa hàng rau củ (mỗi chủ đề 5 lượt, ~45 từ vựng mới có emoji riêng). Verify lại bằng Playwright: đủ 7 thẻ chủ đề hiện đúng màu, mở thử "Cửa hàng đồ chơi" render đúng câu lệnh + emoji + checklist
  - **Việc còn tồn:** chưa có form tự tạo topic/round trong "Nội dung của tôi" (`MyContent.tsx`) — API self-serve đã sẵn sàng, chỉ thiếu UI, giống y hệt khoảng trống "Admin panel chưa có trang quản lý Story/MiniGame/WordCatch" đã ghi ở dưới. Chưa nối vào hệ thống Nhiệm vụ hôm nay (daily quest)
- [x] **English Home** — nhiệm vụ đặt đồ đúng chỗ dạng "Put the red ball under the table." Model DB `HomeTopic`/`HomeRound` (`objects`/`zones` JSON tự chứa, không dùng dictionary chung như Shop vì không có khái niệm số lượng và ít lặp lại). Backend đầy đủ y hệt pattern Shop: admin CRUD + self-serve CRUD (`/my/home-topics`, `/my/home-rounds`, có quota) + catalog đọc công khai (`/catalog/home-topics`). Đã seed **5 phòng, 25 lượt chơi thật**: Phòng khách, Phòng ngủ, Nhà bếp, Phòng tắm, Khu vườn (mỗi phòng dạy 1 bộ nội thất + đồ vật + màu sắc riêng)
  - **Kéo-thả cảnh phòng thật (2026-08-21):** bản đầu tiên là chạm 2 bước (chọn đồ vật → chọn vị trí); theo yêu cầu đã đổi sang **kéo-thả thật trong 1 cảnh phòng không gian** — mỗi phòng có nội thất đặt cố định (`ROOM_SCENES` trong `EnglishHome.tsx`, thuần frontend, không đổi schema/backend), vị trí mỗi ô thả được suy ra tự động từ tên nội thất + giới từ trong `zone.key` (vd "under-table" = ô ngay dưới bàn) — không cần vẽ toạ độ tay cho từng lượt trong 25 lượt, chỉ cần đặt vị trí 1 lần cho mỗi món nội thất/phòng. Kéo bằng pointer event (chạy được cả chuột lẫn cảm ứng/tablet)
  - **Sửa lỗi lệch con trỏ khi kéo:** ảnh đang kéo (ghost) hiện sai vị trí, lệch cố định theo đúng tỉ lệ scale toàn app — nguyên nhân: `ScreenFrame.tsx` bọc mọi màn hình trong 1 khung `transform: scale()` để vừa mọi kích thước màn hình (xem `.device-frame` trong `index.css`), mà theo chuẩn CSS, hễ có tổ tiên nào đang `transform` thì mọi phần tử `position: fixed` bên trong sẽ định vị theo khung đó thay vì theo viewport thật — nên toạ độ chuột thật (clientX/Y) không dùng thẳng được. Đã thêm hàm quy đổi toạ độ chuột thật sang toạ độ cục bộ của khung 1194×834 trước khi đặt vị trí ảnh kéo. Verify bằng cách đo trực tiếp: trước khi sửa lệch ~(52px, 13px) theo đúng tỉ lệ scale khung; sau khi sửa lệch gần 0 (sai số &lt;0.01px)
  - Test thật bằng Playwright (mô phỏng kéo chuột thật qua nhiều bước, không chỉ click): kéo đúng "Red Ball" vào đúng ô "Under the table" → panel thành công + cộng coin; kéo đúng đồ vật vào SAI ô → viền đỏ rung, không phạt, không tính thành công giả; đã chụp ảnh cả 5 phòng xác nhận không ô nào chồng lấn ô khác
  - **Việc còn tồn:** giống English Shop — chưa có form tự tạo trong "Nội dung của tôi", chưa nối Nhiệm vụ hôm nay
- [x] **Word RPG (2026-08-21)** — hầm ngục (topic) là 1 chuỗi quái vật; mỗi quái là vài câu "từ này nghĩa là gì?", trả lời đúng thì quái mất máu (HP quái = số câu hỏi, không cần lưu số máu riêng), trả lời sai thì **NGƯỜI CHƠI mất máu thật** (100 HP, mỗi câu sai -25) — khác hẳn triết lý "không phạt" của Shop/Home, đúng tinh thần RPG có rủi ro thật. Hết máu → Game Over, bấm "Thử lại" chơi lại từ đầu hầm ngục nhưng **không mất coin/XP đã kiếm** (mỗi lần hạ gục quái là cộng thẳng vào DB ngay lúc đó, không đợi hết hầm ngục — xem `services/rpg.service.ts`).
  - **XP/Level LƯU THẬT lâu dài** (khác hẳn Shop/Home — coin hiển thị trong lúc chơi ở đó chỉ là số đếm phiên, không cộng vào Progress.coins thật; đây là khoảng trống đã biết của 4 game cũ, không phải lỗi mới) — thêm cột `Progress.rpgXp`, có bảng mốc Level (`RPG_LEVELS` trong `rpg.service.ts`, cùng kiểu với `TIERS` của Đường đua Hạng). Quái thường +15 coin +20 XP, Boss +40 coin +50 XP — số này luôn do server tính từ chính con quái trong DB, không tin số client gửi lên (giống hệt triết lý `claimQuest`)
  - Model DB `RpgTopic`/`RpgMonster` (`questions` JSON tự chứa trong từng quái, không cần bảng câu hỏi riêng). Backend: admin CRUD + self-serve CRUD (`/my/rpg-topics`, `/my/rpg-monsters`, có quota) + catalog đọc công khai (`/catalog/rpg-topics`) + 2 route riêng `GET /rpg/status/:childId` và `POST /rpg/monsters/:id/defeat`. Đã seed **2 hầm ngục, 10 quái** (8 thường + 2 boss): Khu Rừng Cảm Xúc (cảm xúc), Hang Động Hành Động (động từ)
  - Frontend: `WordRpg.tsx` — thanh HP người chơi + quái, badge Cấp/thanh XP ở header, màn Game Over (giữ nguyên thưởng đã kiếm) và màn Chinh phục hầm ngục (RewardModal-style + báo Lên cấp nếu có)
  - Test thật bằng Playwright + kiểm tra thẳng DB sau khi đóng trình duyệt: cố tình trả lời sai 4 lần liên tiếp → đúng màn Game Over; "Thử lại" rồi trả lời đúng hết quái 1 → hạ gục, chuyển đúng sang quái 2/5, **và Progress.coins/rpgXp trong DB tăng đúng +15/+20** như quái thường quy định — không phải chỉ là số hiển thị trên UI
  - **Việc còn tồn:** chưa có form tự tạo trong "Nội dung của tôi"; chưa có equipment/pet đồng hành/bộ sưu tập quái (ý tưởng gốc có nhắc nhưng để dành làm sau); mới có dạng câu hỏi "nghĩa từ vựng" — chưa có Grammar/Listening/Conversation như ý tưởng gốc đề cập; chưa nối Nhiệm vụ hôm nay
- [x] **Word Train 🚂 (2026-08-21)** — điền chữ cái còn thiếu vào 1 từ, đúng thì tàu chạy tiếp 1 chặng. Ví dụ: `C _ T` + 3 lựa chọn `A/E/I` → chọn đúng `A` → ra `CAT` → tàu (🚂) chạy tiếp trên thanh tiến trình, sai thì tuỳ nút rung, không phạt, không tính lại. Chặng cuối mỗi "chuyến tàu" chuyển sang dạng xáo câu: cho gợi ý tiếng Việt + các từ xáo trộn, chạm đúng thứ tự để ghép câu (vd. "Con mèo đang ngủ." → chạm `The / cat / is / sleeping.`); sai thứ tự thì hiện "Chưa đúng thứ tự, thử lại nhé!" + nút "Làm lại" xáo lại từ đầu, không phạt coin
  - Kiến trúc **giống hệt khuôn English Shop/Home/RPG**: model `WordTrainTopic`/`WordTrainRound` (`kind: "fill" | "scramble"`, dữ liệu mỗi chặng nằm trong cột JSON `data` — `{word, blankIndex, options}` cho "fill", `{words}` cho "scramble"). Zod dùng `discriminatedUnion` cho schema tạo mới, còn schema update dùng object thường (không ràng buộc chéo, validate ở service như các game trước — xem `assertFillDataValid()`)
  - Backend: admin CRUD + self-serve CRUD (`/my/word-train-topics`, `/my/word-train-rounds`, có quota) + catalog đọc công khai (`/catalog/word-train-topics`). Đã seed **2 chuyến tàu, 12 chặng**: Chuyến Tàu Động Vật (CAT/DOG/PIG/COW/HEN + 1 câu xáo), Chuyến Tàu Đồ Ăn (JAM/EGG/TEA/HAM/BUN + 1 câu xáo)
  - Frontend: `WordTrain.tsx` — coin chỉ là số đếm phiên chơi (giống Shop/Home, **không** cộng vào `Progress.coins` thật — khoảng trống đã biết, khác Word RPG cố tình làm lưu thật)
  - Test thật bằng Playwright: giải đúng cả 5 chặng "fill" (coin tăng đúng 0→10→20→30→40→50, tàu di chuyển đúng theo `roundIdx`), cố tình ghép sai thứ tự câu ở chặng xáo → đúng hiện "Làm lại" không trừ coin, ghép đúng thứ tự → hiện màn Hoàn thành (+60 coin, +15 XP, "6/6 chặng")
  - **Việc còn tồn:** chưa có form tự tạo trong "Nội dung của tôi"; chưa nối Nhiệm vụ hôm nay; chưa làm cấp độ khó tăng dần thật sự (thiếu chữ ở vị trí khác nhau, thiếu nhiều chữ hơn) như ý tưởng gốc đề cập — hiện tất cả chặng "fill" đều chỉ thiếu 1 chữ
- [x] **English Detective 🕵️ (2026-08-21)** — đọc 1 vụ án bằng tiếng Anh (scenario + bản dịch tiếng Việt), hỏi cung từng nghi phạm: đọc lời khai tiếng Anh của NPC (hiện qua `SpeechBubble`), trả lời trắc nghiệm để hiểu ý lời khai, đúng thì lộ ra 1 manh mối tiếng Việt và chuyển sang nghi phạm kế; hỏi cung xong hết thì tới bước cuối "buộc tội" — xem lại toàn bộ manh mối đã thu thập rồi chọn đúng thủ phạm trong số nghi phạm để phá án. Sai ở bước nào cũng chỉ rung nút, không phạt, không tính lại — **quyết định theo 2 câu hỏi đã hỏi user**: (1) đặt chung màn "More" với các mini-game khác thay vì tách khu riêng cho người lớn, (2) hỏi cung/buộc tội đều dùng trắc nghiệm cho bản đầu, không nhập câu trả lời tự do bằng tiếng Anh
  - Kiến trúc **giống hệt khuôn Word Train**: model `DetectiveCase` (topic, có thêm `scenario`/`scenarioVi` vì bản thân vụ án cần nội dung riêng chứ không chỉ là tên) + `DetectiveRound` (`kind: "interrogate" | "accuse"`, dữ liệu JSON — `{npcName, npcEmoji, testimony, testimonyVi, question, options, answerIndex, clue}` cho hỏi cung, `{suspects, correctSuspect}` cho buộc tội). Cùng lối `discriminatedUnion` cho schema tạo mới + validate chéo ở service cho schema update (`assertInterrogateDataValid`/`assertAccuseDataValid`)
  - Backend: admin CRUD + self-serve CRUD (`/my/detective-cases`, `/my/detective-rounds`, có quota — riêng schema tự tạo `myDetectiveCaseSchema` cần nhập cả `scenario`/`scenarioVi`, khác các game khác chỉ cần `name`) + catalog đọc công khai (`/catalog/detective-cases`). Đã seed **2 vụ án, 8 lượt** (mỗi vụ 3 nghi phạm + 1 lượt buộc tội): Vụ Trộm Vòng Cổ, Vụ Mất Laptop Văn Phòng
  - Frontend: `EnglishDetective.tsx` — bảng "Manh mối đã thu thập" hiện dần suốt ván chơi, màn giới thiệu vụ án trước khi hỏi cung, coin chỉ là số đếm phiên chơi (giống Shop/Home/Word Train, không cộng `Progress.coins` thật)
  - Test thật bằng Playwright: cố tình trả lời sai câu hỏi cung đầu → không tính, không rớt manh mối; trả lời đúng cả 3 nghi phạm → đúng 3 manh mối xuất hiện tuần tự, coin tăng 0→10→20→30; ở bước buộc tội cố tình chọn sai nghi phạm → không tính; chọn đúng thủ phạm → màn "Hoàn thành!" (+60 coin, +20 XP, "Đã phá án!", đúng tên thủ phạm)
  - **Việc còn tồn:** chưa có form tự tạo trong "Nội dung của tôi"; chưa nối Nhiệm vụ hôm nay; mới có 2 vụ án 3-nghi-phạm, chưa có vụ án phức tạp hơn (nhiều nghi phạm hơn, nhiều lớp manh mối hơn); vẫn dùng trắc nghiệm hỏi cung/buộc tội — nếu sau này muốn nâng lên hội thoại NPC nhiều lượt/nhập câu tự do bằng tiếng Anh thì cần thiết kế lại từ đầu (chấm điểm câu trả lời tự do phức tạp hơn hẳn, có thể cần gọi AI để chấm)

### Admin panel — trang quản lý Story / Memory Match / Word Catch (2026-08-21)
- [x] 3 trang mới `StoriesPage.tsx`, `MiniGamePage.tsx`, `WordCatchPage.tsx` trong `frontend/src/admin/pages/`, thêm 3 tab tương ứng trong `AdminApp.tsx` (📖 Truyện, 🧠 Memory Match, 🎣 Word Catch) — API `/admin/*` cho cả 3 đã có sẵn từ trước, chỉ thiếu UI như đã ghi ở mục dưới, giờ đã bù đủ. Theo đúng khuôn `LessonsPage.tsx` (form Modal đầy đủ field `key`/màu/`order`/`isActive`, không phải bản rút gọn kiểu self-serve của `MyContent.tsx`)
  - `frontend/src/lib/api.ts` thêm 3 type input đầy đủ cho admin (`StoryInput`, `MiniGameTopicInput`, `WordCatchTopicInput` — có `key`/màu, khác hẳn `MyStoryCreateInput` self-serve chỉ cần `title`/`topic`) + 24 method `admin*` mới. Tái dùng nguyên `MyStory`/`MyStoryPage`/`MyMiniGameTopic`/`MyMiniGameWord`/`MyWordCatchTopic`/`MyWordCatchRound` cho cả admin lẫn self-serve — 2 phía đọc CÙNG 1 hàng dữ liệu (chỉ khác `/admin/*` không lọc theo `ownerId`), không cần định nghĩa type riêng
  - Story có thêm màn quản lý "Trang" lồng bên trong (câu Anh/Việt, 2 pet minh hoạ, màu nền trời/đất, mảng từ mới tối đa 6 từ — mirror đúng `QuestionForm`'s options-array pattern); Word Catch's "Lượt chơi" mirror đúng `QuestionForm` (chọn ô tròn cho đáp án đúng trong danh sách lựa chọn, validate đáp án phải nằm trong lựa chọn)
  - Test thật bằng Playwright: tạo mới 1 truyện + 1 trang, 1 chủ đề Memory Match + 1 cặp từ (sửa lại cặp từ vừa tạo, xác nhận đổi đúng), 1 chủ đề Word Catch + 1 lượt chơi đúng đáp án nằm trong lựa chọn; cố tình lưu lượt chơi Word Catch KHÔNG chọn đáp án → đúng hiện lỗi "Đáp án phải nằm trong danh sách lựa chọn." không cho lưu. Đã xoá sạch toàn bộ dữ liệu test qua API sau khi verify xong
  - **Lưu ý phát hiện được (không phải lỗi mới tạo ra):** danh sách truyện admin đang có sẵn 5 truyện rác tên "1"–"5" (0 trang, chắc là dữ liệu test từ phiên làm việc trước chưa dọn) — chưa xoá vì không chắc có phải cố ý hay không, để phụ huynh/người dùng tự xoá qua chính trang quản lý mới này nếu đúng là rác
  - **Việc còn tồn:** số đếm trang/cặp từ/lượt chơi ở cột bên trái không tự cập nhật ngay sau khi thêm/sửa/xoá mục con (phải chọn lại mục cha để thấy số mới) — hành vi này đã có sẵn y hệt ở `LessonsPage.tsx` (thêm câu hỏi cũng không refresh số câu của bài học), không phải lỗi mới, chỉ ghi nhận lại

### Đóng gói app di động — scaffold Capacitor (2026-08-21)
- [x] Cài `@capacitor/core`/`cli`/`ios`/`android`, `npx cap init` (appId `com.petlingo.app`), sinh cả 2 project native `ios/`/`android/` thật trong repo. Đã cài CocoaPods qua Homebrew + chạy `pod install` cho iOS thành công (phải nâng deployment target Podfile từ 14.0 → 15.0 cho khớp version `@capacitor/ios` 8.5.0 mới cài) — **chỉ còn thiếu Xcode đầy đủ trên máy** (hiện mới có Command Line Tools) để thực sự mở/build/ký được, không cài thay được vì cần đăng nhập App Store + tải ~40GB
  - Đã tạo icon + splash screen thật cho cả iOS/Android/PWA bằng `@capacitor/assets` (nguồn dựng từ logo có sẵn `public/favicon.svg`, script dựng ảnh nguồn ở `frontend/assets-src/`) — không dùng icon mặc định của Capacitor
  - `ScreenFrame.tsx` tự ẩn khung bezel "tablet giả" khi `Capacitor.isNativePlatform()` — trên app native thật nội dung full-screen, không vẽ chồng thêm 1 lớp khung viền nữa (vẫn giữ nguyên hành vi cũ cho mọi trường hợp khác, kể cả mở bằng trình duyệt điện thoại)
  - Bật `usesCleartextTraffic` (Android, qua `AndroidManifest.xml` + `capacitor.config.ts`'s `server.cleartext`) và `NSAllowsArbitraryLoads` (iOS, qua `Info.plist`) để app gọi được backend qua `http://<LAN IP>` lúc test — có ghi rõ phải tắt lại trước khi release thật
  - Thêm `frontend/.env.mobile` + script `npm run build:mobile`/`npm run cap:sync` (build web trỏ `VITE_API_URL` sang LAN IP của Mac, rồi đồng bộ sang cả 2 project native) — verify thật: build ra đúng bundle chứa IP LAN thay vì `localhost`, `cap:sync` cho Android chạy sạch hoàn toàn, phần iOS copy asset thành công (chỉ bước `pod install` xác thực lại là lỗi do thiếu Xcode đầy đủ, đúng như dự kiến)
  - Cập nhật `backend/.env`'s `CORS_ORIGIN` thêm origin WebView mặc định của Capacitor (`capacitor://localhost` cho iOS, `http://localhost` cho Android) + origin LAN IP cho trường hợp mở bản web thường qua trình duyệt điện thoại
  - Viết `frontend/MOBILE_BUILD.md` — hướng dẫn đầy đủ: cài Xcode/Android Studio, chạy trên điện thoại thật qua cáp (Apple ID thường, miễn phí, không cần TestFlight — app tự hết hạn 7 ngày), sideload APK debug cho Android, nâng cấp lên TestFlight thật khi có tài khoản Apple Developer trả phí (từng bước archive → App Store Connect → mời tester), Google Play Internal testing (tuỳ chọn), troubleshooting, và checklist trước khi release thật
  - **Cập nhật (2026-08-21, cùng ngày):** Xcode 26.6 đã được cài xong (đủ platform iOS) — chỉ còn thiếu bước `sudo xcodebuild -license accept` (cần mật khẩu, phải tự chạy). Đã cài thêm `ngrok` qua Homebrew làm cách 2 để điện thoại gọi backend (thay thế/bổ sung IP LAN — có HTTPS thật, dùng được ở bất kỳ mạng nào, không phải chỉnh sửa `NSAllowsArbitraryLoads`/cleartext để test). Backend's CORS (`app.ts`) đổi từ mảng tĩnh sang hàm kiểm tra origin: khớp đúng `CORS_ORIGIN` như cũ, HOẶC (ngoài production) tự động khớp mọi origin `https://*.ngrok-free.app`/`*.ngrok.io`/`*.ngrok.app` — không cần sửa `CORS_ORIGIN` tay mỗi lần tunnel ngrok đổi URL. Verify thật bằng curl: origin đã khớp trước đó vẫn qua, origin ngrok giả lập qua đúng, origin lạ bị chặn
  - **Cập nhật (2026-08-22) — đã chạy thật trên iPhone thật, verify đầu-cuối:** user tự chạy `sudo xcode-select`/`sudo xcodebuild -license accept` (cần mật khẩu máy, không chạy hộ được); tôi tải nốt platform iOS 26.5 còn thiếu (`xcodebuild -downloadPlatform iOS`, 8.5GB) + chạy `xcodebuild -runFirstLaunch` (thiếu `CoreSimulator.framework` lúc đầu). Phát hiện & sửa `com.petlingo.app` bị trùng bundle ID với người khác trên Apple (lỗi "Failed Registering Bundle Identifier") → đổi sang `com.tungnguyentuan.petlingo`. Sau khi user tự bật **Developer Mode** trên iPhone (bắt buộc từ iOS 16+, chỉ bật được trực tiếp trên máy) và tự trust Apple ID trong Signing & Capabilities, tôi build + cài + mở thẳng app lên iPhone thật của user qua terminal (`xcodebuild ... build` → `xcrun devicectl device install app` → `device process launch`), không cần user bấm Run trong Xcode
  - **Cập nhật (2026-08-22) — 2 lỗi UI phát hiện khi test trên máy thật:**
    1. App tự xoay dọc được — đã khoá landscape-only ở tầng native (`Info.plist`'s `UISupportedInterfaceOrientations` bỏ Portrait, thêm `UIRequiresFullScreen`; Android's `android:screenOrientation="sensorLandscape"`), không dựa vào CSS rotate-90 trick nữa (trick đó vẫn giữ cho web thường)
    2. Ngay cả lúc xoay ngang cũng không lấp đầy màn hình (2 viền trống lớn 2 bên) — nguyên nhân: khung thiết kế cố định 1194×834 (~1.43:1) hẹp hơn nhiều tỉ lệ màn hình điện thoại ngang thật (~2.17:1). **Đã thử nghiệm thực tế phương án "phóng to lấp đầy" bằng Playwright trước khi quyết định** (mô phỏng đúng tỉ lệ iPhone 14 Pro Max) — xác nhận cách đó cắt mất hoàn toàn thanh điều hướng dưới cùng + thanh trạng thái trên cùng, KHÔNG dùng được. Thay vào đó chỉ đổi 2 viền trống từ màu trơn sang gradient màu thương hiệu (`ScreenFrame.tsx`) — an toàn, không mất nội dung, nhưng chưa phải "full màn hình thật". Muốn full màn hình thật cần thiết kế lại layout ~30 màn hình theo tỉ lệ rộng hơn/responsive — khối lượng lớn, chưa làm, ghi rõ trong `MOBILE_BUILD.md`'s mục "Vì sao không full màn hình thật"
  - **Cập nhật (2026-08-22) — đã widen khung thiết kế 1194×834 → 1680×834, giảm mạnh viền trống:** user yêu cầu thiết kế lại layout ~30 màn hình để đỡ viền trống hơn. Trước khi sửa, dùng 2 agent (Explore audit toàn bộ 31 file `pages/*.tsx` + `components/*.tsx`, rồi Plan agent phản biện/verify độc lập lần 2) xác nhận: layout cả app đã dùng `flex-1`/% gần như tuyệt đối (166 lượt `flex-1`), chỉ 5 chỗ absolute-position bằng px nhưng đều gắn với phần tử nhỏ cục bộ (bong bóng thoại, toggle) không phải canvas — an toàn; chỉ 3 chỗ code thật sự gắn cứng số `1194`/`834`. Kết luận: **không cần "thiết kế lại" từng màn hình** — chỉ cần nới rộng khung tham chiếu là gần như mọi màn hình tự co giãn đúng theo kiến trúc `flex-1` có sẵn
    - Đổi `index.css`'s `.device-frame` từ `1194×834` → **`1680×834`** (chỉ đổi width, giữ nguyên height 834 nên font/spacing/tỉ lệ dọc mọi màn hình không đổi) — 1680/834 ≈ 2.01, chọn để vừa dưới tỉ lệ đa số điện thoại hiện đại (~2.1-2.2:1) nên vẫn bị giới hạn bởi chiều cao (viền trống nhỏ) thay vì lật sang bị giới hạn chiều rộng (viền trên/dưới). Đo thực tế trên iPhone 14 Pro Max: viền trống mỗi bên giảm từ ~158px → ~33px (giảm ~79%)
    - Sửa `EnglishHome.tsx`'s `toDeviceFramePoint()` từ hardcode `/ 1194` sang tự đọc `frame.offsetWidth` lúc runtime — không bao giờ lệch nữa dù khung đổi kích thước tiếp trong tương lai
    - **Cố tình CHƯA sửa `WorldMap.tsx`** — bản đồ dùng hệ toạ độ 1194×834 riêng, độc lập với khung ngoài (6 đảo/zone định vị theo mảng `POS` riêng) — nới khung ngoài không làm bản đồ rộng theo, chỉ lộ ra khoảng gradient trống bên phải bản đồ lúc zoom mặc định (không phải lỗi, xem "Việc còn tồn" bên dưới)
    - Verify thật bằng Playwright (viewport 932×430, đúng tỉ lệ iPhone 14 Pro Max): đăng nhập + đi qua **26/26 màn hình reach được** trong 1 phiên (app không có router, phải bấm điều hướng thật, không được reload) — toàn bộ đều co giãn đẹp/căn giữa cân đối, không có màn nào bị "trống" bất thường hay vỡ layout. Riêng `Lesson.tsx`'s lưới 4 đáp án (nghi ngờ ban đầu sẽ quá to) — kiểm tra thực tế thấy vẫn đẹp, không cần thêm `max-w` giới hạn. `WorldMap.tsx` đúng như dự đoán có khoảng trống bên phải (chấp nhận được, đã note follow-up)
    - Build lại + cài lại lên iPhone thật của user (`xcodebuild` → `devicectl install` → `device process launch`) để user tự xác nhận lần cuối
  - **Cập nhật (2026-08-22) — user phản hồi "khá bé", tăng thêm size chữ/item:** thu nhỏ khung tham chiếu `1680×834` → **`1260×626`** (giữ nguyên tỉ lệ ~2.01, chỉ đổi giá trị tuyệt đối) — đây là đòn bẩy khác hẳn với việc đổi tỉ lệ: cùng 1 tỉ lệ, khung tham chiếu càng nhỏ thì mỗi px thiết kế trong code càng chiếm phần trăm lớn hơn của khung, nên render ra to hơn trên màn hình thật dù khung ngoài vẫn chiếm đúng diện tích màn hình như cũ (không đổi/ảnh hưởng gì đến độ giảm viền trống đã làm ở trên). Đo: chữ/nút to hơn ~33% trên iPhone 14 Pro Max, không cần sửa bất kỳ font-size/kích thước nào trong code từng màn hình
    - **Đánh đổi thật, không miễn phí như lần nới rộng trước:** khung nhỏ hơn đồng nghĩa ít "chỗ" hơn cho nội dung cố định kích thước (vd sidebar `w-[250px]`) trước khi hết chỗ — verify lại bằng Playwright phát hiện `Premium.tsx`'s nút mua chính ("Dùng thử 7 ngày") bị đẩy khuất dưới màn hình thật (bảng so sánh + 3 thẻ gói kèm nhau cao hơn không gian còn lại, mà cột đó dùng `overflow-hidden` không cuộn được) — **đã sửa**: tách phần thẻ gói + bảng so sánh vào 1 khối cuộn riêng (`overflow-y-auto`), nút CTA nằm ngoài khối cuộn nên luôn hiện cố định phía dưới, cuộn được nếu bảng so sánh dài hơn màn hình
    - Rà thêm 21 file có dùng `mt-auto` cho nút/khối cuối màn hình — hầu hết đều nằm trong cột đã có `overflow-y-auto` sẵn (an toàn, có thể cuộn nếu cần) hoặc chỉ là dòng chữ trạng thái nhỏ trong sidebar đã đủ chỗ (không phải CTA chính), không phát hiện thêm trường hợp nào giống Premium
    - Phát hiện thêm (không phải lỗi mới, chỉ lộ rõ hơn): `ParentArea.tsx`'s danh sách "Bài học gần đây" và `Profile.tsx`'s "Bạn bè học cùng" không cuộn được (`overflow-hidden` từ trước), giờ hiện ít mục hơn trước khi hết chỗ hiện — chấp nhận được vì đây là nội dung phụ/thông tin tham khảo (không phải hành động chính), có thể thêm `overflow-y-auto` sau nếu cần xem hết
    - Verify lại toàn bộ + build + cài lại lên iPhone thật của user
  - **Việc còn tồn:** Android chưa test thật trên thiết bị (còn thiếu Android Studio); `WorldMap.tsx` chưa được thiết kế lại cho khung rộng hơn (vẫn dùng world 1194×834 cũ, lộ khoảng gradient trống bên phải lúc zoom mặc định) — cần định vị lại 6 đảo/zone + path SVG nối chúng cho khung mới, việc thiết kế riêng, chưa làm; `ParentArea.tsx`/`Profile.tsx`'s danh sách phụ (bài học gần đây/bạn bè) chưa cuộn được nếu nhiều hơn số hiện vừa màn hình
  - **Cập nhật (2026-08-22/23) — sửa lỗi UI Home bị che nút trên máy thật:** ảnh chụp máy thật cho thấy vùng notch/Dynamic Island + Home Indicator vật lý che mất một phần thanh tab dưới cùng — nguyên nhân: khung app canh giữa theo TOÀN BỘ màn hình vật lý, không né vùng an toàn. Sửa bằng cách trừ `env(safe-area-inset-*)` khi tính tỉ lệ scale VÀ canh giữa khung trong vùng an toàn thay vì toàn màn hình (`index.css`'s `.device-frame` + `ScreenFrame.tsx`'s `.safe-frame-pad`) — verify: giá trị này = 0 trên trình duyệt thường (không notch) nên không đổi gì ở đó (tsc/oxlint sạch, Playwright xác nhận không hồi quy); **phần hiệu quả thật trên notch/home-indicator cần build lại + user tự xác nhận trên iPhone thật** (Playwright không mô phỏng được notch vật lý)

### 🦜 Vẹt Con Tập Nói (Echo Parrot) — hoàn thành (2026-08-22)
- [x] Game luyện **nói + phát âm** đầu tiên trong app (mọi game khác chỉ luyện nghe/đọc/nhận biết) — bé nghe mẫu (TTS có sẵn, `lib/tts.ts`) rồi tự nói lại, app dùng speech-to-text so khớp gần đúng văn bản nhận được với từ mục tiêu (`isCloseSpeechMatch()` — chuẩn hoá chữ hoa/dấu câu, chấp nhận khớp chính xác hoặc chứa từ mục tiêu, không chấm phát âm/âm vị chi tiết ở bản đầu)
  - Backend: kiến trúc "topic + round" giống hệt 6 game trước (`EchoParrotTopic`/`EchoParrotRound`, CRUD admin + self-serve `/my/*`, catalog đọc công khai), seed sẵn 2 chủ đề/10 round (Động Vật, Câu Giao Tiếp) kèm phiên âm IPA tham khảo
  - Frontend: `lib/useSpeechRecognition.ts` — hook trừu tượng hoá native (Capacitor `@capacitor-community/speech-recognition`, thật sự chỉ hỗ trợ native, KHÔNG có bản web fallback dù plugin để vậy — đã đọc thẳng `web.js` của plugin xác nhận là stub `throw unimplemented`) vs web (`window.SpeechRecognition` thô, dùng khi test trình duyệt) — quyết định rẽ nhánh này làm TRƯỚC khi viết code, tránh xây nhầm kiến trúc dựa trên giả định sai
  - iOS cần thêm `NSSpeechRecognitionUsageDescription`/`NSMicrophoneUsageDescription` vào `Info.plist` (hiện nguyên văn cho user khi xin quyền lần đầu); Android không cần sửa gì — plugin tự khai `RECORD_AUDIO` trong `AndroidManifest.xml` riêng của nó, Capacitor tự merge
  - Test thật bằng Playwright với `window.SpeechRecognition` giả lập (môi trường sandbox không có mic thật): mô phỏng cả trả lời sai (không tính, hiện "Bạn nói: ..." + nút thử lại) lẫn đúng (+10 coin, hiện ✅, tự chuyển round kế); chơi hết 5 round → màn "Hoàn thành!" đúng +50 coin/+15 XP/5-5; mô phỏng thiết bị KHÔNG hỗ trợ nhận diện giọng nói → hiện đúng thông báo + nút bỏ qua, không crash
  - **Việc còn tồn (quan trọng — không thể tự verify được):** độ chính xác nhận diện giọng nói THẬT trên thiết bị thật (không phải logic ứng dụng, cái đó đã verify) chỉ user tự nói vào iPhone thật mới xác nhận được — đã hỏi user thử qua chat, user chuyển hướng sang hỏi khả năng chấm % giống người bản xứ (xem mục "Chấm điểm phát âm % theo giọng bản xứ" dưới `Việc còn tồn`) thay vì test trực tiếp; coin trong game chỉ đếm phiên (không cộng `Progress.coins` thật, giống mọi mini-game nhẹ khác trừ Word RPG)

### Chọn ngôn ngữ mẹ đẻ — nội dung học đa ngôn ngữ Việt/Nhật/Hàn (2026-08-23)
User yêu cầu: chọn ngôn ngữ mẹ đẻ (không chỉ đổi UI) phải đổi luôn ngôn ngữ
giải nghĩa nội dung học trong MỌI game (ý tưởng: "chọn tiếng Nhật → dạy tiếng
Anh cho người Nhật"), lần đầu vào app phải hiện màn chọn ngôn ngữ nếu chưa
từng chọn, và cập nhật seed data cho các ngôn ngữ mới. Quyết định qua
`EnterPlanMode` + audit đầy đủ trước khi đổi schema (xem plan đã duyệt).
- [x] **Kiến trúc cốt lõi — giải quyết ở phía SERVER, không phải client:** `catalog.service.ts` có hàm `pickLang()` mới, chọn đúng biến thể ngôn ngữ (vi/ja/ko, rơi về vi nếu thiếu bản dịch) NGAY TRƯỚC KHI trả về cho client — field trả về vẫn giữ nguyên tên cũ (`vi`, `instructionVi`, `scenarioVi`, `answer`, `clue`...) dù bên trong là tiếng Nhật/Hàn. Nhờ vậy **10 trang game frontend (WordCatch/EchoParrot/Detective/Shop/Home/Rpg/WordTrain/Story/MiniGame/Lesson) không cần sửa 1 dòng nào** — chỉ cần đổi kiến trúc chọn ngôn ngữ 1 chỗ duy nhất ở backend
  - Middleware mới `attachViewerLanguage.ts` (chạy sau `verifyAuth`) tra `Parent.language` 1 lần/request, gắn vào `request.viewerLanguage`, các route `/catalog/*` truyền tiếp vào service
  - `lang === "en"` cố tình vẫn rơi về nội dung tiếng Việt (giữ nguyên hành vi cũ) — không có khái niệm "dạy tiếng Anh cho người nói tiếng Anh" nên không đổi
- [x] **Schema**: `enum Language` thêm `ja`/`ko`; `Parent.language` đổi thành nullable KHÔNG default (`null` = chưa từng chọn, dùng để quyết định hiện màn chọn ngôn ngữ lần đầu — tài khoản cũ đã có sẵn giá trị "vi" không bị ảnh hưởng, chỉ tài khoản MỚI đăng ký mới có `null`); thêm cột `ja`/`ko` (nullable) song song mọi cột `vi`/`meaningVi`/`scenarioVi`/`instructionVi` hiện có ở 10 model (`Vocab`, `StoryPage`, `MiniGameWord`, `WordCatchRound`, `ShopRound`, `HomeRound`, `WordTrainRound`, `DetectiveCase`, `DetectiveRound`, `EchoParrotRound`) — 1 migration `add_ja_ko_content`. Các field bên trong cột `Json` (không cần migration, chỉ đổi Zod schema/seed): `StoryPage.words[]`, `ShopRound.shelf[]` thêm khoá `ja?`/`ko?`; `RpgMonster.questions[]`'s `answer`/`options` đổi tên thành `answerVi`/`optionsVi` (đây là dữ liệu gốc, không phải field phụ, buộc phải đổi tên khi thêm đa ngôn ngữ) + thêm `answerJa/optionsJa`/`answerKo/optionsKo`; `DetectiveRound.data`'s `clue` (vốn không có hậu tố `Vi` dù luôn là tiếng Việt) đổi tên thành `clueVi` + thêm `clueJa`/`clueKo`. `HomeRound.objects`/`zones` giữ nguyên KHÔNG đổi — nhãn đối tượng/vị trí luôn cố tình là tiếng Anh theo đúng thiết kế game, chỉ câu lệnh trên cùng cần dịch
- [x] **`admin.schema.ts`**: thêm field `ja?`/`ko?` tuỳ chọn vào mọi schema liên quan; refine "đáp án phải nằm trong lựa chọn" của Rpg mở rộng kiểm tra riêng cho từng ngôn ngữ khi có mặt. Self-serve (`my.schema.ts`, "Nội dung của tôi") **cố tình giữ nguyên chỉ tiếng Việt** — không bắt phụ huynh tự soạn nội dung phải điền đủ 3 ngôn ngữ, `pickLang()` tự rơi về tiếng Việt nếu thiếu bản dịch, y hệt triết lý `useT()` đã dùng cho UI chrome
- [x] **`seed.ts` — dịch toàn bộ ~550 chuỗi có sẵn sang tiếng Nhật + Hàn** (tự dịch trực tiếp, không dùng API dịch ngoài — từ vựng trẻ em cơ bản, đủ khả năng tự dịch chuẩn): 200 từ Vocab, 42 trang truyện + 126 từ mới trong Story, 40 cặp từ MiniGame, 50 round WordCatch, 35 round Shop (tự SINH câu lệnh Nhật/Hàn từ dữ liệu `required` có sẵn qua hàm `buildShopInstruction()`/`buildHomeInstruction()` thay vì gõ tay từng câu — áp dụng y hệt cho 25 round Home), 34 câu hỏi Rpg (qua từ điển dùng chung `RPG_WORD_JA_KO` vì các từ cảm xúc/hành động lặp lại nhiều), 12 round WordTrain, 8 round Detective (cả `testimonyJa/Ko` lẫn `clueJa/Ko`), 10 round EchoParrot
  - Vì hệ thống seed cũ có logic "bỏ qua nếu chủ đề đã tồn tại" (tránh trùng lặp khi chạy lại), phải xoá sạch dữ liệu ROUND/PAGE hệ thống (không đụng dữ liệu tự tạo của phụ huynh, lọc `parentId: null`) trước khi seed lại — script xoá 1 lần dùng xong xoá luôn, không để lại trong repo. Phát hiện thêm 1 chỗ sót: `DetectiveCase`'s `scenarioJa/Ko` không backfill được qua seed vì topic-level dùng `upsert({update:{}})` (không cập nhật hàng đã tồn tại) — vá tay bằng 1 script update trực tiếp
- [x] **Frontend**: `Lang` type mở rộng `"vi"|"en"|"ja"|"ko"`; `translations.ts` thêm `DICTIONARY_JA`/`DICTIONARY_KO` — dịch tay toàn bộ 733 cụm UI chrome hiện có sang cả 2 ngôn ngữ (matching 100% key với dictionary gốc, verify bằng script parse AST, không sai lệch/trùng lặp); `useT()` chọn đúng dictionary theo `lang`, rơi về tiếng Việt nếu thiếu bản dịch. Phát hiện thêm 6 chuỗi mô tả tile ở `More.tsx` (English Shop/Home/RPG/Train/Detective/EchoParrot) **chưa từng được dịch kể cả sang tiếng Anh** — lỗi có sẵn từ trước, tiện tay bổ sung luôn cho cả 3 ngôn ngữ (không phải lỗi tôi gây ra)
  - `pages/LanguagePicker.tsx` (mới) — màn chọn ngôn ngữ 4 ô (Tiếng Việt/日本語/한국어/English), giao diện mượn nguyên phong cách nền trời/mây của `Onboarding.tsx` vì đứng ngay trước nó trong luồng lần đầu vào app
  - `App.tsx` thêm `Phase = "pickLanguage"` — `afterAuth()` kiểm tra `parent.language === null` thì rẽ qua màn chọn ngôn ngữ trước, chọn xong mới tiếp tục luồng `createChild`/`onboarding`/`home` y hệt cũ (tách hàm `proceedPastLanguage()` dùng chung)
  - `Onboarding.tsx` thêm `STEPS_JA`/`STEPS_KO` (dịch tay cả 4 bước) song song `STEPS_VI`/`STEPS_EN` có sẵn; `Settings.tsx`'s `LangSwitch` từ 2 nút (vi/en) lên 4 nút (vi/ja/ko/en), cập nhật lại câu mô tả "Ngôn ngữ giao diện" cho đúng hành vi mới (nội dung học cũng đổi theo, không còn "giữ song ngữ Anh–Việt" như trước)
- [x] **Verify thật, không chỉ code xong:** backend `tsc --noEmit` sạch; curl với 3 tài khoản test tạm (vi/ja/ko, xoá ngay sau khi test) xác nhận cả 10/10 model trả đúng nội dung theo ngôn ngữ viewer qua `/catalog/*`; frontend `tsc -b`/`oxlint`/`build` sạch. Playwright end-to-end: đăng ký tài khoản mới → đúng hiện `LanguagePicker` trước tiên (chưa từng có tài khoản nào bỏ qua được bước này) → chọn 日本語 → `CreateChild`/`Onboarding`/`Home`/`More` đều hiện tiếng Nhật đúng → vào Word Catch thấy prompt "犬" (chó, tiếng Nhật) → qua Cài đặt đổi sang 한국어 ngay giữa phiên (không cần đăng xuất) → quay lại Word Catch thấy đổi ngay thành "개" (tiếng Hàn) — xác nhận đổi ngôn ngữ giữa chừng phiên hoạt động đúng, không cần tải lại app. Đã xoá sạch mọi tài khoản test tạo ra trong lúc verify
- **Việc còn tồn:**
  - `Topics.tsx`/`SrsCard.tsx` **chưa từng nối với API `Vocab` thật** (dùng mảng cứng trong code) — lỗi có sẵn từ trước, không phải do việc này gây ra; đã thêm `meaningJa`/`meaningKo` cho `Vocab` và seed đủ dữ liệu, nhưng sẽ KHÔNG hiển thị được cho tới khi 2 trang này được nối API thật — ghi nhận riêng, chưa làm
  - `Question`/`Lesson` (bài học Forest) **cố tình bỏ qua** — `hint` vốn đã lẫn lộn tiếng Việt/Anh không nhất quán trong seed, đọc như hướng dẫn UI hơn là nội dung học, không đưa vào lần này
  - Nội dung tự tạo của phụ huynh ("Nội dung của tôi") vẫn chỉ tiếng Việt — nếu phụ huynh dùng tiếng Nhật/Hàn tạo nội dung riêng, con họ vẫn thấy tiếng Việt (rơi về mặc định) — chấp nhận được vì đây không phải nội dung hệ thống, nhưng có thể cân nhắc cho phụ huynh viết bằng đúng ngôn ngữ tài khoản của họ sau này
  - **Chấm điểm phát âm % theo giọng bản xứ (Echo Parrot)** — user hỏi riêng, đã giải thích 2 hướng (A: ghi âm thật + model phoneme AI riêng, cần dựng thêm service Python; B: dùng độ tin cậy nhận diện có sẵn của máy, nhẹ hơn nhiều) — **chưa làm hướng nào**, đang chờ user chọn hướng

### Đổi ảnh pet cũ → pet mới (2026-08-25)
- [x] Xoá 40 ảnh pet cũ (icon phẳng đơn giản, ví dụ `buddy.png` 282×315) — thay bằng 40 ảnh `-v2.png` có sẵn trong repo (bản vẽ chi tiết hơn hẳn, ví dụ 1165×1350) đổi tên đè lên đúng tên file cũ, nên **không cần sửa code ở bất kỳ trang nào khác** — mọi nơi (Login/CreateChild/Onboarding/FightRoom/Story/Rank/WordCatch/`petSrc()`, `Pet.imagePath` seed ở backend...) đều tham chiếu `/pets/<key>.png` không đổi tên
  - Dọn `PetPortrait.tsx` — bỏ hẳn danh sách `V2_PETS` và logic rẽ nhánh chọn ảnh v2/thường (không cần nữa vì giờ chỉ còn đúng 1 bộ ảnh); không đụng 3 thư mục `eggs/`, `evolution/`, `sad/` (ảnh trứng/tiến hoá/tâm trạng riêng, không nằm trong phạm vi yêu cầu)
  - Verify bằng Playwright: không có `<img>` nào bị vỡ (naturalWidth 0) ở Onboarding/Home/Profile/Đọc truyện; xem trực tiếp screenshot xác nhận đúng ảnh mới
  - **Phát hiện + sửa luôn:** sau khi đổi ảnh, user báo "Đọc truyện vẫn ảnh cũ" — hoá ra do app cài trên điện thoại **chưa được `cap:sync`/build lại** kể từ lúc đổi ảnh (bundle native vẫn giữ file cũ 282×315 dù nguồn `frontend/public/` đã đổi) — không phải lỗi code, chỉ cần build+cài lại lên máy thật là đúng

### Đổi tab "World" → "Game", dồn toàn bộ mini-game về 1 chỗ (2026-08-25)
User yêu cầu thay icon/tab "World" (dẫn tới bản đồ 6 vùng Forest/Town/Beach/School/
Castle/Space để chọn vùng học) bằng 1 tab "Game" dẫn thẳng tới danh sách mini-game,
đồng thời dọn hết mục game ra khỏi "More". Đã hỏi rõ phạm vi trước khi làm (bỏ hẳn
World Map hay giữ lại, tên/icon tab mới, đúng những mục nào tính là "game").
- [x] **Bỏ hẳn `WorldMap.tsx`** (đã xoá file) — nút "Học ngay" ở Home vẫn vào thẳng bài học Forest như cũ (từ trước đã không đi qua World Map), nên không mất đường học chính; chỉ mất tính năng "chọn vùng cụ thể để học" (chấp nhận theo yêu cầu). Dọn theo: bỏ `selectedZone`/`ZONE_KEYS` state ở `App.tsx`, thay bằng hằng số `DEFAULT_LESSON_WORLD_KEY = "forest"` cố định cho effect tải bài học
- [x] Tab mới: **🎮 Game** (`BottomTabs.tsx`, `types/nav.ts`'s `NavTab`) — dẫn tới `pages/GameHub.tsx` (file mới, y hệt khuôn `More.tsx`: lưới ô vuông + `BottomTabs` bên dưới)
- [x] `GameHub.tsx` gồm đúng 10 mục chuyển ra khỏi `More.tsx`: Đấu trường, Chủ đề (người lớn), Memory Match, Word Catch, English Shop, English Home, Word RPG, Word Train, English Detective, Vẹt Con Tập Nói — `More.tsx` giờ chỉ còn 11 mục thuần quản lý/tiện ích (Parent Area, Chăm sóc thú cưng, Xếp hạng, Nhiệm vụ & Streak, Đọc truyện, Nội dung của tôi, Hồ sơ & Thành tích, Premium, Thông báo, Cài đặt, Trạng thái hệ thống)
- [x] Thêm bản dịch Anh/Nhật/Hàn cho 2 chuỗi mới ("Trò chơi", "Chọn 1 trò chơi để bắt đầu luyện tập") vào `translations.ts` — verify parity script vẫn khớp 100% cả 3 dictionary
- [x] Verify: `tsc`/`oxlint`/`build` sạch; Playwright xác nhận tab Game hiện đủ 10 ô đúng nội dung, More không còn ô game nào, "Học ngay" từ Home vẫn hoạt động bình thường sau khi bỏ World Map
- **Phát hiện phụ (không liên quan, đã tự sửa):** trong lúc test phát hiện `admin@gmail.com` bị sót ở `language: "en"` từ 1 lần test trước đó của tôi (không phải do user đổi) — đã trả về `"vi"` cho đúng trạng thái ban đầu
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này

### Từ điển offline + Từ đã lưu (Saved Words) — SRS thật, gợi ý ở Nội dung của tôi (2026-08-25)
User đề xuất: 5000 từ bundle sẵn trong app (tải app = có luôn, search được cả khi
offline), nút "lưu" xây từ điển cá nhân, gợi ý lại từ đó ở "Nội dung của tôi" và
"Chủ đề" (SRS, trước đây 100% mock). Đã hỏi rõ 3 điểm trước khi làm (tốc độ tăng số
từ / chỗ đặt lối vào / số phận 6 thẻ Chủ đề giả) — chọn: xây kiến trúc đầy đủ ngay,
seed thật ~500 từ trước rồi tăng dần lên 5000 sau (chỉ cần thêm dòng vào JSON, không
đổi code); thêm 1 ô trong More; thay hẳn 6 thẻ giả bằng dữ liệu thật.
- [x] **Từ điển là 1 file JSON tĩnh, không phải bảng DB mới** — tận dụng việc Capacitor
  đã đóng gói toàn bộ `frontend/public/` vào app native (y hệt cách 101MB ảnh pet đã
  "offline" từ trước, không cần service worker/IndexedDB): `frontend/public/dictionary/
  words.json`, **488 từ** (word/phonetic IPA/vi/ja/ko/topic, 22 chủ đề) — tự dịch
  toàn bộ (không gọi API ngoài), tái dùng lại các từ đã dịch từ `seed.ts` trước đó để
  đỡ công. `lib/dictionary.ts` fetch 1 lần, cache trong bộ nhớ — search sau đó là lọc
  JS thuần, không gọi mạng lần nào nữa (đã verify bằng Playwright network log)
- [x] Danh sách từ đã lưu **có persist thật** (đồng bộ giữa các máy, sống sót qua cài
  lại app) — model mới `SavedWord` (`childId` + `word`, unique theo cặp) + service/
  routes `GET/POST/DELETE /children/:id/saved-words`, theo đúng khuôn
  `getOwnedChildOrThrow` các service khác đang dùng
- [x] Màn hình mới **`Dictionary.tsx`** ("Từ điển", ô mới trong `More.tsx`): tìm kiếm +
  tab "Từ đã lưu", mỗi từ có nút loa (TTS có sẵn) + ngôi sao lưu/bỏ lưu (optimistic
  update, rollback nếu lỗi mạng)
- [x] **`Topics.tsx` viết lại hoàn toàn** — bỏ 6 thẻ chủ đề giả (Travel/Business/Daily
  life/Food/Health/IELTS 700) và bảng "Lịch ôn tập" giả, thay bằng 1 thẻ thật "Từ đã
  lưu" hiện đúng số từ đã lưu, bấm vào thì mở SRS thật với đúng danh sách đó
- [x] **`SrsCard.tsx` viết lại** — bỏ 5 từ Travel giả cứng, nhận danh sách từ thật qua
  props (`words: DictionaryWord[]`) từ `Topics.tsx`; giữ nguyên UI/logic chấm điểm
  "Khó/Ổn/Dễ" nhưng nói rõ đây **chỉ là cosmetic trong phiên chơi**, không lưu lịch SRS
  thật xuống DB (giống mọi mini-game nhẹ khác trong app, không phải thiếu sót)
- [x] `App.tsx`: thêm state `reviewWords` chuyển danh sách thật từ `Topics` sang
  `SrsCard` (giống khuôn `lessonQuestions`/`pickedLessonId` sẵn có); `MyContent`/
  `Topics`/`Dictionary` đều nhận thêm `childId`
- [x] **Gợi ý ở "Nội dung của tôi"**: `MiniGameManager` (form thêm từ Memory Match) và
  `WordCatchManager` (form thêm lượt Word Catch) hiện 1 hàng chip từ đã lưu ngay trên
  form nhập — bấm 1 chip tự điền `wEn`+`wVi` (Memory Match) hoặc `rVi` + set ô đáp án
  đầu tiên (Word Catch), lấy dữ liệu trực tiếp từ từ điển offline đã bundle
- [x] Thêm bản dịch Anh/Nhật/Hàn cho 14 chuỗi UI mới vào `translations.ts` — verify
  script parity vẫn khớp 100% cả 3 dictionary, 0 key trùng
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl trực tiếp `saved-words` (tạo/xoá, dọn sạch sau khi test); Playwright end-to-end
  đầy đủ: mở Từ điển từ More → tìm "cat" (xác nhận **0 request mạng** cho search, chỉ
  1 lần fetch JSON ban đầu) → lưu "dog"+"cat" → mở Chủ đề thấy đúng "2 từ đã lưu" →
  ôn SRS thật ra đúng thẻ "dog/chó" → mở Nội dung của tôi thấy chip gợi ý ở cả Memory
  Match và Word Catch, bấm điền đúng — dọn sạch toàn bộ dữ liệu test (2 chủ đề tạm,
  2 từ đã lưu) khỏi tài khoản demo sau khi xong
- **Việc còn tồn:** mới có 488/5000 từ (giai đoạn 1 theo kế hoạch đã thống nhất — tăng
  dần bằng cách thêm dòng vào `words.json`, không cần đổi code); bảng `Vocab`/route
  `/catalog/vocab*` có sẵn từ trước (200 từ, seed nhưng chưa màn nào dùng) cố tình
  **không đụng tới** — việc có nên gộp 2 nguồn dữ liệu từ vựng lại là quyết định
  riêng, để dành sau tránh phình phạm vi
- **Đã build/cài lại lên điện thoại thật** cùng lúc với tính năng "Đổi tab World →
  Game" ở trên (cùng 1 lần build)

### Thêm câu ví dụ vào Từ điển — user phản hồi "sơ sài" (2026-08-26)
User góp ý màn Từ điển thiếu ví dụ câu (chỉ có từ/phiên âm/nghĩa). Đã tự soạn thêm,
không gọi API dịch ngoài, giữ đúng phong cách câu ngắn gọn phù hợp trẻ nhỏ (A1).
- [x] Thêm 2 field mới `example` (câu tiếng Anh ngắn) + `exampleVi` (dịch tiếng Việt)
  cho **toàn bộ 488/488 từ** trong `words.json` — tự soạn từng câu theo đúng ngữ cảnh
  từ đó (không dùng template rập khuôn 1 câu cho tất cả), verify bằng script khớp
  100% theo key `word`, không thiếu/thừa từ nào
  - `ja`/`ko` cho câu ví dụ **chưa có** (mới chỉ có ý nghĩa từ đơn được dịch 3 thứ
    tiếng, câu ví dụ mới chỉ có Anh + Việt) — `exampleFor()` ở `lib/dictionary.ts`
    tạm fallback về bản tiếng Việt cho cả người dùng Nhật/Hàn, cùng kiểu phased-growth
    như số lượng từ, ghi rõ trong doc comment để không quên
- [x] `Dictionary.tsx`: mỗi hàng từ giờ hiện thêm 1 dòng ví dụ (in nghiêng, tiếng Anh
  — tiếng Việt) dưới dòng nghĩa
- [x] `SrsCard.tsx`: khôi phục lại phần câu ví dụ ở mặt sau thẻ khi lật (đã bị bỏ lúc
  viết lại thẻ dùng dữ liệu thật vì schema cũ chưa có `example`, giờ thêm lại đúng ý)
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright xác nhận Từ điển hiện đúng ví
  dụ song ngữ, SrsCard hiện đúng ví dụ khi lật thẻ "dog" — dọn sạch dữ liệu test khỏi
  tài khoản demo sau khi xong
- **Việc còn tồn:** ví dụ tiếng Nhật/Hàn riêng (không dùng chung bản tiếng Việt) —
  để dành cùng đợt mở rộng 488 → 5000 từ sau; chưa build/cài lại app lên điện thoại
  thật với thay đổi này

### Word Train Adventure — 9 chủ đề mock mới, mỗi chủ đề 500 "từ", chơi ngẫu nhiên (2026-08-26)
User yêu cầu thêm chủ đề mock cho Word Train, mỗi chủ đề 500 từ, hiện ngẫu nhiên khi
chơi. Word Train vốn đã dùng dữ liệu thật (`WordTrainTopic`/`WordTrainRound`, không
phải mock từ đầu) — chỉ có 2 chủ đề hệ thống (Chuyến Tàu Động Vật/Đồ Ăn, 6 chặng mỗi
chủ đề, có sẵn từ trước). Thay vì tự tay soạn 4500 câu đố, đã **sinh tự động bằng
code** từ chính 488 từ trong Từ điển offline vừa làm (word/vi/ja/ko/example/exampleVi
đều đã có sẵn — tận dụng lại, không dịch thêm lần nào).
- [x] `backend/prisma/seed.ts`: đọc trực tiếp `frontend/public/dictionary/words.json`
  (đường dẫn tương đối qua `fileURLToPath`/`path.join`, có ghi chú rõ sự phụ thuộc
  chéo giữa 2 package), gom 22 chủ đề nhỏ của Từ điển thành **9 chủ đề Word Train
  lớn hơn** (mỗi từ trong 488 từ dùng đúng 1 lần, không trùng/thiếu): Vương Quốc Muông
  Thú, Thế Giới Ẩm Thực, Mái Ấm Gia Đình, Trường Học & Nghề Nghiệp, Thiên Nhiên Kỳ
  Thú, Sắc Màu & Con Số, Cơ Thể & Trang Phục, Phương Tiện & Sở Thích, Cảm Xúc & Hành
  Động
  - Mỗi chủ đề sinh đúng **500 rounds**: 1 round "scramble" (ghép câu) từ câu ví dụ
    có sẵn của mỗi từ (giữ nguyên số lượng, luôn đủ vì < 500), phần còn lại là round
    "fill" (đoán chữ cái còn thiếu) sinh từ chính từ đó — mỗi vị trí chữ cái trong từ
    là 1 round riêng, xoay vòng bộ 2 chữ nhiễu (cùng nhóm nguyên âm/phụ âm với đáp án,
    giống style round có sẵn) để không lặp y hệt nhau qua các vòng lặp
  - Từ nhiều-từ (`ice cream`, `T-shirt`, `police officer`...) bị bỏ qua ở phần "fill"
    (không có kiểu đoán-1-chữ-cái sạch khi từ có dấu cách/gạch nối) nhưng vẫn có
    round "scramble" riêng
  - Round "scramble" mới chỉ có `vi` (từ `exampleVi`), `ja`/`ko` để `null` — API
    `pickLang()` tự fallback về `vi` cho người dùng Nhật/Hàn (đúng hành vi có sẵn của
    toàn bộ app, không cần code thêm) — cùng giới hạn "chưa có ví dụ Nhật/Hàn" đã ghi
    ở mục Từ điển phía trên
  - Verify: script kiểm tra riêng xác nhận đúng 488/488 từ được dùng, đúng 9×500=4500
    rounds, mọi round "fill" hợp lệ (đáp án luôn có trong `options`, không trùng chữ)
- [x] **"Show random"**: `WordTrain.tsx` thêm `sampleWordTrainSession()` — mỗi lần mở
  1 chủ đề (và mỗi lần bấm "Chơi lại"), rút ngẫu nhiên 8 round "fill" + 2 round
  "scramble" từ pool của chủ đề đó ra chơi (chủ đề cũ chỉ có 6 round thì coi như xáo
  lại đúng 6 round đó, không đủ 10) — giữ nguyên trải nghiệm "1 chuyến tàu N chặng" cũ,
  chỉ đổi NGUỒN các chặng đó lấy từ đâu
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl trực tiếp xác nhận 11 chủ đề (2 cũ + 9 mới) đều trả đúng dữ liệu; Playwright
  mở "Thế Giới Ẩm Thực" xác nhận hiện đúng "Chặng 1/10" với từ/gợi ý hợp lệ lấy từ pool
  500 (thấy "PEPPER/quả ớt chuông" và "BANANA/quả chuối" ở 2 lần mở khác nhau, xác
  nhận có random thật)
- **⚠️ Đã đổi kiến trúc ngay sau đó** (xem mục "Word Train mock — chuyển hẳn sang sinh
  ở FE" bên dưới, cùng ngày): 9 chủ đề này ban đầu lưu ở DB + gọi qua API như mô tả ở
  trên, nhưng vì dữ liệu gốc vốn đã nằm sẵn trong app (bundle Từ điển) nên đã chuyển
  hẳn sang sinh trực tiếp ở FE, bỏ khỏi DB/API — phần mô tả DB/API ở trên chỉ còn giá
  trị lịch sử, code thật hiện tại xem `frontend/src/lib/wordTrainMock.ts`

### Word Train — random có chủ đích: đúng ngay thì bớt lặp lại, sai thì ưu tiên ôn lại (2026-08-26)
User góp ý "random toàn bộ" (bản đầu) chưa hợp lý — nên nhớ từ nào bé đã trả lời đúng
ngay từ đầu (không cần lặp lại) và ưu tiên đưa lại những từ đã trả lời sai (cần học
lại), đồng thời hiện rõ "10/500 chặng" ở thẻ chủ đề thay vì chỉ "500 chặng".
- [x] `lib/wordTrainMastery.ts` (mới) — bộ nhớ "đã thuộc" theo từng chủ đề, lưu trong
  `localStorage` của máy (cố tình KHÔNG đồng bộ qua backend — cùng mức "tiến độ chỉ
  mang tính cosmetic, sống trên máy" như cách `SrsCard.tsx` xử lý "Khó/Ổn/Dễ", vì đây
  vẫn là dữ liệu "mock" 500-round, chưa đáng để mở bảng DB riêng). Do 1 round không có
  id ổn định trả về từ API, định danh 1 round bằng chính nội dung của nó
  (`fill:WORD:blankIndex` hoặc `scramble:câu|đã|ghép`) — nghĩa là "đã thuộc chữ cái thứ
  2 của DOG" không phụ thuộc 2 chữ nhiễu đi kèm, đúng bản chất thứ cần nhớ
- [x] `FillRound`/`ScrambleRound`: theo dõi có bấm sai lần nào trước khi đúng không
  (`hadWrongRef`), báo lên qua `onSuccess(flawless: boolean)`; `WordTrainPlay` gọi
  `markRoundResult(topic.key, round, flawless)` — đúng ngay thì thêm vào "đã thuộc"
  (giảm khả năng gặp lại ở phiên sau), sai ít nhất 1 lần thì bỏ khỏi "đã thuộc" (kể cả
  nếu trước đó đã thuộc) để quay lại hàng chờ ôn tập
- [x] `sampleWordTrainSession()` đổi từ random thuần sang `pickWeighted()` — ưu tiên
  rút những round CHƯA thuộc trước, chỉ lấy thêm round đã thuộc khi không đủ số lượng
  cần (vd. bé đã thuộc gần hết pool, hoặc chủ đề nhỏ có sẵn)
- [x] Badge số chặng ở thẻ chủ đề đổi từ "{tổng} chặng" thành "{số đã thuộc}/{tổng}
  chặng" — **là số từ đã trả lời đúng ngay từ đầu, không phải độ dài 1 phiên chơi**
  (đọc thẳng `loadMasteredSet(tp.key).size` mỗi lần render, nên quay lại màn chọn chủ
  đề sau khi chơi là thấy số tăng ngay, không cần refresh) — vd. "0/500 chặng" lúc mới
  vào, tăng dần theo số từ bé đã thuộc; 2 chủ đề cũ hiện "{đã thuộc}/6"
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright dựng sẵn 1 "bộ giải" (khớp
  từ hiện trên các ô chữ với danh sách từ điển offline để suy ra đáp án đúng, không
  đoán mò) — xác nhận: trả lời đúng ngay từ đầu → `localStorage` lưu đúng
  `fill:CAKE:1`, badge tăng đúng từ "0/500" → "1/500" khi quay lại màn chọn chủ đề;
  trả lời sai 1 lần rồi mới đúng (CUCUMBER) → **không** được lưu vào "đã thuộc"
- **Việc còn tồn:** mastery chỉ sống trên 1 thiết bị (không đồng bộ tài khoản/nhiều
  máy) — nếu sau này muốn thật sự "spaced repetition" đa thiết bị cho Word Train thì
  cần 1 bảng backend riêng (giống ý tưởng `SavedWord` đã làm cho Từ điển), để dành
  quyết định sau; chưa build/cài lại app lên điện thoại thật với các thay đổi này

### Word Train mock — chuyển hẳn sang sinh ở FE, bỏ khỏi DB/API (offline 100%) (2026-08-26)
User hỏi đúng trọng tâm: 9 chủ đề mock đang lưu trong DB + gọi qua API thì không chơi
được khi mất mạng — trong khi dữ liệu gốc (Từ điển) đã nằm sẵn trong máy rồi, đi vòng
qua backend là thừa. Quyết định: chuyển việc SINH 9 chủ đề đó sang chạy thẳng ở FE.
- [x] `frontend/src/lib/wordTrainMock.ts` (mới) — copy y hệt logic sinh round từ
  `prisma/seed.ts` (nhóm 22 topic Từ điển → 9 chủ đề, sinh "fill"/"scramble" tới đúng
  500 round/chủ đề) nhưng chạy bằng `loadDictionary()` (đã bundle sẵn, xem
  `lib/dictionary.ts`) thay vì đọc file lúc seed. Điểm cải thiện thêm: dùng
  `meaningFor()`/`exampleFor()` nên giờ chọn đúng ngôn ngữ hiện tại (vi/ja/ko) thay vì
  luôn cố định tiếng Việt cho phần gợi ý
- [x] `WordTrain.tsx`: màn chọn chủ đề giờ ghép 2 nguồn — `listMockWordTrainTopics()`
  (đồng bộ, tức thì, không cần mạng) + `api.listWordTrainTopics()` (2 chủ đề hệ thống
  gốc + chủ đề admin/phụ huynh tự tạo, cần mạng). **9 chủ đề mock luôn hiện được** kể
  cả khi gọi API thất bại — lỗi mạng chỉ hiện 1 dòng ghi chú nhỏ, không chặn cả màn
  hình như trước. `openTopic()` rẽ nhánh: id bắt đầu bằng `mock:` thì gọi
  `getMockWordTrainTopic()` (không đụng mạng), còn lại mới gọi API như cũ
- [x] **Dọn khỏi backend**: xoá hẳn đoạn sinh dữ liệu mock khỏi `prisma/seed.ts` (revert
  về đúng 2 chủ đề hand-authored gốc), xoá 9 hàng `WordTrainTopic` (+ 4500
  `WordTrainRound` cascade theo) đã lỡ tạo trước đó khỏi DB thật đang chạy — seed lại
  xác nhận đúng "2 Word Train topics" như ban đầu
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl xác nhận API chỉ còn 2 chủ đề; Playwright **chặn hẳn mọi request tới
  `localhost:4000`** (mô phỏng mất mạng thật) rồi mở lại Word Train — 9 thẻ mock vẫn
  hiện đủ với đúng dòng ghi chú lỗi, mở 1 chủ đề vào chơi được bình thường, xác nhận
  **0 request nào tới `/catalog/word-train-topics/:id`** (chỉ có 1 lần gọi danh sách bị
  chặn, không có request nào cho nội dung round) — đúng nghĩa offline hoàn toàn
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này (đây
  là thay đổi đáng cài thử nhất trong các thay đổi gần đây vì trực tiếp trả lời câu hỏi
  "app có chơi được khi không có mạng không" của user)

### Đăng nhập Google / Facebook / Apple — phần code đầy đủ, chờ user điền credentials (2026-08-26)
3 nút Google/Facebook/Apple ở màn Đăng nhập trước giờ chỉ là UI trang trí (không có
`onClick`). User yêu cầu làm thật cả 3 cùng lúc, tự điền credentials vào `.env` sau.
Đã giải thích trước: mỗi bên cần tài khoản developer riêng (Google Cloud Console/Meta
for Developers/Apple Developer trả phí) mà chỉ user tạo được — phần này làm **toàn bộ
code**, hoạt động ngay khi điền đủ key thật vào `.env`, đã verify kỹ phần chưa cấu hình
không làm crash server hay vỡ UI.
- [x] **Schema**: `Parent.passwordHash` chuyển thành optional (tài khoản social-only
  không bao giờ đặt mật khẩu) + 3 cột `googleId`/`facebookId`/`appleId` (unique,
  optional) — migration `20260826051755_add_social_login` (tạo tay do môi trường
  non-interactive, `prisma migrate deploy` áp dụng bình thường)
- [x] `backend/src/lib/socialProviders.ts` (mới) — verify token thật với từng bên,
  không đụng DB:
  - **Google**: `google-auth-library`'s `verifyIdToken()` — kiểm chữ ký + `audience`
    khớp `GOOGLE_CLIENT_ID` (chấp nhận nhiều Client ID cách nhau dấu phẩy, vì web/iOS/
    Android thường có Client ID riêng)
  - **Facebook**: gọi `/debug_token` (dùng App Access Token `APP_ID|APP_SECRET`) để
    xác nhận access token đúng là cấp cho app này (không thể bỏ qua bước này — 1
    access token hợp lệ của app KHÁC vẫn "hợp lệ" nếu chỉ gọi `/me` suông), rồi mới
    gọi `/me` lấy id+email
  - **Apple**: `jose`'s `jwtVerify()` với JWKS công khai của Apple
    (`appleid.apple.com/auth/keys`) — chỉ verify chữ ký, KHÔNG cần private key/
    `APPLE_TEAM_ID`/`APPLE_KEY_ID` (những cái đó chỉ cần cho việc đổi authorization
    code lấy refresh token phía server, app này không làm bước đó)
  - Cả 3 hàm đều throw lỗi rõ ràng "chưa cấu hình" nếu thiếu biến `.env` tương ứng —
    **không crash cả server** lúc boot (khác `JWT_ACCESS_SECRET` vốn bắt buộc)
- [x] `auth.service.ts`'s `loginWithSocial(provider, token)` — verify token xong thì:
  tìm theo `<provider>Id` trước; nếu chưa có, tìm theo email (tài khoản đã đăng ký
  email/mật khẩu trước đó) để **liên kết** thêm social ID vào, giữ nguyên mật khẩu cũ;
  nếu cũng chưa có luôn thì tạo tài khoản mới không mật khẩu. `loginParent()` (email/
  mật khẩu) thêm nhánh báo rõ "tài khoản này đăng nhập bằng social, chưa có mật khẩu"
  thay vì lỗi `argon2.verify()` mơ hồ khi `passwordHash` là `null`
- [x] Route mới `POST /auth/google`, `/auth/facebook`, `/auth/apple` (cùng rate-limit
  với `/login`) — body `{ token }` (tên field giống nhau cả 3, vì bên nào đã biết qua
  path), trả về đúng y hệt shape `login`/`register` (`{ parent, accessToken,
  refreshToken }`) nên frontend dùng lại được toàn bộ flow xử lý sau đăng nhập có sẵn
- [x] `frontend/src/lib/socialAuth.ts` (mới) — load SDK web chính chủ của từng bên lúc
  cần (không bundle sẵn, không chậm trang login khi chưa bấm): Google Identity
  Services (render nút thật ẩn đi rồi tự click hộ, vì GIS không có API "mở popup theo
  yêu cầu" cho nút tự thiết kế), Facebook JS SDK (`FB.login()`), Apple "Sign in with
  Apple JS" (`usePopup: true`, không rời trang)
- [x] `Login.tsx`: 3 nút Google/Apple/Facebook giờ gọi thật `signInWith<Provider>()` →
  lấy token → gọi `api.loginWithGoogle/Facebook/Apple(token)` → xử lý y hệt luồng
  login thường (lưu token, `onAuthenticated`) — dùng lại đúng state `loading`/`msg`
  đã có sẵn, không thêm UI mới
- [x] `.env`/`.env.example` (backend) + `.env` mới (frontend, dùng chung cho cả
  dev/mobile vì credentials không đổi theo môi trường) — đã điền sẵn tên biến + chú
  thích lấy ở đâu, để trống chờ user điền: `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`/
  `FACEBOOK_APP_SECRET`, `APPLE_CLIENT_ID` (backend) và `VITE_GOOGLE_CLIENT_ID`,
  `VITE_FACEBOOK_APP_ID`, `VITE_APPLE_CLIENT_ID`/`VITE_APPLE_REDIRECT_URI` (frontend)
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  login/register email-mật khẩu vẫn hoạt động bình thường (không có regression từ việc
  đổi `passwordHash` thành optional); curl xác nhận cả 3 route "chưa cấu hình" trả lỗi
  503 rõ ràng thay vì crash; script test riêng xác nhận đúng logic tạo mới/tìm lại/
  liên kết tài khoản (tạo mới không trùng, gọi lại cùng `googleId` ra đúng 1 hàng,
  liên kết vào tài khoản email có sẵn giữ nguyên mật khẩu cũ) — dọn sạch dữ liệu test;
  Playwright xác nhận cả 3 nút hiện đúng thông báo "chưa cấu hình (thiếu VITE_...)"
  thay vì lỗi JS vỡ trang khi chưa có credentials thật
- **Việc còn tồn (quan trọng):**
  - Chưa test được đầu-cuối thật vì chưa có credentials — user cần tự tạo tài khoản
    developer ở cả 3 nền tảng rồi điền vào `.env` (backend) + `.env` (frontend, biến
    `VITE_*`), sau đó **phải restart** dev server backend (biến môi trường không tự
    load lại như sửa code) và frontend (Vite cần restart khi thêm file `.env` mới)
  - **Apple bắt buộc dùng flow native trên iOS thật** (`AuthenticationServices`/
    `ASAuthorizationController`) để được App Store duyệt, không phải flow web JS này —
    bản hiện tại chỉ chạy tốt trên web/trình duyệt; nâng cấp lên plugin Capacitor
    native (vd `@capacitor-community/apple-sign-in`) là việc riêng, cần user đã bật
    "Sign in with Apple" trên Apple Developer (tài khoản trả phí) trước
  - Google/Facebook cũng có thể nâng cấp lên plugin native sau để có UX chọn tài khoản
    kiểu hệ điều hành thay vì popup web, nhưng không bắt buộc như Apple
  - Facebook cần Meta duyệt app mới đăng nhập được với user thật ngoài danh sách test
    (chế độ phát triển chỉ cho phép tài khoản test/admin của chính app đó)

### Premium — enforce thật 3/5 quyền lợi, báo cáo rõ 2 cái còn lại (2026-08-26)
User chọn hạng mục "Premium: enforce thật các quyền lợi" trong danh sách việc còn tồn.
Rà lại cả 5 quyền lợi quảng cáo ở `Premium.tsx` — chỉ 3 cái thực sự làm được thật trong
phạm vi app hiện có (không có payment gateway/ad SDK thật), 2 cái còn lại báo cáo rõ vì
sao chưa làm thay vì giả vờ sửa.
- [x] **"Không quảng cáo"**: `components/ui/AdSlot.tsx` vốn đã có sẵn prop `premium`
  (ẩn hẳn nếu `true`) nhưng nơi DUY NHẤT dùng nó — `Lesson.tsx` — gọi `<AdSlot>` mà
  KHÔNG truyền `premium` bao giờ, nên quảng cáo demo hiện ra bất kể tài khoản có
  Premium hay không. Thêm prop `isPremium` xuyên suốt `Lesson.tsx` → `App.tsx`
  (`parent.isPremium`), giờ mua Premium là quảng cáo biến mất thật (ad chỉ hiện ở màn
  kết quả sau khi hoàn thành bài học, không phải lúc đang làm câu hỏi)
- [x] **"+2 pet Legendary mỗi tháng"**: trước đó hoàn toàn không có code nào cho việc
  này (mô tả trong `PERKS` còn ghi nhầm "Nhận gem thưởng hằng tháng" dù tiêu đề nói
  pet). Thêm thật:
  - `Progress.lastLegendaryGrantAt` (DateTime?, migration mới) — idempotent theo
    THÁNG, cùng khuôn "action rõ ràng qua nút bấm, không tự động ngầm" như
    `checkIn()`/`lastCheckinDate` đã có sẵn cho "Điểm danh" hằng ngày
  - `claimMonthlyLegendaryPets()` (service) + `POST /children/:id/legendary-claim` —
    chặn 403 nếu chưa Premium, ngẫu nhiên 2 pet Legendary CHƯA sở hữu (hết cả 8 con thì
    báo rõ thay vì lỗi), tạo luôn `PetStats` cho pet mới như lúc mua pet thường
  - Nút "🐲 Nhận pet Legendary tháng này" mới trên `Premium.tsx` (chỉ hiện khi đã
    Premium) — sửa luôn câu mô tả perk cho khớp thực tế
- [x] **"Khôi phục mua hàng"**: trước đó là nút chết hoàn toàn (không `onClick`). Chưa
  có payment gateway thật nên không có gì để "khôi phục" đúng nghĩa — thay vào đó gọi
  lại `GET /auth/me` để kiểm tra trạng thái Premium THẬT hiện tại của tài khoản và báo
  cho user biết, gần nhất có thể với hành vi thật mà không giả vờ có payment gateway
- [x] **Dọn dữ liệu test cũ phát hiện tình cờ**: lúc test thấy world Forest có thêm 4
  bài học rác "bài 1"–"bài 4" (0 câu hỏi, tạo từ 2026-08-20 — sót lại từ lúc test tính
  năng "Nội dung của tôi"/giới hạn Premium ở 1 đoạn rất sớm của phiên làm việc này,
  chưa từng được dọn) — đã xoá qua `DELETE /my/lessons/:id`
- [x] Thêm bản dịch Anh/Nhật/Hàn cho 6 chuỗi UI mới — verify parity script khớp 100%,
  0 key trùng
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl xác nhận đủ 3 kịch bản (chưa Premium → 403; claim lần 1 → nhận đúng 2 pet;
  claim lần 2 cùng tháng → `alreadyClaimed`); Playwright xác nhận UI thật: nút claim
  chỉ hiện khi Premium, bấm ra đúng thông báo "Đã nhận 2 pet Legendary mới!", "Khôi
  phục mua hàng" báo đúng trạng thái Premium hiện tại — dọn sạch mọi thay đổi khỏi tài
  khoản demo sau khi test (tắt Premium, trả lại đúng 21 pet cũ, xoá `PetStats` mới tạo)
- **2 quyền lợi còn lại, báo rõ thay vì giả vờ sửa:**
  - **"Mở toàn bộ 6 vùng"** — claim này giờ **không còn ý nghĩa gì để enforce**: từ lúc
    `WorldMap.tsx` bị xoá (đổi sang tab Game), không còn màn hình nào trong app cho
    chọn/mở khoá 1 world cụ thể nữa — `unlockedWorlds` vẫn được lưu ở `Progress` nhưng
    không ai đọc nó để gate bất cứ thứ gì (`listActiveWorlds()` trả về tất cả world,
    không lọc theo unlock, cho mọi tài khoản). Sửa "thật" claim này nghĩa là phải dựng
    lại 1 màn chọn world — đi ngược lại quyết định đơn giản hoá vừa làm, nên không tự
    ý làm; đề xuất: đổi hẳn nội dung perk này sang thứ có thật, hoặc bỏ hẳn
  - **"Báo cáo phụ huynh chi tiết"** — `ParentArea.tsx` **toàn bộ là mock**, kể cả bản
    "cơ bản" free tier (biểu đồ, hoạt động, từ vựng cần ôn đều là số liệu cứng, không
    có dòng nào đọc dữ liệu thật) — không phải thiếu mỗi bản "chi tiết", mà thiếu từ
    gốc. Enforce thật cần xây hẳn hạ tầng theo dõi mới (log thời gian học mỗi phiên,
    lịch sử đúng/sai từng từ...) — quy mô lớn hơn hẳn phạm vi "enforce 1 quyền lợi",
    để dành làm riêng nếu user muốn
  - ("Tải bài học offline" tạm không đụng tới — app hiện chỉ có đúng 1 bài học thật
    (Forest, 5 câu hỏi) nên xây tính năng tải-offline lúc này giá trị thấp, chưa có gì
    nhiều để "tải")

### Sửa lỗi: màn "Nhiệm vụ hôm nay" không điểm danh/nhận thưởng được (2026-08-26)
User báo bug: bấm "Điểm danh" hoặc "Nhận" ở 1 nhiệm vụ đều báo lỗi server chung chung.
- **Nguyên nhân gốc**: `coins` là cột Postgres `integer` (32-bit, tối đa
  2.147.483.647) — tài khoản demo `admin@gmail.com` được seed sẵn **đúng bằng** giá
  trị tối đa này (`prisma/seed.ts`'s "unlimited coin cho testing") từ trước. Bất kỳ
  thao tác CỘNG THÊM coin nào (điểm danh, nhận thưởng nhiệm vụ, thắng Đấu trường) đều
  làm giá trị vượt trần int32 → Postgres từ chối UPDATE → lỗi 500 chung chung (không
  crash cả server, nhưng lỗi ra không rõ nguyên nhân nếu chỉ nhìn thông báo cho user)
- **2 phần sửa:**
  - Đổi số coin seed cho tài khoản admin từ đúng-trần-int32 xuống `999.000.000` (vẫn
    "vô hạn" để test, còn dư ~1.1 tỷ trước khi chạm trần lại) — `ADMIN_COINS` trong
    `seed.ts`, kèm sửa trực tiếp 2 hàng `Progress` đang bị kẹt trong DB thật (không đợi
    seed lại)
  - **Chặn tận gốc, áp dụng cho MỌI tài khoản chứ không riêng demo**: thêm
    `clampToInt32()` (`progress.service.ts`, export dùng chung) — áp vào cả 3 chỗ có
    "cộng thêm coin": `checkIn()`, `claimQuest()` (đổi từ `{ increment }` atomic sang
    đọc-rồi-ghi-có-clamp, an toàn vì đã chặn double-claim bằng cờ `claimed` từ trước),
    và `liveRoomManager.ts`'s 2 chỗ trả thưởng thắng Đấu trường (1v1 lẫn phòng đông) —
    dù một tài khoản thật gần như không bao giờ chạm trần này qua chơi bình thường,
    vẫn chặn phòng hờ thay vì chỉ sửa mỗi seed data
- [x] Phát hiện thêm (không liên quan bug chính, tự sửa luôn): lúc debug thấy lại 3
  tiến trình `tsx watch` chồng chéo (đúng loại lỗi CORS/stale-process đã gặp đầu
  phiên) khiến cổng 4000 tranh chấp liên tục — đã kill hết, chỉ chạy đúng 1 tiến trình
- [x] Verify: backend `tsc --noEmit` sạch; curl xác nhận cả điểm danh lẫn nhận thưởng
  nhiệm vụ hoạt động lại bình thường (coin tăng đúng số, không còn lỗi 500); Playwright
  xác nhận qua UI thật — màn "Nhiệm vụ hôm nay" điểm danh hiện đúng "đã điểm danh hôm
  nay", bấm "Nhận" ở nhiệm vụ hiện đúng thông báo "+25 coin", số coin hiển thị tăng
  đúng qua từng bước

### Phối pet (fusion) + đường cong kinh nghiệm lên level dạng cấp số nhân (2026-08-26)
User yêu cầu: 3 Common max level → 1 trứng Rare, 5 Rare max level → 1 trứng Epic,
9 Epic max level → 1 trứng Legendary (trứng nở random khi phối xong), và đổi đường
cong kinh nghiệm lên level pet sang dạng cấp số nhân thay vì cộng dồn phẳng như cũ.
Đã hỏi rõ trước khi làm (số "9 pet Epic" tưởng vô lý vì catalog chỉ có 8 Epic — hoá ra
hợp lý nhờ quyết định thứ 2: cho phép sở hữu "trùng bản" pet dùng làm nguyên liệu
phối, không cần từng con trùng đều tự nuôi lên max).
- [x] **Đường cong XP mới (`petStats.service.ts`)**: đổi từ `XP_PER_LEVEL = 100` cộng
  phẳng sang cấp số nhân `xpToReachNextLevel(level) = 50 × 1.12^(level-1)` — lên tới
  level 30 giờ cần ~10.700 XP tổng (so với 2.900 cũ, ~3.7 lần khó hơn), tăng dần đúng
  kiểu "level đầu dễ, level cuối cần đầu tư thật" như các game khác — hợp lý vì giờ
  "max level" là điều kiện cổng cho việc phối pet, cần có ý nghĩa thật. Sửa luôn mô tả
  vật phẩm "Bánh tăng cấp" (bỏ câu "tương đương 3 cấp" không còn đúng với đường cong
  mới ở level cao)
- [x] **"Trùng bản là nguyên liệu, không cần tự nuôi riêng"**: vì `unlockedPets` vốn
  chỉ lưu MỖI PET 1 LẦN (không có khái niệm sở hữu nhiều bản sao), 1 lần phối ra
  trúng pet ĐÃ sở hữu rồi thì tự động quy đổi thành **1 "mảnh ghép"** (`shard`) đúng
  bậc rarity vừa ra — mảnh ghép này dùng thay thế cho pet-max-level thật ở lần phối
  SAU (ưu tiên tiêu mảnh ghép trước, đỡ tốn pet thật). Thêm 3 cột `commonShards`/
  `rareShards`/`epicShards` vào `Progress` (migration mới) — không có cột Legendary
  vì không công thức nào tiêu pet Legendary để phối lên nữa; ra trúng Legendary trùng
  thì thưởng 500 coin thay vì mảnh ghép (không có bậc nào cao hơn để mảnh ghép đó dùng)
- [x] `backend/src/services/petFusion.service.ts` (mới) — `fusePets(childId, parentId,
  rarity)`: gộp pet max-level (ưu tiên) + mảnh ghép cùng bậc đủ số lượng cần → xoá các
  pet bị tiêu khỏi `unlockedPets` + xoá `PetStats` tương ứng → random 1 pet trong catalog
  bậc kế tiếp → cộng vào `unlockedPets` (pet mới) hoặc quy đổi mảnh ghép/coin (trùng) —
  toàn bộ trong 1 `$transaction`. Route mới `POST /children/:id/pets/fuse` (body
  `{ rarity: "Common"|"Rare"|"Epic" }`)
- [x] `PetCollection.tsx` — panel "Phối pet" mới (3 thẻ Common→Rare/Rare→Epic/
  Epic→Legendary) ngay dưới hàng filter rarity, mỗi thẻ tự tính số pet-max-level +
  mảnh ghép đang có (client-side, dựa `petStatsById`/`owned` đã có sẵn) để hiện
  "2/3 sẵn sàng" và bật/tắt nút "Phối ngay" — bấm xong hiện thông báo pet vừa ra
  (mới hẳn / trùng → mảnh ghép / trùng Legendary → coin)
- [x] Thêm bản dịch Anh/Nhật/Hàn cho 7 chuỗi UI mới — verify parity script khớp
  100%, 0 key trùng (1 false-positive của script do key "Phối" chứa ký tự Unicode,
  không phải thiếu thật — đã kiểm tra tay bằng grep)
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl test kỹ cả 3 nhánh (đủ pet max-level thuần, trộn pet+mảnh ghép, thiếu nguyên
  liệu → lỗi 400 rõ ràng, rarity không hợp lệ → lỗi validation) — xác nhận đúng: xoá
  đúng pet bị tiêu + `PetStats` liên quan, cộng đúng mảnh ghép khi trùng; Playwright
  xác nhận qua UI thật (panel hiện đúng "2/3" rồi "3/3", nút bật/tắt đúng lúc, bấm
  "Phối ngay" ra đúng "Đã có Nimbus rồi — nhận thêm 1 mảnh ghép Rare!", pet bị tiêu
  hiện lại thành "chưa mở khoá" trong lưới) — dọn sạch toàn bộ dữ liệu test khỏi tài
  khoản demo sau khi xong (khôi phục đúng 21 pet + 0 mảnh ghép ban đầu)
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với tính năng này;
  chưa có hiệu ứng "nở trứng" trực quan riêng (chỉ có dòng thông báo text) — có thể
  làm animation đẹp hơn sau nếu cần

---

### Shop/Bag — dồn việc mua vào Shop, Bag chỉ xem/dùng (2026-08-26)

User hỏi: UI phối pet đã có chưa (xác nhận: có, xong ở mục trên) + yêu cầu Shop chỉ
bán pet và đồ ăn, Bag chỉ xem vật phẩm/đồ ăn. Phát hiện chồng chéo: Bag vốn có sẵn
nút bật "Cửa hàng ⇄ Túi đồ" cho phép MUA ngay trong Bag — trùng hẳn việc của Shop.
Đã hỏi rõ cách xử lý trước khi làm; user chọn bỏ hẳn nút mua trong Bag.

- [x] `Shop.tsx` — thêm tab "Food" thật (thay chỗ placeholder "Bundles" cũ): nhận
  thêm props `shopItems`/`onPurchaseItem`, render lưới 4 cột (ảnh/tên/mô tả/nút mua)
  y hệt phong cách lưới pet có sẵn — dữ liệu lấy từ `listFoodShop()` backend (đã có
  sẵn, không cần sửa BE): trả về item `category: "food"` hoặc key
  `"dong-ho-tai-sinh"`, đúng thứ cần cho tab này
- [x] `Bag.tsx` — bỏ hẳn: props `shopItems`/`onPurchaseItem`, state `shopMode`, hàm
  `buyChosen()`, nút bật "Đang xem: Cửa hàng/Túi đồ". Giờ Bag thuần là 1 màn xem +
  nút "Dùng ngay" duy nhất (bỏ nhánh label/hành động theo `shopMode` cũ); tab mặc
  định đổi từ "Vật phẩm" (index 3) về "Đồ ăn" (index 0)
- [x] `App.tsx` — `case "shop"` truyền thêm `shopItems={foodShop}` +
  `onPurchaseItem={handlePurchaseItem}` (tái dùng state/handler có sẵn); `case "bag"`
  bỏ 2 prop đó đi (Bag không còn cần)
- [x] `PetCare.tsx` — sửa 2 câu thông báo cũ trỏ sai chỗ mua đồ ăn ("...trong Bag" /
  "...ghé Bag để mua thêm" → đổi thành "Shop") cho khớp luồng mới; xác nhận riêng
  `onPurchaseItem`/`shopItems` của chính PetCare chỉ phục vụ 1 nút mua "đồng hồ tái
  sinh" tại chỗ (không phải luồng mua đồ ăn chung) nên giữ nguyên, không đụng vào
- [x] Chạy lại `npm run prisma:seed` để đẩy nốt bản sửa mô tả "Bánh tăng cấp" (bỏ câu
  "tương đương 3 cấp" đã lỗi thời từ lúc đổi đường cong XP) vào DB thật — xác nhận
  qua curl `GET /children/:id/food-shop` đã đúng, và coin admin vẫn đúng 999.000.000
- [x] Verify: backend/frontend `tsc`/`oxlint`/`build` sạch; parity bản dịch không
  phát sinh key thiếu mới; Playwright xác nhận tab Food hiện đủ vật phẩm thật (Bánh
  quy Buddy, Cơm gà cầu vồng, Sữa sao kim cương, Bánh tăng cấp, Táo, Bánh mì, Sữa, Cà
  rốt...), mua thử "Táo" ra toast "Đã mua Táo" không lỗi; Bag xác nhận không còn nút
  "Đang xem: Cửa hàng" (đếm = 0), chỉ còn danh sách đồ đang sở hữu + "Dùng ngay" hoạt
  động đúng (hiện hiệu ứng +8 Đồ ăn/+2 Sức khoẻ khi dùng Táo)
- **Cập nhật (cùng ngày):** user phản hồi "trong shop vẫn còn chăm sóc, chỉ display
  $ và mua pet only" — hoá ra tab Pets của Shop vẫn còn 1 hành vi sót lại: bấm/double
  click vào pet ĐÃ SỞ HỮU sẽ nhảy thẳng sang màn Pet Care (nút "🐾 Chăm sóc") — lẫn
  qua chức năng của Pet Collection/Pet Care, không đúng tinh thần "Shop chỉ để mua".
  Đã sửa: bỏ hẳn `onOpenPetCare`/`onDoubleClick`; pet đã sở hữu giờ chỉ hiện nhãn tĩnh
  màu xám "Đã có"/"Đang dùng" (không bấm được, không điều hướng đi đâu); pet chưa sở
  hữu vẫn hiện giá + nút mua như cũ. Verify: `tsc -b`/`oxlint`/`build` sạch, Playwright
  xác nhận cả 2 trạng thái đúng (owned → nhãn xám tĩnh; chưa owned, vd Stripe/Ellie/
  Lila → vẫn hiện giá "250" + nút mua hoạt động)
- **Cập nhật (cùng ngày, lần 2):** user phản hồi tiếp "Pet có thể mua multiple để
  còn ghép pet, nên ở shop không thể hiển thị đã mua" — tức là cách sửa ở trên (khoá
  hẳn nút mua khi đã sở hữu) đi NGƯỢC với ý định thật: cho phép mua trùng 1 pet nhiều
  lần để lấy nguyên liệu phối (thay vì chỉ trông chờ random từ kết quả phối). Đã sửa
  lại đúng hướng:
  - `progress.service.ts`'s `purchasePet` — mua pet ĐÃ sở hữu giờ vẫn tính tiền bình
    thường (không còn miễn phí/chỉ chọn làm active như code cũ), và thay vì unlock gì
    mới thì quy đổi thẳng thành **nguyên liệu phối** — 1 mảnh ghép đúng bậc rarity của
    chính pet đó (Common/Rare/Epic), hoặc 500 coin an ủi nếu là Legendary (không có
    bậc mảnh ghép cho Legendary, y hệt logic đã có ở `petFusion.service.ts` khi phối
    ra trùng) — dùng chung 1 hằng số `LEGENDARY_DUPLICATE_COINS` giữa 2 service này.
    Trả về thêm `isDuplicate`/`rarity`/`shardsGranted`/`coinsGranted` để FE hiện đúng
    thông báo
  - `Shop.tsx` — bỏ hẳn nhánh UI "đã mua" (nút xám bị khoá): MỌI pet, kể cả đã sở hữu,
    luôn hiện giá + nút Mua hoạt động bình thường. Chỉ giữ lại nhãn "Đang dùng" ở góc
    (thuần thông tin cho biết pet nào là bạn đồng hành hiện tại, KHÔNG chặn mua) — bỏ
    hẳn nhãn "Đã có" cũ. Toast sau khi mua phân biệt 3 trường hợp: pet mới → "Mở khoá
    thành công!"; trùng bản thường → "Đã có pet này rồi — nhận thêm 1 mảnh ghép
    [Rarity]!"; trùng Legendary → "...nhận thêm 500 coin!"
  - Verify: backend/frontend `tsc`/`oxlint`/`build` sạch; curl test đủ 4 nhánh (mua
    mới hẳn 1 Epic chưa có → unlock thật đúng, không tốn nguyên liệu; mua lại đúng
    Epic đó lần 2 → trừ tiền đúng giá + epicShards +1; mua lại 1 Rare đã sở hữu sẵn →
    trừ đúng 250 coin + rareShards +1; mua lại 1 Legendary đã sở hữu sẵn → trừ đúng
    800 gem + cộng đúng 500 coin, không có shard nào sinh ra); Playwright xác nhận
    UI: Buddy/Mimi/Poppy (đều đã sở hữu) hiện nút "Free" bấm được bình thường, Buddy
    (đang là bạn đồng hành) có thêm nhãn "Đang dùng" — dọn sạch dữ liệu test (xoá pet
    test mới unlock, khôi phục đúng coin/gem/mảnh ghép/pet đang dùng ban đầu)
  - **Lưu ý kinh tế:** vì pet Common giá 0 ("Free"), mua trùng Common để lấy mảnh
    ghép Common cũng miễn phí — 1 cách "cày" mảnh ghép Common không giới hạn (rẻ nhất
    trong 3 bậc fusion nên chấp nhận được, nhưng nói rõ ra đây để biết nếu sau này
    thấy cần giới hạn lại)
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với các thay đổi này

---

### Hệ thống "phối pet" được đổi sang mô hình petCopies/petEggs (ghi nhận, không phải
### việc của phiên làm việc này) + sửa hiển thị gộp ở Pet Care (2026-08-26)

Giữa phiên làm việc, code base đã tự đổi khác đi (không phải do tôi sửa trong các
bước ở trên) — mảnh ghép (`commonShards`/`rareShards`/`epicShards`) đã được thay bằng
mô hình **số bản pet thật**: `Progress.petCopies` (tổng số bản đang có theo từng key)
+ `Progress.petEggs` (số bản DƯ chưa "nuôi" — bản đầu tiên là pet chính có `PetStats`
riêng, mọi bản mua/thưởng thêm sau đó là 1 "trứng"). `purchasePet` giờ cộng thẳng vào
`petCopies`/`petEggs` thay vì quy đổi mảnh ghép; `petFusion.service.ts` đổi hẳn cách
chọn nguyên liệu — không còn yêu cầu pet max level nữa, thay vào đó cho CHỌN đúng 3
pet cùng bậc bất kỳ (`FusionMaterial[]`, mỗi phần tử là 1 bản chính hoặc 1 trứng) qua
UI mới `FusionPetPicker.tsx` + màn ăn mừng `FusionCelebration.tsx`; cả 3 công thức
(Common/Rare/Epic) đều cần đúng 3, không còn 3/5/9 như thiết kế gốc nữa. Ghi lại ở
đây vì TASKS.md chưa có dòng nào về thay đổi này dù đã lên code thật — để phiên sau
biết đây là trạng thái hiện tại, không phải bug.

User báo: "Pet Care hiện tại 1 con chó lv 11, và 6 quả trứng chó, cần tách ra làm 2
item" — đúng là bug thật: panel "Đổi bạn thú" ở `PetCare.tsx` gộp pet chính + toàn bộ
trứng dư vào CHUNG 1 thẻ, chỉ có 1 badge "×N" (N = `petCopies`, gộp cả bản chính lẫn
trứng) đè lên ảnh con pet đang nuôi — nhìn như "1 con pet có ×6" chứ không rõ đâu là
pet thật đang lên cấp, đâu là trứng chưa nở.
- [x] `PetCare.tsx` — bỏ hẳn badge "×N" gộp; giờ mỗi loài hiện tối đa **2 thẻ riêng**:
  1 thẻ là pet chính (chọn được làm bạn đồng hành, hiện đúng level đang nuôi), và —
  CHỈ khi còn trứng dư (`petEggs[id] > 0`) — thêm 1 thẻ "Trứng {tên}" viền đứt nét,
  hiện badge ×{số trứng}, không chọn được làm bạn đồng hành (bấm vào chỉ hiện gợi ý
  "ghé Pet Collection để phối lên bậc cao hơn") — cùng cách tách "bản chính/trứng"
  `FusionPetPicker.tsx` đã dùng, cho nhất quán trong toàn app. Bỏ luôn prop
  `petCopies` khỏi `PetCare.tsx` (không còn chỗ nào cần nữa), đổi sang nhận `petEggs`
- [x] Thêm 2 chuỗi dịch mới ("Trứng", "Trứng chưa nở — ghé Pet Collection...") cho cả
  3 ngôn ngữ Anh/Nhật/Hàn — không đụng vào các key khác đang thiếu sẵn từ đợt đổi
  petCopies/petEggs kia (vd "Đang chọn" cũng đang thiếu dịch nhưng không phải lỗi mới
  phát sinh từ việc sửa lần này, để nguyên)
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright xác nhận trực tiếp trên dữ
  liệu THẬT của tài khoản demo (không phải data test tự tạo) — Buddy đang Lv.30 MAX
  (đã lên cấp từ Lv.11 lúc user báo), hiện đúng 1 thẻ pet chính + 1 thẻ "Trứng Buddy
  ×5" tách biệt cạnh nhau, không còn gộp chung 1 badge nữa
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này; các
  key dịch thiếu sẵn từ đợt đổi petCopies/petEggs (vd "Đang chọn") vẫn chưa được vá —
  để dành cho lúc nào rà lại toàn bộ nợ dịch thuật, không phải việc của fix này

---

### Dời "Đọc truyện"/"Từ điển"/"Nội dung của tôi" vào tab "Học tập" (2026-08-28)

User yêu cầu dời 3 ô này (đang nằm trong More.tsx) vào "phần Học tập". Phát hiện tab
"Game" ở bottom nav đã được đổi nhãn hiển thị thành "Học tập" từ trước (xem
`BottomTabs.tsx`, `key: "Game"` nhưng `label: "Học tập"` — cùng lúc với đợt đổi
petCopies/petEggs ghi ở mục trên, cũng không phải việc của phiên này) và `GameHub.tsx`
tự đặt tiêu đề `<h1>` là "Học tập" — nên hiểu đúng ý user là dời 3 ô này vào MÀN HÌNH
đó (không phải chỉ thêm 1 tiêu đề nhóm cùng tên trong More, việc đó sẽ trùng tên với
điểm đến thật gây rối).
- [x] `GameHub.tsx` — thêm 3 tile mới vào cuối `TILES` (Đọc truyện/Từ điển/Nội dung
  của tôi), tái dùng nguyên `screen`/`label`/`desc` cũ từ More.tsx, gán thêm
  `category`/`icon`/`color`/`soft` mới hợp bộ giao diện lưới hiện có (ĐỌC HIỂU 📖,
  TRA CỨU 📔, PHỤ HUYNH ✍️) — không dịch riêng 3 nhãn category mới này vì TOÀN BỘ
  9 category cũ (HÀNH TRÌNH, THỬ THÁCH...) cũng đang chưa dịch, giữ đúng quy ước có
  sẵn thay vì tự vá lẻ tẻ
- [x] `More.tsx` — bỏ hẳn 3 tile này khỏi `TILES` (dời hẳn, không phải nhân đôi)
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright xác nhận cả 2 chiều — tab
  "Học tập" hiện đủ 3 ô mới ở cuối lưới, màn "Thêm" (More) không còn 3 ô này nữa
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này

---

### Trang Cài đặt — biến 15/16 dòng mock thành tính năng thật (2026-08-27)

User: "trong page Cài đặt, hiện tại đang có rất nhiều function, giúp tôi list vào
trong Task, rồi tiến hành implement những task đó". Rà lại `Settings.tsx`: y hệt
`ParentArea.tsx`'s "Cài đặt nhanh" panel, đây là màn HOÀN TOÀN MOCK — 16 dòng cài đặt,
chỉ đúng 1 dòng ("Ngôn ngữ giao diện") thật, 15 dòng còn lại là local state thuần,
bấm không có tác dụng gì. Đã hỏi user chọn phạm vi làm (AskUserQuestion, liệt kê rõ
3 nhóm theo độ khả thi) — chọn "Làm hết nhóm Dễ + Nhắc học": 6 tính năng thật, nhóm
còn lại đổi thành nhãn "Sắp ra mắt" rõ ràng thay vì giả vờ hoạt động.

**Phát hiện phụ trong lúc sửa `tts.service.ts`:** file có sẵn 1 byte NUL (`\x00`) lẫn
trong code (`${voice}\x00${text}` thay vì `${voice} ${text}`) — khiến `file`/`grep`
coi cả file là "binary", làm `Edit` tool không match được string thường. Không phải
lỗi tôi gây ra (không rõ nguồn gốc, có thể từ 1 lần ghi đè lỗi ở đợt sửa petCopies/
petEggs trước đó) — đã tự sửa bằng script Python thay `\x00` → khoảng trắng, xác nhận
`file` báo lại đúng "UTF-8 text".

**1. Tốc độ đọc + Giọng đọc (TTS)** — hạ tầng đã có sẵn (`msedge-tts` hỗ trợ
  `ProsodyOptions.rate` + chọn `voice` tuỳ ý), chỉ cần nối dây:
  - [x] `tts.schema.ts` — thêm `voice?: "us"|"uk"`, `rate?: "normal"|"slow"` vào
    query schema (whitelist cố định, không nhận chuỗi tự do từ client)
  - [x] `tts.service.ts` — `getOrCreateAudio`/`synthesize`/`cacheKey` nhận thêm
    tham số `rate`, truyền `ProsodyOptions` vào `tts.toFile()`; cache key giờ theo
    bộ ba (voice, rate, text) thay vì chỉ (voice, text)
  - [x] `tts.routes.ts` — map `voice`/`rate` (key ngắn gọn "us"/"uk"/"normal"/"slow")
    sang giá trị thật của msedge-tts ngay tại route, không tin client gửi thẳng
  - [x] FE: `lib/ttsPrefs.ts` (mới) — đọc/ghi lựa chọn vào localStorage (thiết bị,
    không phải dữ liệu tài khoản); `lib/tts.ts`'s `speak()` đọc pref mỗi lần gọi,
    cache theo (voice, rate, text); fallback browser TTS cũng áp dụng rate/voice
  - [x] `Settings.tsx` — "Tốc độ đọc"/"Giọng đọc" đổi từ `Pill` tĩnh sang
    `TwoWaySwitch` bấm được, áp dụng ngay lập tức (không cần nút Lưu)
  - Verify: curl 2 file mp3 (mặc định vs uk+slow) — khác hash, khác nội dung thật;
    curl voice không hợp lệ → 400 rõ ràng; Playwright bấm "Chậm"/"Anh-Anh" → xác
    nhận đúng `localStorage` set + UI cập nhật đúng
**2. Tự động phát âm** — hoá ra `Lesson.tsx` vốn ĐÃ luôn tự đọc đáp án mỗi câu
  (`useEffect(() => speak(q.answer), [step])`, không tắt được) — toggle này giờ
  điều khiển đúng hành vi đó qua `getAutoSpeak()`/`setAutoSpeak()` (mặc định BẬT,
  giữ nguyên hành vi cũ cho tới khi phụ huynh tắt)
**3. Cho phép bảng xếp hạng** — `leaderboard.service.ts` show tên thật MỌI trẻ đã
  chơi Đấu trường ít nhất 1 lần, không có cách ẩn — nay thêm được:
  - [x] `schema.prisma` — `Progress.hiddenFromRank` (Boolean, default false, giữ
    hành vi cũ cho tài khoản có sẵn) — migration `add_hidden_from_rank`. **Gặp lỗi
    migration lịch sử**: 2 migration trước đó (`add_pet_copies`/`add_pet_eggs`, từ
    đợt đổi petCopies/petEggs không phải việc của phiên này) báo cột đã tồn tại khi
    `migrate deploy` — cột thật sự đã có trong DB nhưng bảng `_prisma_migrations`
    chưa ghi nhận (khả năng đã áp dụng ngoài luồng migration, vd `db push`) — sửa
    bằng `prisma migrate resolve --applied <tên>` cho cả 2, không đụng gì tới data
  - [x] `leaderboard.service.ts` — `getLeaderboard()`/`getMyRank()` thêm điều kiện
    `hiddenFromRank: false` vào mọi query liên quan
  - [x] `progress.service.ts` — `setRankVisibility()`; route mới
    `PATCH /children/:id/rank-visibility`
  - [x] FE: `Settings.tsx`'s toggle gọi thẳng API, không còn state giả
  - Verify: curl bật/tắt cờ, xác nhận DB đổi đúng, khôi phục lại `false` sau test
**4. Khoá bằng mã phụ huynh** — TRƯỚC ĐÓ Parent Area không có khoá nào cả (bấm vào
  là vào thẳng) — nay thêm khoá PIN 4 số Ở CẤP THIẾT BỊ (localStorage, không phải
  dữ liệu tài khoản — giống PIN màn hình điện thoại, mục đích chặn trẻ đang cầm máy
  đã đăng nhập sẵn, không phải bảo vệ tài khoản):
  - [x] `lib/parentPin.ts` (mới) — PIN được hash SHA-256 (Web Crypto) trước khi lưu
  - [x] `components/ParentPinPrompt.tsx` (mới) — bàn phím số dùng chung cho cả
    luồng "đặt PIN" (nhập 2 lần để xác nhận, dùng trong Settings) và "nhập PIN"
    (dùng trong Settings khi tắt khoá, VÀ ở cổng vào Parent Area)
  - [x] `App.tsx` — `case "parentArea"` chặn bằng `ParentPinPrompt` nếu
    `isParentPinEnabled() && !parentAreaUnlocked`; tự khoá lại mỗi lần thoát ra
  - Verify Playwright đủ 4 bước: cổng hiện ra khi có PIN → nhập sai bị chặn → nhập
    đúng vào được → thoát ra vào lại thì khoá lại từ đầu
**5. Xoá toàn bộ dữ liệu** — trước đó bấm không làm gì; nay xoá thật:
  - [x] `auth.service.ts`'s `deleteAccount(parentId, confirmEmail)` — so khớp email
    gõ lại (không phân biệt hoa/thường, trim khoảng trắng) rồi `prisma.parent.delete`
    — cascade xoá hết Child/Progress/PetStats/ChildItem/SavedWord/lịch sử đấu
    trường/mọi lesson-story-minigame... tự soạn, đã có sẵn `onDelete: Cascade` từ
    trước nên chỉ cần 1 lệnh xoá Parent
  - [x] Route `DELETE /auth/me` (body `{ confirmEmail }`) — 400 nếu email sai, 204
    nếu xoá thành công
  - [x] `Settings.tsx` — modal xác nhận: phải gõ lại đúng email mới bấm được
    "Xoá vĩnh viễn"; `App.tsx`'s `handleDeleteAccount()` gọi xong tự `handleLogout()`
  - Verify: tạo 2 tài khoản test tạm qua `/auth/register` (KHÔNG đụng tài khoản
    admin thật) — xoá sai email → 400 + tài khoản vẫn login được; xoá đúng email →
    204 + login sau đó trả 401; xoá tài khoản test thứ 2 dọn dẹp nốt
**6. Nhắc học hằng ngày** — thông báo local (không cần hạ tầng push server) qua
  `@capacitor/local-notifications` (mới thêm vào `frontend/package.json`):
  - [x] `lib/dailyReminder.ts` (mới) — `isReminderSupported()` (false trên web, true
    trên app cài — dùng `Capacitor.isNativePlatform()`), xin quyền rồi lên lịch
    thông báo lặp lại 19:00 mỗi ngày; huỷ lịch khi tắt
  - [x] `Settings.tsx` — bấm trên web hiện đúng thông báo "chỉ hoạt động trên app
    điện thoại" thay vì giả vờ bật được
  - **Việc còn tồn:** chưa test thật trên điện thoại (cần build native mới có
    plugin) — sẽ xác nhận khi build+cài lần này
- [x] Dịch đủ ~40 chuỗi UI mới cho cả Anh/Nhật/Hàn — verify bằng script kiểm tra
  parity, không tạo key trùng
- [x] Verify toàn bộ: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build`
  sạch; migration deploy thành công sau khi gỡ vướng migration lịch sử ở trên
- **Việc còn tồn:** chưa build/cài native (Android chưa từng cài — chỉ iOS đã setup
  máy thật) với các thay đổi lần này, đặc biệt cần cho tính năng Nhắc học; 10 dòng
  còn lại ("Chế độ tối", "Âm lượng nhạc nền", "Hiệu ứng âm thanh", "Giới hạn giờ mỗi
  ngày", "Chế độ ngoại tuyến", "Tải bài học offline", "Xuất báo cáo học tập") giờ
  hiện đúng "Sắp ra mắt" thay vì giả vờ hoạt động — mỗi cái đều cần hạ tầng mới hoàn
  toàn (theo dõi thời lượng dùng + tự khoá app, cache bài học offline, sinh PDF +
  gửi email, hệ thống nhạc nền/SFX, theming toàn app) nên để lại cho yêu cầu sau

---

### Sửa lỗi: mất mạng lúc mở app → tự bị đá về màn đăng nhập, mất phiên (2026-08-28)

User báo: "nếu user không có mạng => auto bị treo ở màn đăng nhập, không lưu lại
phiên đăng nhập trước". Đúng là bug thật, gốc rễ ở `App.tsx`'s boot effect (chạy
mỗi lần mở app): có token lưu sẵn → gọi `api.me()` để xác thực → BẤT KỲ lỗi nào
(kể cả lỗi mạng thuần, chưa từng chạm tới server) đều bị `catch` gộp chung và xử
lý y hệt "token sai" — xoá sạch token + đá về màn đăng nhập. Mở app không mạng thì
`fetch()` tự nó throw lỗi (chưa có response nào cả) → mất phiên oan, và tệ hơn:
màn đăng nhập cũng cần mạng nên user kẹt cứng, không đăng nhập lại được.
- [x] `api.ts` — phân biệt 2 loại lỗi: `ApiError` (server ĐÃ trả lời, thật sự từ
  chối token — hết hạn/bị thu hồi) vs lỗi thường (chưa từng tới được server — mất
  mạng/DNS/timeout). Áp dụng ở 2 chỗ:
  - `tryRefreshAccessToken()` — chỉ `tokenStorage.clear()` khi lỗi là `ApiError`;
    lỗi mạng thuần thì giữ nguyên token, chỉ trả `false` cho lần thử đó (tránh
    tình huống wifi chập chờn đúng lúc access token hết hạn giữa phiên làm mất
    hẳn phiên đăng nhập, dù tài khoản hoàn toàn hợp lệ)
  - `App.tsx`'s boot effect (đổi tên thành `checkStoredSession()` để nút "Thử lại"
    dùng lại được) — cùng logic: `ApiError` → xoá token + về "login"; lỗi mạng →
    chuyển sang phase mới `"offline"`, KHÔNG đụng tới token
- [x] Thêm phase `"offline"` — màn hình riêng (tái dùng đúng ngôn ngữ hình ảnh của
  `SystemStates.tsx`'s demo card "Mất mạng rồi!": nền xanh nhạt, icon Buddy xám,
  chấm than xanh dương) với nút "Thử lại" (gọi lại `checkStoredSession()`) và nút
  phụ "Đăng xuất" (lối thoát cho ai thật sự muốn đổi tài khoản dù chưa xác thực
  được mạng). Không phải màn đăng nhập — phiên vẫn còn nguyên, chỉ cần có mạng lại
- [x] Verify bằng Playwright thật (chặn riêng request tới backend qua
  `context.route()`, KHÔNG chặn toàn bộ mạng — mô phỏng đúng thực tế app native:
  bundle đã có sẵn trên máy, chỉ API là cần mạng): mất mạng → hiện đúng màn "Mất
  mạng rồi!", KHÔNG hiện form đăng nhập, token vẫn còn nguyên trong storage; bấm
  "Thử lại" sau khi có mạng lại → vào lại app bình thường, không cần đăng nhập lại.
  Kiểm tra thêm nhánh còn lại: token THẬT SỰ sai (server trả lỗi thật) vẫn đúng bị
  xoá + về màn đăng nhập như cũ, không bị "kẹt" ở màn offline oan
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này

---

### Trang Thông báo — bỏ dữ liệu giả, xây thật từ sự kiện có sẵn trong app (2026-08-28)

User báo: "Phần thông báo có vẻ đang chưa đúng, tôi mới thử learn nhưng thông báo bị
sai" + "Thông báo đã đọc rồi không cần highlight". Rà lại `Notifications.tsx`: y hệt
`Settings.tsx` trước khi sửa — 6 thông báo là DỮ LIỆU MẪU CỨNG (không đổi theo việc
user thật sự làm), và trạng thái "đã đọc" chỉ là `useState` cục bộ — mỗi lần rời màn
rồi quay lại là reset về `[]`, tất cả hiện lại "chưa đọc". Đã hỏi phạm vi sửa (giống
cách hỏi ở Cài đặt) — chọn "Xây thật — thông báo sinh ra từ việc bạn thật sự làm".

- [x] `schema.prisma` — model `Notification` mới (`childId`, `kind` enum
  `lesson|petUnlock|checkin|quest`, `title`, `body`, `createdAt`, `readAt` —
  null = chưa đọc, lưu ở SERVER chứ không phải localStorage nên đã đọc thì đã đọc
  thật, không tự "hiện lại chưa đọc" mỗi lần mở app nữa) — migration
  `add_notifications`
- [x] `notification.service.ts` (mới) — `createNotification()` (nội bộ, các service
  khác gọi fire-and-forget ngay tại thời điểm sự kiện thật xảy ra),
  `listNotifications()`, `markNotificationRead()`, `markAllNotificationsRead()`
- [x] Bắn thông báo THẬT tại đúng 4 chỗ sự kiện xảy ra (không phải giả lập):
  - `progress.service.ts`'s `purchasePet()` — mở khoá pet mới (bỏ qua nếu mua
    trùng, vì trùng bản không phải pet mới)
  - `progress.service.ts`'s `checkIn()` — điểm danh thành công (bỏ qua nếu đã điểm
    danh hôm nay rồi)
  - `progress.service.ts`'s `claimMonthlyLegendaryPets()` — quà Premium pet
    Legendary hằng tháng
  - `petFusion.service.ts`'s `fusePets()` — phối ra pet mới (bỏ qua nếu phối
    trúng pet đã có, vì đó thành mảnh ghép/coin chứ không phải pet mới)
  - `quest.service.ts`'s `claimQuest()` — nhận thưởng nhiệm vụ hằng ngày
  - Riêng **"xong bài học"** là loại DUY NHẤT do client báo lên (route mới
    `POST /children/:id/notifications/lesson-complete`, gọi từ `App.tsx`'s
    `onComplete` ngay khi 1 bài học thật xong) — nhất quán với cách toàn app đã
    tin kết quả bài học từ client từ trước giờ (progress sync offline-first, xem
    `mergeProgress()`), không phải hạ chuẩn tin cậy mới
- [x] `App.tsx` — thêm state `currentLessonLabel` ("{World} · {Lesson title}"), gán
  ngay khi tải xong câu hỏi bài học, dùng để ghép nội dung thông báo thật (ví dụ
  "Forest · Bài 1: Thiên nhiên quanh ta · 2/5 câu đúng, +50 coin.")
- [x] `Notifications.tsx` — viết lại hoàn toàn: bỏ mảng `NOTICE_DATA` cứng, gọi
  `api.listNotifications()` thật; bấm vào 1 thông báo gọi `markNotificationRead()`
  (cập nhật lạc quan phía client rồi đồng bộ lại); nút "Đánh dấu đã đọc" gọi
  `markAllNotificationsRead()`; bỏ tab "Báo cáo" (chưa có sự kiện thật nào cho báo
  cáo tuần) — còn 3 tab Tất cả/Học tập/Pet; bỏ luôn panel "Nhận thông báo nào?"/
  "Giờ yên tĩnh" ở sidebar (cũng là toggle giả không điều khiển gì thật) thay bằng
  1 dòng giải thích trung thực về nguồn dữ liệu
- [x] Verify bằng Playwright THẬT — làm 1 bài học thiệt từ đầu tới cuối (không mock),
  xác nhận thông báo hiện đúng tên bài + điểm số + coin thật; bấm đọc → hết đỏ +
  giảm đúng số "mới"; rời màn quay lại → **vẫn giữ trạng thái đã đọc** (đúng bug đã
  báo, giờ hết hẳn); verify riêng qua curl cho cả 4 sự kiện server-side còn lại
  (mua pet mới, điểm danh, phối pet, nhận thưởng nhiệm vụ) đều tạo đúng thông báo,
  và mua trùng/phối trúng trùng/đã điểm danh rồi thì KHÔNG tạo thông báo thừa; dọn
  sạch toàn bộ thông báo + số dư test khỏi tài khoản demo sau khi xong
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này;
  "Báo cáo tuần" (report) và "Pet cần chăm"/"Từ cần ôn lại" (trạng thái liên tục,
  không phải sự kiện rời rạc) chưa có nguồn thật nên chưa đưa vào — để dành nếu sau
  này cần

---

### Bỏ perk "Mở toàn bộ 6 vùng" khỏi Premium — quảng cáo sai sự thật (2026-08-28)

User chọn "Nốt Premium" trong danh sách việc còn tồn. Rà lại thấy mục backlog
"### Premium" đã CŨ (ghi từ trước đợt sửa 2026-08-26, chưa cập nhật lại — 2 trong 3
điều nó nói "chưa làm" thực ra đã làm xong rồi: "tắt quảng cáo" và "+2 pet
Legendary/tháng" đã thật từ lâu, "Khôi phục mua hàng" cũng đã nối). Việc thật sự còn
tồn đúng là 2 quyền lợi đã ghi rõ ở mục "Premium — enforce thật 3/5..." phía trên:
"Mở toàn bộ 6 vùng" (không còn ý nghĩa gì để enforce — mọi tài khoản dù miễn phí
cũng đã chọn được cả 6 vùng qua "Chọn bài học" từ lúc bỏ WorldMap) và "Báo cáo phụ
huynh chi tiết" (quy mô lớn, `ParentArea.tsx` toàn bộ là mock, không phải việc nhỏ).
Đã hỏi xử lý "Mở toàn bộ 6 vùng" ra sao trước khi làm — chọn bỏ hẳn (không khoá
ngược lại world cho tài khoản miễn phí, vì đi ngược hướng đơn giản hoá đã chọn khi
bỏ WorldMap).
- [x] `Premium.tsx` — xoá dòng "Mở toàn bộ 6 vùng" khỏi mảng `PERKS`, còn lại đúng 4
  quyền lợi thật (Không quảng cáo, Báo cáo phụ huynh, Tải bài học offline, +2 pet
  Legendary/tháng — 2 dòng đầu/cuối đã enforce thật, 2 dòng giữa vẫn là mô tả plan
  chưa có gì backing, giữ nguyên vì không phải phạm vi hỏi lần này)
- [x] Cập nhật lại mục backlog "### Premium" đã lỗi thời cho khớp thực tế hiện tại
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright xác nhận UI không còn hiện
  "Mở toàn bộ 6 vùng" nữa, 4 perk còn lại hiện đúng; phát hiện tài khoản demo đang
  bật Premium=true không đúng baseline đã ghi ("hiện không bật Premium") — tắt lại
  cho khớp
- **Việc còn tồn:** "Báo cáo phụ huynh chi tiết" (`ParentArea.tsx` toàn bộ mock) và
  "Tải bài học offline" vẫn chưa làm — đều là việc lớn hơn hẳn phạm vi "dọn nốt
  Premium" lần này, để dành nếu user muốn làm riêng

---

### Thêm 6 món đồ ăn mới cho pet (2026-08-28)

User yêu cầu "thêm giúp tôi 1 số đồ ăn cho pet". Catalog cũ có 10 món đồ ăn (6 món
khởi đầu miễn phí Táo→Xương, 4 món cao cấp có ảnh riêng Bánh quy Buddy→Bánh tăng
cấp) — thêm 6 món mới lấp khoảng trống giá giữa 2 nhóm đó, đều bán được trong Shop.
- [x] `backend/prisma/seed.ts`'s `ITEMS` — thêm 6 món: Dưa hấu (15 coin, hồi đồ ăn+
  vui vẻ), Trứng luộc (10 coin, đồ ăn+sức khoẻ), Phô mai (12 coin, đồ ăn+vui vẻ),
  Mật ong (45 coin, vui vẻ+sức khoẻ), Súp bí đỏ (60 coin, đồ ăn+sức khoẻ mạnh hơn),
  Cá hồi tươi (6 gem, cao cấp nhất — đồ ăn+sức khoẻ+XP). Chưa có ảnh riêng (không có
  công cụ tạo ảnh) nên dùng khối màu bo góc y hệt 6 món khởi đầu, không phải giật
  lùi chất lượng — đúng 1 trong 2 kiểu hiển thị đã có sẵn trong app
- [x] `PetCare.tsx`'s `ITEM_ICON` — thêm emoji tương ứng (🍉🥚🧀🍯🥣🐟) cho lưới chọn
  đồ ăn lúc cho pet ăn (Bag/Shop không dùng emoji, chỉ hiện khối màu, không cần sửa)
- [x] Chạy lại `npm run prisma:seed` — xác nhận "Seeded 35 items" (29 cũ + 6 mới)
- **Không thêm bản dịch cho 6 món này** — kiểm tra thấy TOÀN BỘ tên/mô tả vật phẩm
  trong catalog (cả 29 món cũ, kể cả 4 món cao cấp có ảnh) chưa từng được dịch dòng
  nào — dịch riêng 6 món mới sẽ tạo tình trạng nửa dịch nửa không khó hiểu hơn, giữ
  nguyên nợ dịch thuật có sẵn thay vì vá lẻ tẻ (ghi rõ ra đây phòng khi cần dịch cả
  loạt catalog vật phẩm sau này)
- [x] Verify: backend `tsc --noEmit` sạch; frontend `tsc -b`/`oxlint`/`build` sạch;
  curl xác nhận `/food-shop` trả đủ 17 món (11 cũ áp dụng + 6 mới); Playwright xác
  nhận UI thật — cuộn tab Food thấy đủ 6 món mới đúng giá/mô tả, mua thử "Dưa hấu"
  ra toast "Đã mua Dưa hấu" + xuất hiện đúng trong Kho đồ — dọn sạch giao dịch test
  (xoá Dưa hấu vừa mua, trả lại đúng 999,000,000 coin)
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này

---

### Battle Pass theo mùa — 30 mốc, track Miễn phí + VIP, admin tự soạn nội dung (2026-08-28)

User báo Premium hiện tại "chỉ mở bài học..., không tắt quảng cáo" — kiểm tra bằng
Playwright thật thì logic tắt quảng cáo khi Premium vẫn đúng (đã làm ở đợt trước),
nên khả năng cao là do bản cũ trên điện thoại. Cùng lúc user yêu cầu tính năng lớn:
thêm gói VIP theo mùa (30 ngày, tắt quảng cáo cả mùa khi có VIP) + hệ thống Battle
Pass 30 mốc như ảnh tham khảo (game khác) user gửi — làm ĐỦ nhiệm vụ mỗi ngày = 120
điểm kinh nghiệm, 3000 điểm thì tới mốc cuối, mỗi mốc có quà Miễn phí (ai cũng nhận)
+ quà VIP (cần mua gói VIP mùa), mốc 30 VIP là trứng pet Epic ngẫu nhiên.

Đã hỏi rõ 3 quyết định trước khi làm (việc lớn, ảnh hưởng kiến trúc):
1. VIP mùa **tách hoàn toàn khỏi Premium** — ai cũng mua được, không cần có Premium
2. **User tự soạn nội dung 60 ô quà** qua 1 trang Admin mới (không phải tôi tự bịa
   bảng thưởng) — kèm yêu cầu thêm UI Admin để soạn
3. Mùa dài **30 ngày**, XP reset về 0 mỗi mùa mới

**Backend:**
- [x] `schema.prisma` — 4 model mới: `BattlePassSeason` (tên + ngày bắt đầu/kết
  thúc — mùa "đang chạy" xác định bằng khoảng ngày, không cần cờ isActive thủ công),
  `BattlePassTier` (1 trong tối đa 30 mốc/mùa, mỗi mốc 2 phần quà độc lập free/vip,
  `xpRequired` là XP TÍCH LUỸ không phải XP riêng mốc — cho phép khoảng cách không
  đều giữa các mốc), `ChildBattlePassProgress` (theo CHILD không phải Parent — vì
  XP đến từ nhiệm vụ vốn đã theo child, và VIP cũng mua riêng theo từng trẻ),
  `BattlePassClaim` (đánh dấu đã nhận, unique constraint DB thật chống nhận trùng
  thay vì tự kiểm tra ở app layer) — migration `add_battle_pass`
- [x] `battlePass.service.ts` (mới) — `getCurrentSeason()`, `getBattlePassState()`,
  `claimTier()`/`claimAll()` (transaction: tạo `BattlePassClaim` trước — unique
  constraint tự chặn nhận trùng — rồi mới `grantReward()`), `activateVipSeason()`
  (demo activation, chưa có payment gateway thật, cùng khuôn `activatePremium()`),
  `awardQuestBattlePassXpIfFullyDone()` (kiểm tra MỌI quest active hôm nay đã
  `claimed` chưa, cộng đúng 1 lần/ngày nhờ `lastQuestBumpDate` — cùng khuôn
  `lastCheckinDate`). `grantReward()` hỗ trợ 10 loại: coins/gems/3 bậc mảnh ghép/4
  bậc trứng pet ngẫu nhiên (trùng bản đã có thì quy đổi mảnh ghép/coin, y hệt logic
  `petFusion.service.ts` đã có)/item bất kỳ trong Shop — không phát minh loại
  thưởng mới nào ngoài những gì nền kinh tế game đã có sẵn
- [x] Móc `awardQuestBattlePassXpIfFullyDone()` vào `quest.service.ts`'s
  `claimQuest()` — gọi sau MỌI lần claim quest (hàm tự kiểm tra đã đủ hết chưa,
  không chỉ tin lần claim cuối cùng)
- [x] Routes: `battlePass.routes.ts` (child: GET state, POST claim/claim-all/vip) +
  `admin/battlePassSeasons.routes.ts` (CRUD mùa + mốc lồng nhau, mirror
  `wordTrainTopics.routes.ts`'s shape)
- **Bug phát hiện + sửa ngay lúc test qua UI thật:** schema Zod cho
  `freeRewardItemKey`/`vipRewardItemKey` chỉ có `.optional()` (chấp nhận
  `undefined`) nhưng form Admin luôn gửi `null` tường minh khi không chọn kiểu
  "item" — mọi lần lưu mốc không phải "item" đều bị 400 "Dữ liệu gửi lên không hợp
  lệ". Sửa thêm `.nullable()` vào cả 2 field, cả schema tạo mới và cập nhật

**Frontend:**
- [x] `pages/BattlePass.tsx` (mới) — màn thật cho trẻ: nền tím than + viền vàng
  (khác hẳn phong cách kem ấm thường ngày, đúng tinh thần "sự kiện đặc biệt"), thanh
  XP + số ngày còn lại của mùa, banner "Mở VIP mùa này" (ẩn nếu đã có VIP), lưới 2
  cột Miễn phí/VIP theo từng mốc (khoá 🔒 nếu chưa đủ XP hoặc chưa có VIP, ✅ nếu đã
  nhận), nút "Nhận tất cả". Thêm tile "Battle Pass" vào `More.tsx`
- [x] `admin/pages/BattlePassPage.tsx` (mới) — 2 cột kiểu `MiniGamePage.tsx` (danh
  sách mùa bên trái kèm nhãn "Đang chạy"/"Sắp tới"/"Đã kết thúc" tự tính theo ngày,
  bảng mốc bên phải), form thêm/sửa mốc chọn loại quà từ dropdown (tự ẩn ô số lượng
  nếu là loại "trứng pet ngẫu nhiên", hiện thêm dropdown chọn vật phẩm nếu loại
  "item"). Đăng ký tab mới "🏆 Battle Pass" trong `AdminApp.tsx`
- [x] Thêm bản dịch Anh/Nhật/Hàn cho ~15 chuỗi UI mới ở màn trẻ — verify parity
  script khớp 100%, 0 key trùng (trang Admin giữ nguyên tiếng Việt thuần, không
  dịch — đúng quy ước toàn bộ trang Admin hiện có, không riêng Battle Pass)
- [x] Verify sâu qua cả curl lẫn Playwright thật trên UI (không chỉ đọc code):
  tạo mùa + 2 mốc qua Admin UI thật → phát hiện bug validation ở trên, sửa xong
  test lại sạch; xác nhận qua curl đủ nhánh: khoá do thiếu XP, khoá do thiếu VIP,
  nhận trùng bị chặn (DB constraint), "Nhận tất cả" bỏ qua track VIP nếu chưa mua
  thay vì lỗi, mốc trứng pet Epic trúng pet ĐÃ có tự quy đổi mảnh ghép đúng; xác
  nhận riêng dây chuyền "làm đủ nhiệm vụ → +120 XP" bằng quest thật qua API thật
  (tạm tắt 3 nhiệm vụ có sẵn, dùng 1 nhiệm vụ test riêng để không đụng tiến độ
  nhiệm vụ thật của tài khoản demo, xong bật lại nguyên trạng) — xác nhận cả tính
  idempotent (gọi 2 lần trong ngày không cộng đè); Playwright xác nhận toàn bộ luồng
  UI trẻ thật: mua VIP → cả 2 track mở khoá đúng lúc đủ XP → bấm nhận quà free ra
  đúng hiệu ứng (nền xanh, ✅, +50 coin thật vào HUD) — dọn sạch mùa/mốc/tiến độ test
  + trả đúng số dư khỏi tài khoản demo sau khi xong
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật; chưa xây "Báo cáo
  phụ huynh chi tiết" (đã ghi ở mục Premium phía trên, việc khác hẳn); nếu sau này
  muốn thêm khoản mua VIP mùa thật qua App Store/Google Play thì cần thay
  `activateVipSeason()`'s demo activation bằng flow xác thực receipt thật

**Cập nhật (cùng ngày):** user hỏi "UI vip ở đâu" — hoá ra sau khi dọn sạch mùa test
lúc verify xong, tài khoản demo không còn mùa nào đang chạy → cả màn Battle Pass lẫn
banner VIP đều không hiện được (đúng thiết kế: không có mùa thì không có gì để
hiện). Đã tạo THẬT (không phải data test, giữ lại) 1 mùa tên "Mùa 1" (hôm nay → +30
ngày) kèm 4 mốc mẫu (1/10/20/30, đủ loại thưởng: coin/gem/mảnh ghép/trứng pet Epic ở
mốc 30) để user thấy ngay giao diện thật trên máy — user tự vào `/admin` → Battle
Pass để sửa/thêm đủ 30 mốc theo ý muốn sau.

**Cập nhật (cùng ngày) — dời lối vào Battle Pass ra Home, bỏ khỏi More:** user yêu
cầu "thêm UI ở màn hình home, remove trong three dots" — đúng tinh thần: 1 tính
năng theo mùa cần hiện thường trực, không nên chôn trong menu "..." (More).
- [x] `Home.tsx` — tận dụng lại nút "Quà" (hộp quà) ở cột trái vốn KHÔNG CÓ
  `onClick` từ trước giờ (bấm vào không làm gì cả) — giữ nguyên icon hộp quà (đã
  hợp nghĩa "phần thưởng theo mốc"), đổi nhãn thành "Battle Pass" (có dịch sẵn
  Anh/Nhật/Hàn từ đợt trước) và nối `onClick` sang màn Battle Pass thật
- [x] `App.tsx` — thêm `onOpenBattlePass` cho `<Home>`; đổi `onExit` của
  `<BattlePass>` từ quay về "more" sang quay về "home" (khớp lối vào mới, tránh
  quay về đúng chỗ user không xuất phát từ đó)
- [x] `More.tsx` — bỏ hẳn tile "Battle Pass" khỏi `TILES`
- [x] Verify: `tsc -b`/`oxlint`/`build` sạch; Playwright xác nhận cả 4 nhánh: Home
  hiện đúng nút "Battle Pass", bấm vào đúng vào màn Battle Pass thật (thấy "Mùa
  1"), nút quay lại đúng về Home (không phải More), và More không còn tile này nữa
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với thay đổi này;
  chưa có badge/chấm đỏ báo "có quà chưa nhận" trên nút Battle Pass ở Home (chỉ là
  lối vào tĩnh, giống các nút khác — có thể thêm sau nếu cần)

### Vật phẩm test "Đói ngay" — 1 coin, làm hunger về 0 ngay để test trạng thái đói (2026-08-28)
User cần 1 vật phẩm rẻ để chủ động kiểm thử hành vi "pet đói" (speech bubble
"Mình hơi đói rồi!" khi hunger ≤ 30, thanh Đồ ăn, v.v.) mà không phải chờ hunger
tự giảm theo thời gian.
- [x] `backend/prisma/seed.ts` — thêm item mới `test-lam-doi` ("Đói ngay (Test)"),
  category `food`, giá 1 coin, `effects: [{ stat: "hunger", delta: -100 }]` (clamp
  về 0 vì `petStats.service.ts` đã tự `clamp(0,100)`); mô tả gắn tiền tố "[Test]"
  để rõ đây không phải nội dung thật. Đã chạy `npm run prisma:seed` để đưa item
  vào DB dev đang chạy (seed dùng `upsert` theo `key` — an toàn, không đụng data
  khác).
- [x] `frontend/src/pages/PetCare.tsx` — thêm icon 😩 cho key này vào `ITEM_ICON`.
- [x] **Bug phát hiện khi tự test:** pet đang test (account admin) có hunger=100
  (no), và cả backend (`inventory.service.ts` `useItem()`) lẫn frontend
  (`PetCare.tsx` `runAction()`) đều có guard "pet đã no rồi, không cho ăn tiếp"
  áp dụng cho MỌI item category food không có XP khi hunger ≥ 100 — guard này vô
  tình chặn luôn item làm ĐÓI (hungerDelta âm), đúng lúc cần dùng nhất. Sửa cả 2
  chỗ: chỉ chặn khi tổng `hungerDelta` của item > 0 (tức món thật sự "phí" vì
  không tăng thêm được gì) — item có `hungerDelta <= 0` không bao giờ bị chặn bởi
  guard này nữa.
- [x] Verify: gọi thật API `purchase` (999999998→998999999 coin) rồi `use` trên
  pet đang hunger=100 → trước khi sửa bị `409 PET_FULL`, sau khi sửa dùng thành
  công, `petStats.hunger` trả về đúng `0`.
- **Lưu ý:** đây là vật phẩm TEST, không phải nội dung thật cho user cuối — cân
  nhắc xoá (`isActive: false` hoặc xoá row) khỏi Shop trước khi release thật.

### Pet đói → đổi sang ảnh buồn (`/pets/sad/`) — user tự thêm sẵn 24/40 ảnh (2026-08-28)
`lib/petEvolution.ts` (`getPetMood`) và việc truyền `mood` xuống `<PetPortrait>` ở
Home.tsx/PetCare.tsx đã có sẵn từ trước, nhưng `PetPortrait.tsx` chưa từng thật
sự đổi ảnh theo `mood` — trừ đúng 1 trường hợp đặc biệt (`buddy` stage medium,
`/pets/evolution/buddy-medium-{happy,sad}.png`). Mọi pet khác luôn hiện ảnh vui
`/pets/{petId}.png` dù đang đói. User tự thêm ảnh buồn cho 24/40 pet vào
`frontend/public/pets/sad/`.
- [x] `components/PetPortrait.tsx` — thêm nhánh: khi `mood === "sad"` (và
  không rơi vào các trường hợp ưu tiên khác: trứng, buddy-medium, media hoạt
  hoạ ở max level) thì nạp `/pets/sad/${petId}.png` thay vì ảnh vui. 16 pet
  chưa có ảnh buồn (Legendary/Epic phần lớn) tự rơi về ảnh vui qua cơ chế
  `onError` có sẵn — không cần viết danh sách kiểm tra tay.
- **Quyết định:** pet ở max level (đang hiện animation webp riêng) vẫn ưu
  tiên animation thay vì đổi ảnh buồn — chưa có bản animation buồn, và trạng
  thái tiến hoá tối đa vốn mang tính ăn mừng nên giữ nguyên hợp lý hơn.
- [x] Verify: `tsc -b`/`oxlint` sạch; test thật qua API — bỏ đói pet "waffle"
  (level 6, không phải trường hợp đặc biệt nào) rồi chụp màn Home, xác nhận
  `<img>` src đổi đúng thành `/pets/sad/waffle.png` và ảnh hiện hợp lý (chó
  ngồi buồn) cùng lúc speech bubble "Mình hơi đói rồi!" đã có sẵn.

**Cập nhật (cùng ngày) — 17/24 ảnh buồn bị lộ nền caro, đã xoá nền:** user báo
"pet đói đang có nền caro". Kiểm tra: 17/24 file trong
`frontend/public/pets/sad/` là PNG **không có kênh alpha** (mode RGB) — nền
trong suốt của công cụ tạo ảnh đã bị "flatten" thành pattern caro xám/trắng
thật sự nằm trong pixel, không phải preview. 7 file còn lại (coco, cocoa, leo,
nimbus, rosie, sia, waffle) vốn đã có alpha sạch từ đầu.
- [x] Viết script xoá nền một lần (`scipy`+`numpy`+`Pillow`, không cần cv2):
  nhận diện caro bằng "gần như xám + sáng" (grayness ≤14, lightness ≥220), chỉ
  xoá phần **liên thông tới viền ảnh** (flood-fill từ border) để không "cắn"
  vào lông trắng/be nằm giữa con vật (bụng, chân — không chạm viền); sau đó
  giãn mask nền thêm 2px để ăn hết viền xám mờ do khử răng cưa cũ, khử màu ám
  xám ở dải lông sát viền bằng cách lấy màu từ pixel lông "sạch" gần nhất
  (`distance_transform_edt`), cuối cùng làm mềm alpha 1 chút cho đỡ răng cưa.
- [x] Áp dụng cho cả 17 file: bamboo, biscuit, buddy, ducky, ellie, frosty,
  kiwi, lila, milky, mimi, misty, pepper, poppy, smokey, snowy, stripe, sunny.
- [x] Verify: soi từng ảnh (contact sheet + zoom cận biên) trên cả nền hồng
  neon lẫn nền trắng — không còn caro/viền xám, kể cả các con lông trắng/be
  rủi ro cao (ellie xám nhạt, poppy/snowy/milky trắng) vẫn giữ nguyên lông,
  không bị thủng.
- **Lưu ý:** 16 pet còn thiếu hẳn ảnh buồn (không phải lỗi nền, chỉ đơn giản
  chưa có file) vẫn là việc tồn ở mục "Nhỏ / cosmetic" bên dưới.

### 💬 Trò Chuyện Cùng Bạn Thú (Chat with Buddy) — hội thoại tương tác nhiều lượt, bản nhẹ hơn Detective (2026-08-28)
Ý tưởng thứ 2 trong danh sách "6 ý tưởng mini-game mới" (mục "Việc còn tồn"
phía dưới) — làm theo đúng yêu cầu user, dẫn chiếu quyết định trắc nghiệm đã
chọn cho English Detective.
- [x] **Schema mới**: `ChatBuddyTopic` (key/parentId/name/color/order/isActive,
  y hệt `EchoParrotTopic`) + `ChatBuddyRound` (`data: Json` — {petLine,
  petLineVi/Ja?/Ko?, options[], optionsVi/Ja?/Ko?[], answerIndex, replyLine,
  replyLineVi/Ja?/Ko?}). Chỉ 1 "kind" duy nhất (không như `DetectiveRound` có
  interrogate/accuse) nên không cần discriminated union — đơn giản hơn hẳn
  Detective. Migration `add_chat_buddy`.
- [x] Backend đầy đủ theo đúng khuôn Detective/EchoParrot: admin CRUD
  (`/admin/chat-buddy-topics`, `/admin/chat-buddy-rounds`) + self-serve CRUD
  (`/my/chat-buddy-topics`, `/my/chat-buddy-rounds`, có quota qua
  `premium.service.ts`) + catalog đọc công khai (`/catalog/chat-buddy-topics`,
  `pickLang()`-aware cho cả `options`/`optionsVi` — thêm hàm `pickLangArray()`
  bên cạnh `pickLang()` sẵn có vì đây là field dạng mảng, không phải string).
- [x] Seed **4 chủ đề, 12 lượt** (Chào buổi sáng / Xin đồ ăn / Giới thiệu bản
  thân / Tạm biệt — đúng 3 ví dụ user liệt kê + 1 chủ đề thêm cho tròn), mỗi
  lượt là 1 câu pet hỏi bằng tiếng Anh + 1 câu đúng ngữ cảnh + 2 câu nhiễu (câu
  tiếng Anh thật, đúng ngữ pháp, chỉ sai NGỮ CẢNH — không phải câu vô nghĩa) +
  1 câu pet phản hồi khi chọn đúng. Dịch tay đủ Việt/Nhật/Hàn (tự dịch trực
  tiếp, không dùng API dịch ngoài, giống mọi nội dung seed khác trong app).
- [x] Frontend `pages/ChatBuddy.tsx` — cùng khung picker→play với English
  Detective/Echo Parrot: chọn chủ đề → chơi tuần tự từng lượt, pet hỏi (đọc TTS
  tự động khi vào lượt + nút loa đọc lại), bé chọn 1 trong 3 câu trả lời (hiện
  cả tiếng Anh lẫn nghĩa tiếng Việt để bé chưa giỏi vẫn hiểu), đúng thì pet trả
  lời lại (cũng TTS) rồi tự chuyển lượt kế sau ~3 giây — tạo cảm giác đang trò
  chuyện thật; sai chỉ rung nút, không tính, không phạt (giống mọi game khác).
  Hết lượt cuối → màn "Hoàn thành!" (+10 coin/lượt, +15 XP, chỉ đếm coin phiên
  chơi như Detective/EchoParrot, không cộng `Progress.coins` thật).
- [x] Thêm tile "💬 Trò Chuyện Cùng Bạn Thú" vào `GameHub.tsx` (category "HỘI
  THOẠI"), thêm `"chatBuddy"` vào `Screen` union + case trong `App.tsx`.
- [x] `translations.ts`: thêm 4 chuỗi UI chrome mới (tiêu đề, mô tả chọn chủ
  đề, nhãn "lượt trò chuyện", câu chúc mừng hoàn thành) cho cả 3 dictionary —
  verify bằng script AST (TypeScript Compiler API, không phải regex — regex
  ban đầu cho kết quả giả do khớp nhầm chuỗi có dấu ":") xác nhận đúng 839 key
  mỗi dictionary, không thiếu/thừa/trùng.
- **Quyết định phạm vi (giống hệt Detective/EchoParrot):** CHƯA làm UI admin
  riêng (không có `ChatBuddyPage.tsx` trong `/admin`) và CHƯA làm form tự tạo
  trong "Nội dung của tôi" — rà lại thấy 6 game gần nhất (Shop/Home/Rpg/
  WordTrain/Detective/EchoParrot) đều KHÔNG có UI admin riêng (chỉ có trong
  `admin/pages/`: Lessons/Stories/MiniGame/WordCatch/Pets/Items/Quests/
  BattlePass/Users — đúng 9 trang), nội dung của chúng chỉ tồn tại qua
  seed.ts; Detective/EchoParrot cũng chưa có form tự tạo dù routes `/my/*` đã
  có sẵn. Backend self-serve (`parentId`, `/my/*`, quota) vẫn xây đủ để nhất
  quán và sẵn sàng cho UI sau này, chỉ 2 phần UI (trang admin, form tự tạo)
  là chưa làm — cùng mức độ hoàn thiện với các game tiền lệ, không phải thiếu
  sót riêng của tính năng này.
- [x] Verify: `tsc -b`/`tsc --noEmit` (cả FE/BE)/`oxlint`/`build` sạch; curl
  API thật xác nhận catalog trả đúng nội dung + đổi ngôn ngữ ja hoạt động
  đúng; Playwright chơi hết trọn 1 chủ đề 3 lượt (kể cả cố tình chọn sai 1 lần
  để xác nhận rung nút không tính) → đúng +30 coin/+15 XP/"3/3 lượt trò
  chuyện" ở màn Hoàn thành.

### 💰 Gói vật phẩm trong Shop — "Nạp lần đầu" + "Gói combo vật phẩm", admin tự soạn (2026-08-28)
User yêu cầu thêm 2 loại gói bán trong Shop + 1 trang admin để soạn. Hỏi trước
cách tính giá (app KHÔNG có cổng thanh toán thật — Premium/VIP mùa đều là nút
demo) — chọn phương án khuyến nghị: **combo = coin/gem thật (mua thật, trừ số
dư thật), nạp lần đầu = demo tiền thật (giống Premium/VIP, bấm nhận ngay,
không trừ gì, chỉ 1 lần/trẻ)**.
- [x] **Tách `grantReward()`/`grantRandomPet()` ra `rewards.service.ts` dùng
  chung** — 2 hàm này vốn nằm private trong `battlePass.service.ts`, không có
  gì đặc thù Battle Pass cả (chỉ là "cộng 1 phần thưởng vào tài khoản"); tách
  ra để `packages.service.ts` tái dùng đúng 1 bộ "kind" phần thưởng (coins,
  gems, commonShards, rareShards, epicShards, petEggCommon/Rare/Epic/
  Legendary, item) thay vì viết lại. `battlePassRewardKind` trong
  `admin.schema.ts` cũng đổi tên thành `rewardKind` (export) vì giờ dùng
  chung cho cả 2 tính năng.
- [x] **Schema mới**: `ShopPackage` (key/name/description/`kind`: "combo" |
  "firstPurchase"/color/imagePath/price+currency [chỉ combo]/realPriceLabel
  [chỉ firstPurchase, vd "49.000đ"]/`contents: Json` [mảng {kind, amount,
  itemKey}]/order/isActive) + `ChildPackageClaim` (childId+packageId,
  `@@unique` — **chỉ ghi dòng cho gói "firstPurchase"** để chặn mua lần 2 qua
  DB constraint giống hệt `BattlePassClaim`; gói "combo" mua lặp lại thoải
  mái, KHÔNG ghi dòng nào, giống `purchaseItem()` không log lịch sử mua).
  Migration `add_shop_packages`.
- [x] Backend: `packages.service.ts` (1 file, theo đúng khuôn
  `battlePass.service.ts` — hàm child-facing tên thường + hàm admin tiền tố
  `admin*` chung 1 file, KHÔNG tách `services/admin/`) — `purchasePackage()`
  rẽ nhánh theo `kind`: "firstPurchase" tạo `ChildPackageClaim` TRƯỚC (trong
  try/catch, race → 400 sạch, đúng pattern chống double-grant của
  `claimTier()`), "combo" check số dư rồi trừ coin/gem thật (giống
  `purchaseItem()`) — cả 2 nhánh sau đó gọi `grantReward()` cho từng dòng
  trong `contents`. Admin CRUD (`/admin/shop-packages`) + child-facing
  (`/children/:id/packages`, `/children/:id/packages/purchase`) — KHÔNG có
  self-serve (`/my/*`) vì đây là nội dung kinh doanh/vận hành, không phải nội
  dung học tập phụ huynh tự soạn (giống Battle Pass).
- [x] Frontend: tận dụng lại tab "Coins" trong `Shop.tsx` vốn CHỈ LÀ
  placeholder ghi sẵn "Nạp thêm coin bằng tiền thật đang được chuẩn bị — sắp
  ra mắt!" (chưa từng làm thật) — đổi tên thành "Ưu đãi", hiện danh sách gói
  thật (icon + số lượng từng phần thưởng trong gói, nút mua đổi màu/nhãn theo
  loại gói, disable + "Đã nhận" khi gói firstPurchase đã claim). App.tsx thêm
  `packages` state (fetch cùng lúc `foodShop`) + `handlePurchasePackage()`
  (refresh `progress`+`inventory`, cập nhật đúng gói vừa mua trong list).
- [x] Admin UI mới `ShopPackagesPage.tsx` — bảng CRUD phẳng theo khuôn
  `QuestsPage.tsx` (không nested như Battle Pass vì gói không có sub-resource);
  ô soạn `contents` là danh sách động (+Thêm phần thưởng/Xoá từng dòng), tái
  dùng đúng UI pattern chọn loại thưởng + chọn vật phẩm nếu kind="item" đã có
  ở `BattlePassPage.tsx`. Thêm tab "💰 Gói vật phẩm" vào `AdminApp.tsx`.
- [x] Seed 3 gói mẫu thật qua admin API (không thêm vào `seed.ts` — cùng
  quyết định như Battle Pass, đây là nội dung admin tự soạn/vận hành, không
  phải nội dung hệ thống ship sẵn): "Quà Nạp Lần Đầu" (49.000đ demo → 1000
  coin + 50 gem + 1 trứng pet Rare), "Combo Người Mới" (200 coin → 5 táo + 3
  bóng + 10 gem), "Combo Đá Ghép Cao Cấp" (30 gem → mảnh ghép 3 bậc + 1 trứng
  pet Epic).
- [x] Verify: `tsc --noEmit` (BE)/`tsc -b`/`oxlint`/`build` (FE) sạch; test
  thật qua API — mua cả 3 gói, đối chiếu số học từng bước (coin/gem trừ/cộng
  đúng, mảnh ghép cộng đúng, pet mới xuất hiện trong `unlockedPets`, item
  cộng đúng số lượng); cố tình mua lại gói "Nạp lần đầu" lần 2 → đúng 400
  `SHOP_PACKAGE_ALREADY_CLAIMED`. Playwright xác nhận UI: tab "Ưu đãi" hiện
  đúng 3 gói với icon/giá/trạng thái đã nhận; trang admin — bảng liệt kê,
  form sửa pre-fill đúng dữ liệu, **tạo gói mới qua form thật** (không chỉ
  qua API) rồi xoá lại để dọn dữ liệu test.
- **Lưu ý:** tài khoản admin dùng để test đã thật sự "nhận" gói "Nạp lần đầu"
  (không revert lại — undo 1 lần random-pet-roll phức tạp/dễ sai hơn giá trị
  nó mang lại, và tài khoản demo này vốn đã "bẩn" từ rất nhiều lượt test
  trước đó trong phiên này) — mở app lên sẽ thấy gói đó ở trạng thái "Đã
  nhận", đúng hành vi, không phải lỗi.

### 📚 Bài học theo chủ đề, theo level thấp→cao — 6 world × 3 bài (2026-08-28)
User yêu cầu thiết kế lại Bài học theo chủ đề + level. Hỏi trước 2 điều: (1)
phạm vi — chỉ hệ Bài học chính (World/Lesson/Question), không đụng các
mini-game khác; (2) "level" nghĩa là gì — **chỉ thiết kế nội dung, KHÔNG đổi
cơ chế/schema** (dùng đúng field `order` có sẵn để xếp thứ tự dễ→khó trong
cùng 1 world, không thêm khái niệm level/khoá level mới).
- [x] Trước khi soạn: xác nhận `requiredStars` (World) đã là field CHẾT — từ
  lúc `WorldMap.tsx` bị xoá (2026-08-25), `WorldLessons.tsx` liệt kê hết mọi
  world không khoá gì cả — nên không cần lo việc thêm bài học phá vỡ gating
  nào, vì gating đó vốn không còn tồn tại.
- [x] Phát hiện + sửa 1 bug tiềm ẩn trong `seed.ts`: đoạn seed các bài học
  world (Town/Beach/School/Castle/Space) hardcode `order: 0` cho MỌI lesson
  tạo mới — vô hại khi mỗi world chỉ có đúng 1 bài, nhưng sẽ làm thứ tự
  Bài 1/2/3 không ổn định (tie-break tuỳ ý) ngay khi world có >1 bài. Thêm
  field `order` tường minh vào từng entry của `WORLD_LESSONS`, sửa vòng lặp
  seed dùng đúng `wl.order` thay vì hardcode.
- [x] Thiết kế + soạn tay **12 bài học mới** (Bài 2 + Bài 3 cho cả 6 world,
  Forest gộp chung vào `WORLD_LESSONS` luôn — trước đó nằm riêng ở khối
  `FOREST_QUESTIONS`, Bài 1 của Forest vẫn giữ nguyên không đụng), tổng
  ~78 câu hỏi mới. Cách tạo độ khó tăng dần TRONG CÙNG 1 world (không đổi
  format {prompt, hint, answer, options} sẵn có):
  - **Bài 1 (đã có sẵn, không đụng):** đáp án nhiễu khác hẳn phạm trù (dễ loại
    trừ dù không biết từ, vd "Flower" vs "Bird/Tree/Stone").
  - **Bài 2 "(Trung bình)":** đáp án nhiễu CÙNG phạm trù ngữ nghĩa với đáp án
    đúng (toàn động vật, toàn nghề nghiệp, toàn trái cây...) — đoán mò không
    ăn thua nữa, phải thật sự biết từ.
  - **Bài 3 "(Khó)":** thêm câu hỏi kiểu thuộc tính/công dụng ("Which one can
    fly?", "Where do you buy bread?") xen với nhiễu cùng phạm trù, +1-2 câu
    so với Bài 1/2 (7 câu thay vì 5-6).
  - 6 chủ đề: Forest=Muông thú rừng/Thiên nhiên kỳ diệu, Town=Nghề nghiệp/Đi
    khắp thị trấn, Beach=Đồ ăn mùa hè/Thời tiết, School=Đồ dùng lớp học/Đếm
    số, Castle=Nhân vật cổ tích/Phiêu lưu lâu đài, Space=Hệ mặt trời/Du hành
    vũ trụ.
- [x] Verify: `tsc --noEmit` sạch; seed chạy thật (idempotent, log đúng "Seeded
  12 new world lessons"); curl API xác nhận cả 6 world đều trả đúng 3 bài
  theo thứ tự `order` 0→2, đúng tiêu đề "(Trung bình)"/"(Khó)"; Playwright mở
  world Castle → thấy đúng 3 bài trong picker → chọn "Bài 3 (Khó)" → vào học
  đúng nội dung đã soạn (7 câu, câu đầu "Which one can fly?" đúng 4 đáp án
  Dragon/Horse/Knight/Giant).
- **Phát hiện phụ (không sửa, ngoài phạm vi lần này):** `Lesson.tsx` có dòng
  `"Topic: Nature"` hardcode CỨNG, không đổi theo world/lesson thật đang học
  — lộ rõ hơn bây giờ vì trước đây hầu như chỉ test Forest (đúng nghĩa
  "Nature"). Không sửa vì user chốt phạm vi lần này là "chỉ nội dung, không
  đổi code" — nếu muốn sửa, cần lấy `world.topic` thật truyền xuống thay vì
  chuỗi cứng.

### Bài học — nhân 10 lần số câu hỏi (798 câu mới, tổng 906 câu) (2026-08-28)
User thấy 78 câu vừa thêm "có vẻ ít", yêu cầu nhiều gấp 10 lần. Thay vì gõ tay
~800 object câu hỏi (~5 dòng/câu, không khả thi), viết 1 generator sinh câu
hỏi từ danh sách từ tiếng Anh thuần — khả thi vì `Question` **không có cột
vi/ja/ko nào cả** (chỉ `Lesson`/nội dung cấp chủ đề mới đa ngôn ngữ), `hint`
chỉ là 1 trong 2 chuỗi UI cố định chứ không phải bản dịch từng từ → sinh từ
danh sách tiếng Anh không tốn công dịch nào.
- [x] `genQuestions(words: string[])` trong `seed.ts`: mỗi từ → 1 câu, xen kẽ
  "Find the X!"/"Which one is X?" (đúng mẫu câu tay đã viết), 3 đáp án nhiễu
  rút ngẫu nhiên từ CÙNG danh sách (cùng phạm trù → cùng độ khó "Trung bình"
  đã lập ở bài trước, không phải câu hỏi làm cho có). Tự viết hoa đúng từng
  từ trong cụm (`titleCaseWord` — khớp tiền lệ "Ice Cream" viết hoa cả 2 từ),
  tự chọn "a"/"an"/không mạo từ (heuristic: từ tận cùng "s" hoặc nằm trong
  danh sách bất khả đếm cố định → bỏ mạo từ).
- [x] **42 danh sách từ mới** (7 chủ đề × 6 world × 19 từ = 798 từ/câu hỏi):
  Forest (sinh vật biển, động vật nông trại, côn trùng, cây cối, bầu trời,
  cắm trại, bò sát), Town (toà nhà, cửa hàng, giao thông, gia đình, đời sống
  thành phố, dụng cụ thể thao, trang phục), Beach (sinh vật biển, trái cây,
  đồ uống, thời tiết, đồ đi biển, trò chơi biển, cảnh quan), School (đồ dùng
  lớp học, môn học, khu vực trường, số lớn, hình khối, người trong trường, sự
  kiện trường), Castle (hoàng tộc, sinh vật phép thuật, khu vực lâu đài, bảo
  vật, sự kiện, muông thú, nghề xưa), Space (hành tinh, du hành, robot/alien,
  khoa học Trái Đất, số nâng cao, thời gian vũ trụ, nghề khoa học). Tất cả gắn
  nhãn "(Trung bình)" — đúng với cơ chế thật (nhiễu cùng phạm trù), không thổi
  phồng thành "(Khó)" như Bài 3 (vốn có thêm câu hỏi thuộc tính/công dụng).
- [x] Mỗi world giờ có **10 bài** (3 bài tay đã viết + 7 bài sinh tự động),
  tổng **906 câu hỏi** toàn app (30 gốc + 78 đợt trước + 798 đợt này).
- [x] **Phát hiện + sửa ngay 1 bug thật trong lúc test tay**: `updateLessonSchema`
  = `lessonSchema.partial()`, nhưng `lessonSchema` có `order`/`isActive` dùng
  `.default()` — Zod áp `.default()` bất kể `.partial()` khi field bị OMIT
  khỏi body, nên PATCH chỉ gửi `{title}` (không gửi `order`) vô tình RESET
  `order` về 0! Tự dính bug này khi sửa tay 1 lỗi trùng tên bài "Du hành vũ
  trụ" (Bài 3 và Bài 5 cùng world Space trùng tên) qua curl PATCH thủ công.
  Phát hiện ngay (order bị reset 4→0), sửa lại bằng PATCH thứ 2 gửi đúng
  `order:4`. **Không phải bug do phiên này gây ra và KHÔNG ảnh hưởng người
  dùng thật** — mọi form admin thật (`QuestsPage.tsx` v.v.) luôn gửi state
  form ĐẦY ĐỦ (không bao giờ gửi partial thật sự), chỉ lộ ra khi tự gọi API
  bằng tay như vừa làm. Ghi lại ở đây làm cảnh báo cho ai sau này gọi
  `PATCH /admin/*` trực tiếp — nhớ gửi đủ field, đừng tin `.partial()` giữ
  nguyên giá trị cũ.
- [x] Verify: `tsc --noEmit` sạch; seed chạy thật (log "Seeded 42 new world
  lessons"); đếm qua API xác nhận đúng 10 bài/world × tổng 906 câu; soi tay
  vài bài (School "Các khu vực trong trường" — ngữ pháp a/an/apostrophe đều
  đúng; Space "Con số nâng cao" — chấp nhận được dù hơi trừu tượng, world
  Space vốn gắn nhãn "Advanced" từ đầu); Playwright xác nhận picker hiện gọn
  gàng cả 10 nút không vỡ layout, chọn 1 bài sinh tự động vào học đúng 1/19,
  câu đầu "Find the alien!" đúng 4 lựa chọn cùng phạm trù công nghệ vũ trụ.

### 🕵️ English Detective — thêm 100 vụ án (2026-08-28)
User yêu cầu 100 vụ án mới. Không thể gõ tay 100 cốt truyện trinh thám thật
(mỗi vụ cần logic thật — 1 nghi phạm được minh oan, 1 nghi phạm nói dối bị
vạch trần, 1 nhân chứng củng cố nghi ngờ — CỘNG dịch vi/ja/ko cho từng lời
khai/manh mối, khác hẳn Question ở mục Bài học không cần dịch gì cả) → dùng
lại đúng khuôn logic 3-nghi-phạm mà 2 vụ án viết tay đã dùng làm TEMPLATE,
tham số hoá bằng các "ngân hàng từ" (nghi phạm/vật bị mất/địa điểm/hoạt động)
dịch sẵn 1 lần, sinh 100 vụ từ đó.
- [x] `buildDetectiveCase()` trong `seed.ts`: ghép 20 nghi phạm (tên+nghề+emoji,
  dịch sẵn 3 thứ tiếng) × 15 vật bị mất × 15 địa điểm × 15 nạn nhân × 10 cặp
  "hoạt động thật + lời xác nhận" × 10 cặp "hoạt động giả + lời vạch trần" —
  mỗi vụ: vòng 1 minh oan nghi phạm A (nhiễu cùng phạm trù hoạt động), vòng 2
  vạch trần nghi phạm B nói dối, vòng 3 nhân chứng C xác nhận thấy B gần hiện
  trường, vòng 4 buộc tội — ĐÚNG hệt logic 2 vụ án gốc, không phải random vô
  nghĩa.
- [x] **3 bug tự phát hiện + tự sửa qua nhiều vòng test thật (không phải chỉ
  đọc code):**
  1. Đặt tên biến `ITEMS` trùng với `ITEMS` (danh mục Shop) đã có sẵn ở đầu
     file — lỗi "already declared", crash ngay khi chạy seed. Đổi tên thành
     `STOLEN_ITEMS`.
  2. Ngữ pháp: `"A antique vase disappeared..."` (thiếu "an") và
     `"near the vase around at 9 PM"` (thừa giới từ) — phát hiện khi đọc trực
     tiếp nội dung sinh ra qua API, không phải soát code. Sửa cả 2.
  3. **Bug nghiêm trọng nhất — lộ khi so sánh 2 vụ án cách nhau đúng 75 vị
     trí thấy giống hệt nhau:** bản đầu chọn vật/địa điểm/nạn nhân bằng công
     thức tuyến tính theo chỉ số vụ án (`(i*3+2) % 15` kiểu vậy) — mọi công
     thức tuyến tính trên 1 kho cùng cỡ (15) LẶP LẠI đúng chu kỳ 15, và vì
     nghi phạm dùng kho cỡ 20, `LCM(15,20)=60` nên vụ án thứ N và N+60 sẽ
     TRÙNG HOÀN TOÀN (cùng nghi phạm, cùng mọi thứ). Chuyển hẳn sang chọn
     ngẫu nhiên (`Math.random()`) — không cần tái lập được giữa các lần seed
     (seed vốn idempotent-skip, chỉ cần đa dạng trong 1 lần chạy).
  4. Sau khi chuyển sang random, tên vụ án (chỉ ghép vật+địa điểm) vẫn trùng
     14/102 lần do không gian tổ hợp nhỏ (15×15=225) — thêm tên nạn nhân vào
     tên vụ án (15×15×15=3375), giảm còn 1/102 lần trùng.
- [x] **Phát hiện thêm (không phải bug do phiên này, chỉ là nhận ra):**
  `tsconfig.json`'s `include` chỉ có `["src"]` — `npx tsc --noEmit` KHÔNG BAO
  GIỜ thật sự kiểm tra `prisma/seed.ts`, kể cả ở các mục trước trong phiên
  này báo "tsc sạch" cho seed.ts. Việc kiểm tra thật sự luôn đến từ chạy
  `npm run prisma:seed` trực tiếp (bắt lỗi cú pháp/redeclare) + soi nội dung
  qua API — không phải từ tsc. Không sửa (đổi `include` phạm vi rộng hơn có
  thể kéo theo tsc phải hiểu cả file config JS khác, ngoài phạm vi lần này),
  chỉ ghi lại để nhớ đường kiểm tra đúng cho seed.ts sau này.
- [x] Verify: seed chạy thật ra "102 Detective cases with 400 rounds"; lấy
  mẫu ngẫu nhiên 15 vụ án sinh tự động, kiểm tra logic (đáp án vòng 3 phải
  khớp `correctSuspect` vòng buộc tội) qua API — cả 15/15 đúng; đếm tên vụ án
  trùng — 101/102 duy nhất; Playwright mở danh sách vụ án (8 thẻ hiện gọn
  gàng, đủ màu/emoji/mô tả), chơi thử 1 vụ án sinh tự động — vòng 1 hiện đúng
  lời khai + 3 lựa chọn cùng phạm trù, "Bước 1/4".

### 🦜 Vẹt Con Tập Nói — thêm 100 câu về 40 pet có sẵn trong app (2026-08-28)
User yêu cầu 100 "hội thoại" gắn với danh sách pet ĐANG CÓ trong game (không
phải nhân vật bịa mới) — tái dùng thẳng `PETS` (mảng 40 pet thật đã seed ở
Pet Shop: tên, key, loài tiếng Việt, độ hiếm) thay vì tạo nhân vật mới, để
luyện nói cảm giác gắn liền với pet bé đang thật sự nuôi trong app.
- [x] 3 mẫu câu ngắn/pet: "This is {tên}." · "{tên} is a/an {loài}." · "I love
  {tên}!" (mẫu 3 chỉ dành cho pet Epic/Legendary + 4 pet khởi đầu Common —
  Buddy/Mimi/Poppy/Snowy — cho cảm giác "được cưng" nhiều hơn) → đúng
  13×2+4×1 (Common) + 11×2 (Rare) + 8×3 (Epic) + 8×3 (Legendary) = 100 câu,
  chia 4 topic mới theo độ hiếm: Thú Cưng Phổ Biến/Hiếm/Sử Thi/Huyền Thoại.
- [x] Tự dịch 40 mô tả loài sang EN/JA/KO (`PET_SPECIES_EN_JA_KO`) — giữ đơn
  giản đúng tinh thần bản tiếng Việt gốc (vd "Chó Golden" → "golden dog", không
  dịch thuật ngữ giống chó thật "golden retriever").
- [x] **2 bug tự phát hiện qua đọc trực tiếp nội dung sinh ra (không phải chỉ
  đọc code):**
  1. `EchoParrotRoundSeed`'s `phonetic` là field BẮT BUỘC trong interface cục
     bộ (dù cột DB vốn nullable) — 100 câu đầy đủ câu (không phải 1 từ) không
     có phiên âm IPA hợp lý để điền → đổi field thành tuỳ chọn (`phonetic?`).
  2. **"Frostwing is a ice dragon."** (thiếu "an") — mẫu câu 2 hardcode "a"
     không kiểm tra âm đầu. Tái dùng đúng hàm `articleFor()` đã viết cho phần
     Bài học/Detective trước đó — nhưng phải special-case thêm "unicorn"
     (Stella) vì nó viết bằng nguyên âm nhưng ĐỌC bằng phụ âm "y" ("a unicorn"
     mới đúng, không phải "an unicorn") — `articleFor()` chỉ nhìn chữ cái nên
     tự nó sẽ sai chỗ này nếu không special-case.
- [x] Verify: seed chạy thật ra "6 Echo Parrot topics with 100 rounds" (2 topic
  gốc + 4 topic pet, đúng 30/22/24/24 câu theo độ hiếm); soi qua API xác nhận
  cả 3 trường hợp mạo từ oái oăm đều đúng (Frostwing→"an ice dragon", Mimi→
  "an orange cat", Glacio→"an ice bear", Stella vẫn giữ "a unicorn"); Playwright
  mở "Vẹt Con Tập Nói" thấy đủ 6 thẻ chủ đề đúng số từ vựng, chơi thử topic
  Huyền Thoại — hiện đúng "This is Frostwing." + bản dịch + nút micro, "Từ số
  1/24".

**Cập nhật (cùng ngày) — mở rộng lên 360 câu + thêm ảnh pet minh hoạ:** user
thấy 100 câu "khá ít", yêu cầu thêm 200-300 câu nữa, "bên trong dùng pet để
làm hình minh hoạ".
- [x] **Tính năng thật, không chỉ nội dung:** thêm cột `EchoParrotRound.petKey`
  (String?, khớp lỏng `Pet.key` — cùng kiểu "key tham chiếu không FK cứng"
  như `Vocab.worldId`) — migration `add_echo_parrot_pet_key`. Cập nhật Zod
  schema, `catalog.service.ts` trả thêm field này, type `EchoParrotRoundData`
  (FE) thêm `petKey`. `EchoParrot.tsx` hiện `<PetPortrait petId={petKey} .../>`
  thật (ảnh pet thật trong `frontend/public/pets/`, không phải ảnh minh hoạ
  giả) phía trên bong bóng thoại KHI round có gắn `petKey`; round từ vựng
  chung (Cat/Hello!...) không có `petKey` thì không hiện gì, không vỡ layout.
- [x] **Thiết kế lại nội dung cho ĐỀU** — bỏ luật cũ "chỉ pet Epic/Legendary +
  4 pet khởi đầu mới có câu thứ 3", thay bằng ĐÚNG 9 mẫu câu như nhau cho
  CẢ 40 pet (This is X / X is a species / I love X / Look at X / X is so
  cute / Good morning X / X likes to play / Come here X / X is my best
  friend) → 40×9 = 360 câu (từ 100 lên 360, +260 câu, đúng khoảng "200-300"
  user yêu cầu). Xoá sạch 4 topic pet cũ, seed lại từ đầu bằng thiết kế mới
  (không giữ lẫn 2 thiết kế cũ/mới).
- [x] Verify: seed chạy ra "6 Echo Parrot topics with 360 rounds" (117/99/72/72
  theo Common/Rare/Epic/Legendary — đúng 9×13/9×11/9×8/9×8); soi API xác nhận
  đủ 9 câu + đúng `petKey` cho Buddy; Playwright chơi thử topic Epic — hiện
  đúng ảnh Gargo thật (quái nhỏ tím) phía trên bong bóng thoại, "Từ số 1/72";
  chơi lại topic "Động Vật" gốc (không có petKey) — xác nhận KHÔNG hồi quy,
  vẫn hiện đúng như trước (chữ "Cat" + IPA + nghĩa, không có ảnh thừa/vỡ).

### 💬 Trò Chuyện Cùng Bạn Thú — thêm 100 chủ đề, dễ → khó (2026-08-28)
User thấy 4 chủ đề ban đầu "cũng ít data", yêu cầu thêm 100 chủ đề mới, sắp
xếp từ dễ đến khó.
- [x] **1 template hội thoại tái dùng** (3 lượt, đúng khuôn 4 chủ đề tay đã
  viết: "Bạn có thích X?" → "X yêu thích nhất của bạn là gì?" → "Vì sao bạn
  thích X?"), tham số hoá bằng **10 CHỦ ĐỀ**: 8 tái dùng thẳng `VOCAB_TOPICS`
  đã dịch sẵn (animals/colors/numbers/food/weather/clothes/transport — bỏ
  "school"/"body" vì "bạn thích bạn học nào nhất?"/"bộ phận cơ thể yêu
  thích?" nghe kỳ quặc), 2 danh sách mới (toys, sports, tự dịch ~10 từ mỗi
  loại), + "family" dùng cách hỏi RIÊNG (không xếp hạng thành viên gia đình —
  "Ai trong gia đình bạn?" thay vì "Ai là người bạn thích nhất?", tránh so
  sánh người thân). Mỗi chủ đề = 10 topic (1 topic/từ) × 10 chủ đề = 100.
- [x] **Độ khó THẬT, không chỉ nhãn** — tái dùng đúng nguyên tắc đã dùng cho
  Bài học: Dễ = 2 đáp án nhiễu là 2 trong 24 câu "chẳng liên quan gì" ĐÃ CÓ
  SẴN (tái dùng verbatim từ 4 chủ đề tay viết, không soạn/dịch thêm); Khó = 2
  đáp án nhiễu là CÙNG mẫu câu nhưng đổi từ khác trong CÙNG chủ đề (vd "My
  favorite animal is a tiger." vs "...a monkey."/"...a bird." — bé phải nghe
  đúng TỪ CỤ THỂ, không chỉ nhận ra khuôn câu); Trung bình = trộn 1 mỗi loại.
  3 Dễ + 4 Trung bình + 3 Khó từ/chủ đề × 10 chủ đề = 100, xếp `order` theo
  khối Dễ→Trung bình→Khó toàn cục (không theo từng chủ đề riêng) để picker
  hiện đúng thứ tự dễ đến khó xuyên suốt.
- [x] **1 bug tự phát hiện qua đọc trực tiếp nội dung sinh ra:** "Why do you
  like tiger?"/"Tiger is wonderful!" thiếu mạo từ xác định ("the tiger") cho
  các chủ đề danh từ đếm được (animal/food/clothes/vehicle/toy) — phân biệt
  với chủ đề không đếm được (color/number/weather/sport/family) vốn đúng sẵn
  ("Why do you like red?"). Thêm biến `theArticle` xử lý đúng cả 2 nhánh.
- [x] Verify: seed chạy ra "104 Chat with Buddy topics with 300 rounds" (4 gốc
  + 100 mới × 3 lượt); soi API xác nhận thứ tự global đúng Dễ(30)→Trung
  bình(40)→Khó(30); soi 1 topic Khó ("Hổ") xác nhận đáp án nhiễu Round 2 đúng
  near-miss cùng phạm trù, ngữ pháp "the tiger"/"The tiger is wonderful!"
  đúng sau khi sửa; soi topic "gia đình" xác nhận không có vấn đề "xếp hạng
  người thân"; Playwright chơi thật topic "Hổ (Khó)" — Round 1 xáo trộn đúng
  (đáp án đúng không luôn ở vị trí đầu), chọn đúng nhận +10 coin, Round 2
  hiện đúng 3 lựa chọn near-miss cùng phạm trù động vật.

### 📚 Bài học — review toàn bộ theo yêu cầu user, sửa lỗi thật (2026-08-30)

User hỏi "Về phần bài học thì sao, giúp tôi review toàn bộ, add thêm nếu cần"
(tiếp nối sau review release-readiness tổng thể ở `Release.md`). Đọc lại toàn
bộ `WORLD_LESSONS`/`WORLD_BONUS_TOPICS`/`genQuestions()` trong `seed.ts` +
`Lesson.tsx`/`WorldLessons.tsx`/luồng chọn bài học trong `App.tsx`, rồi đối
chiếu với dữ liệu THẬT trong DB (không chỉ đọc code) bằng 1 script audit +
1 script quét ngữ pháp tự động trên toàn bộ 906 câu hỏi.

- [x] **Xác nhận số lượng đã đủ, không cần thêm bài mới**: 6 world × 10 bài
  (Bài 1 Dễ, Bài 2 Trung bình, Bài 3 Khó — 3 bài gốc tay viết — + Bài 4-10 là
  7 chủ đề phụ sinh bằng `genQuestions()`) = 60 bài, 906 câu hỏi, khớp đúng
  thiết kế đã ghi ở mục "Bài học — nhân 10 lần" phía trên. 3 bài gốc tay viết
  (Bài 1/2/3) đọc lại thấy ngữ pháp sạch hoàn toàn; **vấn đề thật nằm ở 798
  câu do generator sinh ra** (Bài 4-10) — genuine bug, không phải thiếu nội
  dung.
- [x] **Sửa lỗi hiển thị "Topic: Nature" cứng ở `Lesson.tsx`** — dòng này
  trước giờ LUÔN hiện "Topic: Nature" bất kể đang học world/bài nào (chỉ tình
  cờ đúng cho đúng bài đầu tiên của Forest), vì component không hề nhận
  thông tin world/lesson nào cả. Thêm prop `topicLabel?` (dùng lại đúng
  `currentLessonLabel` — "{World} · {Lesson title}" — đã có sẵn trong
  `App.tsx` từ tính năng Thông báo, chỉ chưa được truyền vào `<Lesson>`)
- [x] **Sửa 3 nhóm lỗi ngữ pháp thật trong `genQuestions()`** (helper dùng
  chung `needsNoArticle()`/`articleFor()` cũng được `buildDetectiveCase()`/
  `petEchoRounds()`/`buildChatTopic()` dùng lại — sửa ở đây fix chung cho mọi
  nơi), phát hiện bằng cách generate lại toàn bộ 798 prompt ra ngoài rồi đọc
  từng dòng thật (không chỉ nhìn code):
  1. Heuristic "kết thúc bằng s → danh từ số nhiều → bỏ mạo từ" bắt nhầm 3
     danh từ số ít: "Which one is octopus?"/"walrus?"/"bus?" (thiếu
     "an"/"a"/"a") — thêm `FORCE_ARTICLE_WORDS` chặn trước heuristic này
  2. `articleFor()` là heuristic thuần theo CHỮ CÁI đầu, sai với từ có ÂM phụ
     âm dù viết bằng nguyên âm: "Which one is an unicorn?"/"an UFO?" (đúng
     phải là "a") — thêm `CONSONANT_SOUND_WORDS`, dùng chung được với case
     "unicorn" mà `petEchoRounds()` đã tự vá riêng lẻ trước đó
  3. Danh từ không đếm được bị heuristic bỏ sót nên vẫn bị gắn "a/an" sai:
     8 môn học (science/history/biology/chemistry/geometry/geography/
     literature/algebra), 3 từ khác (chalk/thunder/hail), 21 từ số đếm
     (eleven..ninety/hundred/thousand/million/billion) đọc "a twelve?"/"a
     hundred?" nghe rất gượng — thêm hết vào `NO_ARTICLE_WORDS`
  4. Tên hành tinh viết hoa (danh từ riêng, không bao giờ có mạo từ) bị 2
     template áp mạo từ/"the" sai: "Find the Mercury!"/"Find the Jupiter!"/
     "Find the Uranus!"/"Find the Pluto!" (thừa "the") và "Which one is a
     Saturn?"/"a Neptune?"/"a Moon?" (thừa mạo từ) — thêm `NO_THE_WORDS` cho
     nhánh "Find the X!", tận dụng lại `NO_ARTICLE_WORDS` cho nhánh "Which
     one is X?" (Venus/Mars/Earth/Sun trong cùng bài học này vốn đã đúng
     "tình cờ" từ trước — Venus/Mars vì trùng đúng heuristic "kết thúc s",
     Earth/Sun vì "the Earth"/"the Sun" vốn là cách dùng chuẩn nên "Find the
     Earth!"/"Find the Sun!" không cần sửa)
- [x] **Verify bằng dữ liệu THẬT, không chỉ code**: xoá 42 bài Bài 4-10 (chỉ
  42 bài do generator sinh, giữ nguyên 18 bài Bài 1/2/3 tay viết) + toàn bộ
  câu hỏi con qua script `tsx` một lần, seed lại (`npm run prisma:seed` chạy
  sạch, không lỗi), đọc lại DB xác nhận cả 19 câu nghi vấn ra đúng: "an
  octopus"/"a walrus"/"a bus"/"a unicorn"/"a UFO"/"science"/"history"/
  "biology"/"geometry"/"chalk"/"thunder"/"hail"/"Find Mercury!"/"Find
  Jupiter!"/"Find Uranus!"/"Find Pluto!"/"Saturn"/"Neptune"/"Moon" đều đúng;
  quét tự động toàn bộ 410 câu dạng "Which one is a/an X?" trong 906 câu —
  còn đúng 2 "mismatch" theo chữ cái là "a unicorn"/"a UFO", nhưng đó chính
  là 2 ngoại lệ cố ý theo ÂM đọc (đúng như thiết kế); tổng số bài/câu hỏi
  không đổi (60 bài / 906 câu) — xác nhận không mất/nhân đôi dữ liệu. `tsc
  -b`/`tsc --noEmit` (backend)/`oxlint` sạch cả 2 phía.
- **Ghi nhận, không phải lỗi — đường cong độ khó của Bài 4-10:** cả 7 bài
  sinh thêm đều gắn nhãn "(Trung bình)" — đúng với cơ chế thật của chúng
  (nhiễu cùng phạm trù, không trộn câu hỏi thuộc tính như Bài 3 "(Khó)"),
  nên sau khi học xong Bài 3 "(Khó)" thì 7 bài tiếp theo lùi lại mức Trung
  bình. Đây là lựa chọn có chủ đích ghi rõ trong comment `seed.ts` từ đợt
  làm trước (mở rộng BỀ RỘNG từ vựng, không phải nối dài đường cong khó dần)
  — không sửa, chỉ ghi lại rõ ràng cho user biết nếu sau này muốn thêm hẳn 1
  lớp "(Khó)" nữa cho các chủ đề phụ.
- **Việc còn tồn:** chưa build/cài lại app lên điện thoại thật với 2 thay đổi
  trên (`genQuestions()`'s output + `Lesson.tsx`'s `topicLabel`).

### 🐉 Flappy Dragon — thêm đường cong độ khó (2026-08-30)
User: "hiệu ứng vỗ cánh giữ nguyên, cây hiển thị cần từ dễ đến khó, giúp user
dễ chơi hơn". Trước đó mọi cây (ống chướng ngại) đều khó y hệt nhau ngay từ
cây đầu tiên (khe hở 34%, tốc độ 27, spawn mỗi 1.65s cố định).
- [x] `FlappyDragon.tsx` — thêm `GAP_HEIGHT_EASY/HARD`, `TREE_SPEED_EASY/
  HARD`, `SPAWN_INTERVAL_EASY/HARD` + `difficultyProgress()` nội suy tuyến
  tính theo **số cây đã vượt qua** (đạt tối đa ở cây thứ 8). Mốc "HARD" cố
  tình đặt bằng ĐÚNG giá trị cũ (34/27/1.65s) để không đổi trải nghiệm người
  chơi quen — chỉ 8 cây đầu dễ hơn. `gapHeight` chốt vào từng cây NGAY LÚC
  SPAWN (không đổi sau khi đã hiện trên màn hình) để tránh khe hở tự co lại
  giữa chừng khi rồng đang bay tới. Verify tay: ở progress=1, công thức tái
  tạo chính xác dải gapY cũ (27-69%); `tsc -b`/`oxlint` sạch.
  - Không đụng hiệu ứng vỗ cánh (ảnh `ember-wing-flap-v6.webp` xoay theo
    velocity) theo đúng yêu cầu "không cần add thêm".

### 🐉 Pet Ember — bỏ ngưỡng level cho hiệu ứng vỗ cánh tự nhiên (2026-08-30)
User: "Pet Dragon có thể để đứng im => vỗ cánh tự nhiên như đã có". Trước đó
`PetPortrait.tsx` chỉ dùng file `ember-wing-flap-v6.webp` (đúng file Flappy
Dragon dùng, vỗ cánh tự lặp trong chính file webp) cho pet Ember khi
**level ≥ 20** — dưới mức đó là ảnh tĩnh + CSS bồng bềnh chung.
- [x] Bỏ hẳn điều kiện `level >= 20` — Ember giờ vỗ cánh tự nhiên ở MỌI level
  (trừ giai đoạn trứng), đứng yên vẫn tự động vỗ cánh vì animation nằm sẵn
  trong file webp, không cần thêm logic gì. Vì `PetPortrait` dùng chung toàn
  app, áp dụng luôn cho mọi màn hiện pet Ember (Pet Care/Bộ sưu tập/Nông
  trại...). Hành vi ở level ≥ 20 giữ nguyên y hệt trước. `tsc -b`/`oxlint`
  sạch.

### 🔍 Review "Nuôi pet / Làm nhiệm vụ / Học bài" toàn app (2026-09-02)
User: "Giúp tôi review toàn bộ app, Chức năng nuôi pet, làm nhiệm vụ, học
bài, và cập nhật lại Tasks.md". Trước khi review, phát hiện rất nhiều tính
năng đã được xây dựng **ngoài các phiên làm việc trước** (không qua tôi, có
lẽ user tự code hoặc phiên Claude Code khác) và **chưa từng được ghi vào
TASKS.md**: 2 world mới (🎓 IELTS Academy, 💼 TOEIC Office, 4 bài/world),
4 pet mới (dori/haetae/kitsune/maru — theo mô-típ thần thoại Hàn/Nhật), 8
món đồ ăn mới (bungeoppang/songpyeon/sakura-mochi/taiyaki...), tính năng
**đổi tên pet** (`ve-doi-ten-pet`, vé 25 gem), màn hình mới **🌾 Nông trại
Pet** (`PetRanch.tsx` — xem toàn bộ pet đã sở hữu đi lại/bay lượn trên 1 cảnh
trại), **Flappy Dragon** trở thành mini-game thật có backend riêng
(`flappyDragon.service.ts`), và quan trọng nhất: **9 mini-game trước đây chỉ
đếm coin phiên chơi (Memory Match, Word Catch, English Shop/Home, Word Train,
Detective, Echo Parrot, Chat Buddy, Đọc truyện) giờ đã cộng thật vào
`Progress.coins`/pet XP** qua 1 service dùng chung mới
(`activityReward.service.ts`) — đúng gap đã ghi trong `Release.md` ("cân nhắc
thống nhất tất cả game đều cộng thật") giờ đã được giải quyết. Đã đọc lại kỹ
toàn bộ diff (41 file, +2408/-798 dòng) + Lesson/Pet Care/Quest liên quan,
seed lại (44 pet/8 world/45 item/3 quest, sạch), `tsc -b`/`npm run typecheck`
(backend)/`oxlint` sạch cả 2 phía trước VÀ sau khi sửa.

**Bug tìm thấy + đã sửa (4 lỗi thật, verify bằng cách đọc lại dữ liệu/luồng
code thật, không chỉ đoán):**
- [x] **`LessonPicker.tsx` — badge độ khó đoán sai, mâu thuẫn ngay với tiêu
  đề hiện cạnh nó**: badge cũ đoán độ khó theo VỊ TRÍ trong danh sách
  (`index < 3` → "Dễ", `< 7` → "Trung bình", còn lại → "Nâng cao") thay vì
  đọc nhãn "(Trung bình)"/"(Khó)" đã có sẵn ngay trong tiêu đề bài học. Với
  dữ liệu thật (Bài 1 Dễ/Bài 2 TB/Bài 3 Khó/Bài 4-10 TB), kết quả sai be bét:
  thẻ "Bài 3: Thiên nhiên kỳ diệu (**Khó**)" bị gắn badge "**Dễ**" (nằm ở vị
  trí thứ 3), thẻ Bài 8-10 (thật ra là TB) bị gắn "Nâng cao". Sửa bằng cách
  đọc trực tiếp `/\(Khó\)/`/`/\(Trung bình\)/` từ chính `lesson.title` —
  không đoán theo vị trí nữa, badge không bao giờ có thể mâu thuẫn với tiêu
  đề vì cùng lấy từ 1 nguồn. Áp dụng luôn màu badge số thứ tự (trước đó cũng
  dùng chung công thức đoán sai).
- [x] **`PetCollection.tsx` không hiện tên pet đã đổi** — tính năng đổi tên
  pet mới (`renameActivePet()`) đã cập nhật đúng ở Pet Care/Nông trại Pet
  (dùng `petStatsById[id]?.customName`), nhưng màn "Bộ sưu tập pet" vẫn hiện
  cứng tên loài (`p.name`, vd "Ember") dù có nhận `petStatsById` làm prop
  sẵn — chỉ đơn giản chưa dùng tới. Kết quả: đổi tên Ember thành "Mochi" thì
  Pet Care/Nông trại hiện đúng "Mochi", riêng Bộ sưu tập vẫn hiện "Ember".
  Sửa: `displayName = (isOwned && petStatsById[p.id]?.customName) || p.name`
  — chỉ áp dụng cho pet ĐÃ SỞ HỮU (pet chưa mở khoá không có `PetStats`/tên
  riêng). Đã rà thêm 3 chỗ khác dùng `PETS.find()`/`pet.name` (`WordRpg.tsx`
  hiện quái vật hầm ngục dùng SPECIES pet làm hình mẫu — không phải pet của
  chính bé, không cần đổi; `FusionCelebration.tsx` hiện pet VỪA MỚI phối ra —
  chưa từng được đặt tên riêng, dùng tên loài là đúng) — không có chỗ nào
  khác bị thiếu.
- [x] **`handleCareAction()` (App.tsx) không làm mới cache "Nhiệm vụ hôm
  nay"** — mọi hành động chăm pet (cho ăn/tắm/chơi/ngủ/vuốt ve) đều cộng
  tiến độ nhiệm vụ "Chăm pet 3 lần" THẬT ở server (`careForPet()` gọi
  `bumpQuestProgress(..., "petCare", 1)`), nhưng phía frontend chỉ xoá cache
  `dailyQuests` (buộc tải lại) khi bấm THẲNG vào thẻ nhiệm vụ đó
  (`handleOpenQuest()`) — nếu vào Pet Care bằng đường khác (nút "Pet Care" ở
  Home, không qua thẻ nhiệm vụ), quay lại Home sẽ thấy thẻ "Nhiệm vụ hôm nay"
  hiện tiến độ CŨ dù đã thật sự chăm pet xong. Sửa: thêm `setDailyQuests
  (null)` ngay trong `handleCareAction()`, đúng mẫu đã dùng cho
  `handleActivityComplete()`/lesson `onComplete` — luôn làm mới bất kể vào
  Pet Care bằng đường nào.
- [x] **`handleActivityComplete()` không bắt lỗi** — 9 mini-game gọi hàm này
  qua `onComplete={() => handleActivityComplete(...)}` (fire-and-forget,
  không ai `await`/`catch`); nếu request `rewardActivity()` lỗi mạng, lỗi bị
  nuốt hoàn toàn thành unhandled rejection — bé thấy đúng màn "Bạn thắng!"
  nhưng KHÔNG nhận được coin, không có dấu vết gì để biết vì sao. Thêm
  try/catch + `console.warn`, đúng mẫu đã dùng cho các lời gọi
  fire-and-forget khác trong `App.tsx`.

**Phát hiện, CHƯA sửa — cần user quyết định (ảnh hưởng thiết kế kinh tế
trong game, không phải lỗi kỹ thuật đơn thuần):**
- [ ] **`rewardActivity()`/`rewardFlappyDragon()` không giới hạn số lần/ngày
  — 9 mini-game + Flappy Dragon giờ đều cộng COIN THẬT mỗi lần hoàn thành,
  nhưng mọi game này vẫn giữ đúng triết lý "không phạt, chơi lại thoải mái"
  (nút "Chơi lại"/"Học lại" luôn có, không khoá). Nghĩa là 1 bé có thể đứng ở
  màn "Bạn thắng!" của 1 topic bất kỳ (vd Word Train, +100 coin/lượt) rồi bấm
  "Chơi lại" liên tục để cày coin thật KHÔNG GIỚI HẠN — không cần biết
  API/devtools gì cả, chỉ cần bấm nút có sẵn trên UI. Khác hẳn Lesson (bối
  cảnh gốc của kiểu "tin client" này) — Lesson vẫn chỉ có 1 bài/lượt học,
  không phải vấn đề mới; nhưng giờ có tới 9+1 game khác cùng lỗ hổng, quy mô
  lớn hơn hẳn. Đã có sẵn 2 pattern chống double-claim trong app dùng được
  ngay (`BattlePassClaim`/`ChildPackageClaim` — 1 dòng DB unique constraint
  chặn nhận trùng): có thể áp dụng kiểu "mỗi topic/mỗi bé chỉ cộng coin thật
  1 lần/ngày, chơi lại thêm trong ngày đó chỉ để luyện tập" nếu user muốn
  chặn. Chưa tự sửa vì đây là quyết định thiết kế kinh tế, không phải bug kỹ
  thuật rõ ràng đúng/sai.

**Xác nhận sạch, không có lỗi (đọc kỹ nhưng không cần sửa):**
- Quest system (`quest.service.ts`/`quest.routes.ts`): claim server-tự-check
  lại (không tin client báo "đã xong"), chống nhận trùng qua cờ `claimed`,
  chống tràn int32 qua `clampToInt32`, endpoint client-facing
  `POST /quests/progress` CỐ TÌNH không nhận `trackKind: "petCare"` (chỉ
  "lessons"/"miniGame", cap amount 1-5) — đúng thiết kế, `petCare` chỉ được
  cộng từ chính `careForPet()` phía server, không thể giả mạo qua endpoint
  này.
- `petStats.service.ts`/`inventory.service.ts`: XP curve, `careForPet()`,
  `renameActivePet()` (validate độ dài tên 2-16 ký tự cả 2 phía, kiểm tra
  đúng loại vé qua `effect.stat === "renamePet"`, trừ vé + đổi tên trong 1
  transaction) — không có lỗi.
- Toàn bộ 9 mini-game xác nhận `onComplete`/`onWin` chỉ bắn ĐÚNG 1 LẦN ở thời
  điểm hoàn thành thật (không phải mỗi câu/mỗi vòng) — nhất quán, không có
  game nào bắn thừa.
- Migration `add_pet_custom_name` đã áp dụng đầy đủ (`prisma migrate
  status` → "Database schema is up to date").
- **Việc còn tồn:** 2 world mới (IELTS/TOEIC) mới có 4 bài/world (so với 10
  bài của 6 world cũ) — nội dung đang xây dở, không phải lỗi; vật phẩm test
  "Đói ngay (Test)" (1 coin) vẫn còn sống trong Shop thật (đã ghi trong
  `Release.md`, vẫn chưa gỡ); toàn bộ thay đổi trong mục này (kể cả của
  người khác, không phải chỉ của tôi) vẫn CHƯA build/cài lại lên điện thoại
  thật, và CHƯA commit/push (xem `Release.md`'s Blocker #8 — khối lượng
  chưa lưu giờ còn lớn hơn nhiều so với lúc viết Release.md).

---

## Việc còn tồn / có thể làm tiếp

### 6 ý tưởng mini-game mới — bù các phương pháp học tiếng Anh còn thiếu (2026-08-22) — chưa làm, chờ yêu cầu tiếp
Rà lại toàn bộ game hiện có (nghĩa từ vựng, nghe TTS, đọc hiểu, chính tả, trật
tự câu, giới từ không gian, ôn ngắt quãng SRS, đấu thi) thấy thiếu 7 phương
pháp học hiệu quả đã biết trong giảng dạy ngôn ngữ. Mỗi ý tưởng dưới đây nhắm
đúng 1 phương pháp, kiến trúc dự kiến đều theo đúng khuôn "topic + round" đã
dùng xuyên suốt (Word Catch/Shop/Home/RPG/Train/Detective). (🦜 Vẹt Con Tập
Nói — ý tưởng thứ 7 — và 💬 Trò Chuyện Cùng Bạn Thú — ý tưởng thứ 2 — đã hoàn
thành, xem mục "Đã hoàn thành" ở trên.)

- [ ] **🔤 Vườn Âm Thanh (Sound Garden)** — dạy **ngữ âm học (phonics)**: quy luật "chữ nào phát âm ra sao" (vd "sh" → /ʃ/, "ee" → /iː/), khác hẳn kiểu "nhìn cả từ nhớ nghĩa" (whole-word) mà Memory Match/Word Catch đang dùng. Đây là phương pháp được nghiên cứu chứng minh hiệu quả nhất giúp trẻ tự đọc được từ mới chưa từng gặp. Nghe 1 âm mẫu → chọn đúng hình/từ chứa âm đó trong nhiều lựa chọn (hoặc chiều ngược: nghe từ, chọn đúng tổ hợp chữ cái tạo ra âm nghe được). Topic = 1 nhóm âm (vd "digraphs: sh/ch/th", "long vowels: ee/oo/ai"), round = 1 câu hỏi âm–chữ. Không có rủi ro kỹ thuật gì đặc biệt (trắc nghiệm + TTS y hệt các game khác), điểm khó thật sự là **soạn nội dung ngữ âm học đúng chuẩn** (cần kiến thức phonics thật, không tự bịa được).
- [ ] **🎧 Tai Thính (Sharp Ears)** — luyện **nghe chép chính tả (dictation)**, chủ động hơn hẳn "nghe rồi chọn hình" hiện tại (chỉ cần đoán mò 1/4 xác suất đúng). Nghe TTS đọc 1 từ/câu ngắn → bé gõ lại đúng chính tả (hoặc với bé nhỏ hơn: chạm đúng thứ tự các chữ cái nghe được, giống Word Train's "fill" nhưng nghe thay vì đọc gợi ý tiếng Việt). **Cân nhắc:** có thể làm thành 1 `kind` thứ 3 ("dictation") ngay trong `WordTrainRound` thay vì tách game riêng, vì kiến trúc gần như giống hệt — quyết định khi bắt tay vào làm.
- [ ] **🖼️ Họa Sĩ Kể Chuyện (Story Painter)** — luyện **viết tự do có hướng dẫn**, khoảng trống thật sự vì mọi game hiện tại đều là chọn/kéo thả, chưa có bài nào yêu cầu bé tự tạo ra câu. Cho 1 bức tranh + 1 số từ gợi ý (word bank) → bé gõ 1 câu mô tả bức tranh, dùng ít nhất N từ gợi ý. Bản đầu chấm đơn giản (kiểm tra có chứa đúng từ khoá + độ dài hợp lý, không chấm ngữ pháp/ý nghĩa thật — việc đó cần gọi AI để chấm, phức tạp hơn hẳn, để dành nâng cấp sau).
- [ ] **🔧 Xưởng Sửa Câu (Grammar Garage)** — dạy **ngữ pháp có hệ thống** (số nhiều, thì hiện tại đơn giản, mạo từ a/an/the, giới từ thời gian...) — hiện tại toàn bộ app tập trung từ vựng + 1 chút cú pháp (Word Train's xáo câu), chưa có game riêng cho điểm ngữ pháp cụ thể. Cho 1 câu có 1 chỗ trống ngữ pháp (vd "She ___ to school every day.") → chọn đúng dạng từ trong nhiều lựa chọn ("go"/"goes"/"going"). Topic = 1 điểm ngữ pháp, kiến trúc y hệt Word Catch (topic + round có `options`/`answer`) — game dễ làm nhất trong 7 cái này về mặt kỹ thuật, điểm khó là soạn đúng chuỗi điểm ngữ pháp phù hợp trình độ trẻ em.
- [ ] **🎬 Rạp Chiếu Phim Mini (Mini Cinema)** — cho tiếp xúc **input tự nhiên** (video/audio thật, không phải TTS tổng hợp) theo lý thuyết "comprehensible input" (Krashen) — xem 1 đoạn video/nghe 1 đoạn audio ngắn có ngữ cảnh thật (hội thoại 2 người, bài hát thiếu nhi...) kèm phụ đề song ngữ, rồi trả lời vài câu hỏi hiểu nội dung. **Điểm nghẽn chính giống hệt vụ mô hình 3D pet đã ghi ở dưới:** cần nguồn video/audio thật cho từng bài (mua bản quyền / tự quay dựng / thuê sản xuất) — việc tạo nội dung nằm ngoài khả năng của tôi, chỉ hỗ trợ được phần code player + câu hỏi đi kèm.

### Premium
*(Mục này đã cũ — 3/5 quyền lợi + nút "Khôi phục mua hàng" đã được làm thật từ
2026-08-26, xem mục "Premium — enforce thật 3/5 quyền lợi..." phía trên. Danh sách
dưới đây là đúng những gì THẬT SỰ còn tồn, đã cập nhật lại 2026-08-28.)*
- [x] ~~"Mở toàn bộ 6 vùng" quảng cáo sai~~ — **đã xử lý (2026-08-28)**: bỏ hẳn khỏi
  `PERKS` ở `Premium.tsx` (không sửa ngược lại bằng cách khoá lại world cho tài
  khoản miễn phí — đi ngược hướng đơn giản hoá WorldMap đã chọn trước đó). Đã hỏi
  user trước khi làm, chọn đúng phương án "bỏ hẳn"
- [ ] **"Báo cáo phụ huynh chi tiết"** — vẫn còn tồn, quy mô LỚN hơn hẳn 1 dòng
  perk: `ParentArea.tsx` toàn bộ (kể cả bản "Cơ bản" miễn phí) là số liệu mock cứng,
  cần xây hạ tầng theo dõi mới từ gốc (log thời gian học mỗi phiên, lịch sử đúng/sai
  từng từ...) rồi mới có gì để phân biệt "Cơ bản" vs "Chi tiết" — để dành làm riêng
  nếu user muốn, không phải việc "enforce nốt 1 perk" đơn giản
- [ ] "Tải bài học offline" — vẫn chưa đụng, giá trị thấp khi app mới có 6 lesson
  thật (mỗi world 1 bài, 5 câu hỏi) — chờ có nhiều nội dung hơn mới đáng làm
- [ ] Nếu sau này tích hợp App Store/Google Play thật: cần thay `PATCH /auth/me/premium` (bấm là bật ngay) bằng flow xác thực receipt + có hạn dùng thật thay vì cờ vĩnh viễn

### Nội dung học có sẵn
- [x] ~~Chỉ world "Forest" có 1 bài học mẫu~~ — **đã soạn thêm (2026-08-26)**: mỗi world
  Town/Beach/School/Castle/Space giờ có đúng 1 lesson "Bài 1" (5 câu hỏi/lesson, y hệt
  format "Find the X!"/"Which one is X?" của Forest) — `backend/prisma/seed.ts`'s
  `WORLD_LESSONS`, seed idempotent (chạy lại không tạo trùng, đã test 2 lần). Từ vựng
  tái dùng từ `VOCAB_TOPICS`/Từ điển đã dịch sẵn nơi hợp (Town→places, Beach→nature+
  food, School→school objects+numbers); Castle/Space soạn mới 5+5 từ (king/queen/
  knight/dragon/castle, và +planet) vì không có sẵn trong list nào
  - **Phát hiện phụ, đã hỏi và làm luôn:** nội dung seed đúng nhưng phát hiện lúc đó
    KHÔNG có đường nào trong UI dẫn tới 5 lesson này ("Học ngay" luôn cố định Forest,
    `WorldMap.tsx` đã xoá — y hệt tình huống "Mở toàn bộ 6 vùng" ở mục Premium bên
    dưới). Đã hỏi user muốn lộ ra kiểu gì — chọn "Thêm 1 ô vào GameHub" — nên đã làm
    luôn (xem mục ngay dưới đây)
- [x] **Thêm lối vào cho 5 lesson mới — "Chọn bài học" trong GameHub (2026-08-26)**:
  `pages/WorldLessons.tsx` (mới) — màn chọn world đơn giản (KHÔNG phải dựng lại
  WorldMap cũ: không sao/không khoá/không tiến độ, chỉ 6 thẻ world bấm là học ngay,
  đúng yêu cầu "đơn giản hơn WorldMap cũ"). `App.tsx` thêm state `lessonWorldKey`
  (mặc định "forest", trước đây là hằng số cố định `DEFAULT_LESSON_WORLD_KEY`) —
  `WorldLessons` chọn world nào thì set state này + reset lessonQuestions/lessonChoices
  rồi chuyển sang màn "lesson" y hệt luồng "Học ngay" có sẵn, chỉ khác world nguồn.
  Tile mới "Chọn bài học" thêm vào đầu `GameHub.tsx`'s TILES. Thêm bản dịch Anh/Nhật/
  Hàn cho 3 chuỗi mới (thêm tay vào translations.ts vì `t(tile.desc)` là gọi gián tiếp
  qua biến, script kiểm tra tự động không phát hiện được — đã biết giới hạn này từ các
  tile GameHub/More trước, không phải lỗi mới). Verify: `tsc -b`/`oxlint`/`build` sạch,
  0 key trùng; Playwright bấm Game → Chọn bài học → Space → xác nhận vào đúng lesson
  Space ("Find the star!" options Star/Moon/Sun/Cloud, đúng nội dung vừa seed)
- [x] ~~`Topics.tsx`/`SrsCard.tsx` vẫn dùng dữ liệu mock~~ — **đã giải quyết (2026-08-25/26)**: viết lại dùng
  dữ liệu thật qua `SavedWord` (Từ điển) thay vì `Vocab`/`ChildVocab` (2 bảng đó vẫn để nguyên, chưa dùng đến,
  xem mục "Từ điển offline + Từ đã lưu" ở trên) — quyết định có chủ đích, không phải thiếu sót
- [x] ~~`WorldMap.tsx` chưa có khái niệm "sao"...~~ — **hết liên quan (2026-08-25)**: `WorldMap.tsx` đã bị xoá hẳn,
  thay bằng tab "Game" → `GameHub.tsx` (xem mục "Đổi tab World → Game" ở trên); "Học ngay" từ Home giờ luôn học
  thẳng world Forest, không qua bước chọn zone nữa nên mục sao/tiến độ theo zone không còn áp dụng

### Nhỏ / cosmetic
- [ ] Chủ đề Memory Match không phải "Animals" dùng emoji thay vì ảnh minh hoạ (không có asset ảnh cho trái cây/màu sắc/số đếm...) — chấp nhận được, có thể thay ảnh thật sau
- [ ] Icon loa cạnh câu hỏi trong Word Catch cố tình để trang trí (không phát âm) vì sẽ lộ đáp án tiếng Anh trước khi bé chọn
- [ ] 16/40 pet chưa có ảnh buồn ở `frontend/public/pets/sad/` (angel, aqua, berry, blaze, ember, frostwing, gargo, glacio, mystic, nocty, papillon, prism, sprout, stella, umbra, void) — pet đói vẫn tự rơi về ảnh vui bình thường (không lỗi, chỉ thiếu cảm xúc riêng), xem mục "Pet đói → đổi sang ảnh buồn" ở trên

### Đấu trường
- [ ] Trạng thái trận đấu đang sống chỉ nằm trong bộ nhớ 1 process Node (`liveRoomManager.ts`) — nếu backend restart giữa trận thì trận đó mất, và scale ra nhiều instance sẽ cần chuyển sang cái gì đó dùng chung được (Redis pub/sub) thay vì `Map` trong RAM. Ước tính sơ bộ: 1000 phòng × 10 người = 10.000 WebSocket cùng lúc vẫn nhẹ cho 1 process (~300-400MB RAM), chỉ cần nâng `ulimit -n` và connection pool DB — xem cấu hình đề xuất đã trao đổi
- [ ] Chưa có màn "phòng đang chờ của tôi" để huỷ 1 phòng đã tạo nhưng không ai vào/host không bấm Bắt đầu — phòng cứ nằm ở trạng thái "waiting" mãi (vô hại, chỉ là rác DB)
- [ ] Coin thưởng đang cố định 50/trận cho mọi bài học — có thể cân nhắc thưởng theo độ khó/số câu hỏi sau này
- [ ] Phòng 3-10 người chỉ người #1 nhận coin, không ai khác được gì (kể cả #2, #3) — nếu sau này muốn hấp dẫn hơn có thể thêm thưởng giảm dần cho top 3
- [ ] Điểm rank (Đường đua Hạng) cố tình CHỈ áp dụng cho phòng đúng 2 người — phòng đông hơn không đổi rating, đây là quyết định có chủ đích (giữ nguyên công thức 1v1 đã tinh chỉnh), không phải thiếu sót

### Đường đua Hạng
- [ ] Chưa có hệ thống mùa (season)/reset định kỳ — rating cứ tích luỹ mãi mãi, chưa bàn tới việc có nên reset theo tháng/quý không
- [ ] Ngưỡng điểm mỗi hạng (0/200/400/700/1000/1500) và hệ số nhân coin (1×–2×) là con số đoán ban đầu, chưa có dữ liệu thật để tinh chỉnh
- [ ] Chưa có hiệu ứng ăn mừng riêng khi lên hạng (tier-up) — hiện chỉ hiện huy hiệu hạng mới ở màn kết quả, không có animation/pháo giấy đặc biệt so với 1 trận thắng bình thường
- [ ] Chưa có cách xem lịch sử đấu (đã thắng/thua ai, khi nào) — chỉ có điểm rating hiện tại và vị trí

### Đóng gói app di động (Capacitor → iOS/Android) — iOS đã chạy được trên máy thật, Android còn thiếu Android Studio
- [ ] Android chưa test trên thiết bị thật — cần cài Android Studio (hoặc JDK + Android SDK) trên máy trước
- [ ] `WorldMap.tsx` chưa thiết kế lại cho khung 1680 rộng hơn (world map riêng vẫn 1194×834 cũ) — lộ khoảng gradient trống bên phải lúc zoom mặc định, cần định vị lại 6 đảo/zone + path SVG nối chúng cho khung mới
- [ ] Test lại các API trình duyệt nhạy cảm với WebView: audio TTS (`new Audio()` + autoplay), fallback Web Speech API, JWT refresh khi app resume từ background — chưa test kỹ trên app thật
- [ ] **iOS lên App Store thật:** cần tài khoản Apple Developer trả phí ($99/năm) — hiện đang dùng Apple ID thường (miễn phí, app tự hết hạn 7 ngày) để test tạm; đã ghi đủ bước nâng cấp lên TestFlight khi có tài khoản trả phí trong `frontend/MOBILE_BUILD.md`
- [ ] **Android lên Google Play thật:** cần tạo keystore ký bản release + tài khoản Google Play Console ($25 trả 1 lần) — sideload APK debug trực tiếp là đủ để test tạm, chưa cần thiết ngay
- [ ] Token đăng nhập hiện lưu ở `localStorage` (`tokenStorage.ts`) — cân nhắc chuyển sang `@capacitor/preferences` (Keychain/Keystore native) trước khi release rộng rãi (không bắt buộc để test)
- [ ] Trước khi release thật (khác hẳn build test hiện tại): cần domain backend HTTPS thật (chưa có), bỏ `NSAllowsArbitraryLoads`/`usesCleartextTraffic`/`server.cleartext` đang bật cho tiện test qua LAN IP/ngrok — checklist đầy đủ ở cuối `frontend/MOBILE_BUILD.md`
- [ ] Safe-area (tai thỏ, status bar) — class `.safe-top`/`.safe-bottom` đã có sẵn trong `index.css` nhưng chưa gắn vào screen nào; khung game cố định 1194×834 tự co giãn vừa màn hình nên phần lớn trường hợp không cần, nhưng nên rà lại trên máy có tai thỏ thật

---

## Ghi chú vận hành nhanh
- Seed lại toàn bộ dữ liệu mẫu: `cd backend && npm run prisma:seed` (idempotent, chạy lại không tạo trùng)
- Cache audio TTS: `backend/storage/audio/` (đã gitignore) — xoá thư mục này để buộc generate lại
- Tài khoản `admin@gmail.com` hiện **không** bật Premium (đã tắt lại sau khi test) — bật thử qua nút "Dùng thử 7 ngày" ở trang Premium, hoặc `PATCH /auth/me/premium`
