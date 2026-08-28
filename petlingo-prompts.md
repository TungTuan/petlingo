# Petlingo — Bộ Prompt Generate Code

## Cách dùng
- Chạy theo đúng thứ tự. Mỗi prompt phụ thuộc output của prompt trước.
- Khi bắt đầu prompt mới, **dán lại code/schema liên quan từ bước trước** vào ngữ cảnh (không cần cả file, chỉ phần liên quan) — AI không tự nhớ giữa các phiên riêng biệt.
- Sau khi nhận code, đọc qua trước khi copy vào VS Code. Nếu có chỗ không hiểu, hỏi lại luôn: "giải thích dòng X đang làm gì" — đừng copy code không hiểu.
- Luôn ghi rõ version (TypeScript, Node LTS hiện tại...) để tránh AI trả code lỗi thời.

---

## PHẦN BACKEND

### Prompt 1 — Scaffold project

```
Tạo cấu trúc project Node.js + TypeScript cho backend của một app 
giáo dục trẻ em (học tiếng Anh qua thú cưng ảo).

Yêu cầu:
- Framework: Fastify
- ORM: Prisma + PostgreSQL
- Package manager: npm
- Cấu trúc thư mục theo layer: routes / services / repositories / middleware
- Có sẵn: dotenv config, error handler tập trung, request logging (pino)
- Có script: dev (hot reload), build, start, prisma:migrate, prisma:studio

Xuất ra:
1. Cấu trúc thư mục dạng cây
2. package.json đầy đủ dependencies
3. tsconfig.json
4. File .env.example
5. src/app.ts (khởi tạo Fastify, đăng ký plugin)
6. src/server.ts (entry point)

Giải thích ngắn gọn vai trò từng thư mục.
```

---

### Prompt 2 — Prisma schema

```
Viết schema.prisma cho app học tiếng Anh trẻ em, PostgreSQL.

Các bảng cần có:

1. Parent (tài khoản phụ huynh — người duy nhất có thể đăng nhập)
   - id, email (unique), phone (optional), passwordHash
   - createdAt, updatedAt

2. Child (hồ sơ trẻ, thuộc về 1 Parent)
   - id, parentId (FK)
   - displayName (tên gọi ở nhà, không phải tên thật)
   - avatarId
   - birthYear (chỉ năm sinh, không lưu ngày sinh đầy đủ)
   - createdAt

3. Progress (tiến độ học, 1-1 với Child)
   - id, childId (FK, unique)
   - coins, gems (int, default 0)
   - unlockedPets (Json, mảng string id)
   - unlockedWorlds (Json, mảng string id)
   - streakDays (int, default 0)
   - lastActiveDate (Date)
   - localVersion (int, default 0) — dùng để resolve conflict khi sync
   - updatedAt

4. VocabLearned (từ vựng đã học, quan hệ nhiều-nhiều với Child qua bảng trung gian)
   - Vocab: id, word, worldId, meaningVi
   - ChildVocab: childId, vocabId, learnedAt, timesReviewed

Ràng buộc:
- Xóa Parent thì cascade xóa Child và Progress liên quan (để đáp ứng 
  yêu cầu "xóa tài khoản" theo luật bảo vệ dữ liệu trẻ em)
- Thêm index hợp lý cho các trường hay query (parentId, childId)

Giải thích lý do cascade delete quan trọng với app trẻ em.
```

---

### Prompt 3 — Auth cho phụ huynh (JWT)

```
Dựa trên schema Prisma đã có (dán lại model Parent ở đây), viết module 
auth cho backend Fastify + TypeScript + Prisma.

[DÁN MODEL Parent TỪ PROMPT 2 VÀO ĐÂY]

Yêu cầu:
- POST /auth/register — nhận email, password, phone (optional). 
  Hash password bằng bcrypt hoặc argon2. Trả về access token + refresh token.
- POST /auth/login — verify password, trả về 2 token như trên.
- POST /auth/refresh — nhận refresh token, trả access token mới.
- Middleware verifyAuth — decode JWT từ header Authorization, 
  gắn parentId vào request, chặn nếu token invalid/hết hạn.
- Access token hết hạn sau 15 phút, refresh token 30 ngày.
- Validate input bằng Zod, trả lỗi rõ ràng (400) nếu email sai định dạng 
  hoặc password dưới 8 ký tự.

Xuất ra: 
1. src/services/auth.service.ts
2. src/routes/auth.routes.ts  
3. src/middleware/verifyAuth.ts
4. src/schemas/auth.schema.ts (Zod)

Giải thích rủi ro bảo mật cần tránh (ví dụ: không trả password hash 
trong response, rate-limit endpoint login).
```

---

### Prompt 4 — CRUD Child

```
Dựa trên model Child đã có (dán lại), viết API quản lý hồ sơ trẻ.

[DÁN MODEL Child TỪ PROMPT 2 VÀO ĐÂY]
[DÁN middleware verifyAuth TỪ PROMPT 3 VÀO ĐÂY]

Yêu cầu:
- Mọi endpoint đều cần verifyAuth, và chỉ thao tác được trên Child 
  thuộc về parentId trong token (không cho sửa/xem Child của người khác).
- POST /children — tạo hồ sơ trẻ mới
- GET /children — lấy danh sách con của phụ huynh đang login
- PATCH /children/:id — sửa displayName, avatarId
- DELETE /children/:id — xóa hồ sơ trẻ (và Progress liên quan qua cascade)

Xuất ra:
1. src/services/child.service.ts
2. src/routes/child.routes.ts
3. src/schemas/child.schema.ts (Zod)

Đặc biệt chú ý: viết rõ đoạn kiểm tra "Child này có thuộc về 
parentId hiện tại không" trước khi cho phép sửa/xóa — giải thích 
tại sao bước này bắt buộc.
```

---

### Prompt 5 — Sync Progress (endpoint quan trọng nhất)

```
Dựa trên model Progress đã có (dán lại), viết API đồng bộ tiến độ học 
giữa app (offline-first) và server.

[DÁN MODEL Progress TỪ PROMPT 2 VÀO ĐÂY]

Bối cảnh: app lưu tiến độ local trước (IndexedDB), sync lên server khi 
có mạng. Có thể có 2 thiết bị cùng 1 Child, cần resolve conflict.

Yêu cầu:
- GET /children/:id/progress — trả progress hiện tại từ server
- PUT /children/:id/progress — nhận progress từ client, merge theo rule:
  - coins, gems, unlockedPets, unlockedWorlds → lấy giá trị LỚN HƠN 
    hoặc HỢP (union) giữa server và client, không ghi đè thẳng
    (trẻ đã kiếm được thì không được mất khi đồng bộ)
  - streakDays → tính lại ở server dựa theo lastActiveDate, 
    không tin giá trị client gửi lên (phòng trẻ chỉnh giờ máy)
  - localVersion → tăng lên 1 sau mỗi lần merge thành công
- Trả về bản progress đã merge để client cập nhật lại local

Xuất ra:
1. src/services/progress.service.ts (chứa logic merge riêng, 
   viết thành hàm mergeProgress() để dễ test)
2. src/routes/progress.routes.ts
3. src/schemas/progress.schema.ts

Viết kèm 3 test case (dùng Vitest) cho hàm mergeProgress: 
(1) client có coin cao hơn, (2) server có pet mới hơn client chưa có, 
(3) streak tính đúng khi lastActiveDate là hôm qua vs 3 ngày trước.
```

---

## PHẦN FRONTEND

### Prompt 6 — Local DB (Dexie) schema

```
Viết schema Dexie (IndexedDB wrapper) cho app React + TypeScript, 
đồng bộ đúng cấu trúc với Progress schema ở backend.

[DÁN MODEL Progress TỪ PROMPT 2 VÀO ĐÂY]

Yêu cầu:
- Bảng progress: childId, coins, gems, unlockedPets (array), 
  unlockedWorlds (array), streakDays, lastActiveDate, localVersion, 
  synced (boolean — đánh dấu đã đẩy lên server chưa)
- Hàm helper: 
  - addCoins(childId, amount) — cộng coin, set synced = false
  - unlockPet(childId, petId)
  - getProgress(childId)
- Toàn bộ thao tác ghi phải là optimistic — cập nhật local ngay, 
  không chờ network

Xuất ra: src/lib/db.ts (Dexie schema + helper functions), 
kèm giải thích ngắn tại sao dùng Dexie thay vì localStorage thô.
```

---

### Prompt 7 — Sync service (client)

```
Viết service đồng bộ giữa Dexie (local) và backend API, cho app 
React + TypeScript + Capacitor.

[DÁN db.ts TỪ PROMPT 6 VÀO ĐÂY]

Yêu cầu:
- Hàm syncProgress(childId): 
  1. Đọc progress local
  2. Gọi PUT /children/:id/progress gửi progress local kèm localVersion
  3. Nhận về progress đã merge từ server
  4. Ghi đè lại vào Dexie, set synced = true
- Chạy nền, KHÔNG được block UI — nếu gọi API fail (mất mạng), 
  fail âm thầm, thử lại sau, không throw lỗi ra UI
- Debounce: chỉ thực sự gọi API sau khi không có thay đổi mới trong 5 giây, 
  hoặc khi app chuyển xuống background (dùng Capacitor App plugin, 
  event 'appStateChange')
- Dùng Capacitor Network plugin để chỉ thử sync khi có mạng

Xuất ra: src/lib/syncService.ts, giải thích cơ chế debounce đang chọn.
```

---

### Prompt 8 — Component UI mẫu (Home Screen)

```
Viết component React + TypeScript + Tailwind cho màn Home Screen của 
app giáo dục trẻ em, theo đúng mô tả layout sau:

- Thanh trên cùng: avatar tròn + tên bé + level (badge sao), 
  thanh HP dạng heart, số coin (icon sao vàng), số gem (icon kim cương)
- Giữa màn: hình nền nhà + sân, con thú cưng đứng giữa, bong bóng thoại 
  "Hi! I'm Buddy!"
- Card nổi bên phải: "Today's Goal" gồm 3 mục có checkbox 
  (Play a game / Learn 5 words / Feed Buddy)
- Rương quà "Reward" góc dưới phải
- Thanh điều hướng dưới cùng: 5 nút (Home, World, Pets, Bag, More), 
  nút đang active có background bo tròn nổi bật

Yêu cầu kỹ thuật:
- Dùng Framer Motion cho: thú cưng có animation idle (nhấp nhô nhẹ), 
  bong bóng thoại fade-in
- Chỉ animate transform/opacity (không animate width/top/left, 
  vì cần mượt trên máy Android tầm trung)
- Dùng safe-area-inset cho thanh trên/dưới (chạy trong Capacitor, 
  cần né notch)
- Props: childName, level, hp, maxHp, coins, gems, todayGoals (array), 
  onNavigate (callback nhận tên tab)
- Component chia nhỏ: TopBar, PetDisplay, GoalCard, BottomNav 
  (file riêng, Home.tsx import lại)

Font chữ: Baloo 2 (bo tròn, thân thiện trẻ em) — giả định đã import 
qua Tailwind config, dùng class font-baloo.

Xuất ra đầy đủ code, kèm Tailwind config phần mở rộng cần thêm 
(màu sắc, font) nếu có.
```

---

## Mẹo dùng chung cho mọi prompt trên

- Nếu code AI trả về dùng thư viện đã deprecated hoặc version cũ, hỏi thẳng: 
  "kiểm tra lại, [thư viện X] có version mới hơn không, ưu tiên API hiện hành"
- Nếu file dài, yêu cầu AI xuất **từng file một**, đừng gộp hết vào 1 khối — 
  dễ copy sai, dễ bỏ sót phần import.
- Sau khi có code, luôn tự chạy `npm run build` / `tsc --noEmit` trước khi 
  tin là đúng — AI có thể viết sai type mà không tự biết.
