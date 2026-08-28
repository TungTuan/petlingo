# PetLingo Backend

Node.js + TypeScript + Fastify + Prisma (PostgreSQL) API cho app học tiếng Anh
qua thú cưng ảo. Xem `../petlingo-prompts.md` (Prompt 1–5) cho bối cảnh gốc.

## Cấu trúc thư mục

```
src/
  app.ts            Khởi tạo Fastify, đăng ký plugin (cors, jwt x2, rate-limit), routes
  server.ts         Entry point — start/stop server
  config/env.ts      Đọc + validate biến môi trường bằng Zod, fail fast nếu thiếu
  lib/prisma.ts       PrismaClient singleton (driver adapter @prisma/adapter-pg)
  lib/jwt.ts          Helper ký/verify JWT namespace access & refresh
  middleware/         errorHandler (tập trung xử lý lỗi), verifyAuth (decode JWT)
  routes/             Định nghĩa HTTP endpoint, gọi service, không chứa business logic
  services/           Business logic + Prisma queries
  schemas/            Zod schema validate request body
  generated/prisma/    Prisma Client sinh ra (gitignore, chạy `prisma generate` để tạo)
prisma/
  schema.prisma        Data model (Parent, Child, Progress, Vocab, ChildVocab)
  migrations/           SQL migration history
tests/
  progress.service.test.ts   Vitest cho mergeProgress() — pure function, không cần DB
```

## Chạy local

Yêu cầu: Node.js 20 LTS trở lên, Docker (chạy PostgreSQL).

```bash
cp .env.example .env        # rồi tự thay JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
docker compose up -d        # PostgreSQL tại localhost:5432
npm install
npm run prisma:generate
npm run prisma:migrate      # tạo bảng theo schema.prisma
npm run dev                 # http://localhost:4000 (đổi PORT trong .env nếu cần)
```

Script khác:
- `npm run build` / `npm start` — build ra `dist/` rồi chạy bằng Node thuần
- `npm test` — chạy Vitest (hiện có 5 test cho `mergeProgress`)
- `npm run prisma:studio` — GUI xem/sửa dữ liệu

## API hiện có

| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | /auth/register | – | Tạo Parent, trả về access+refresh token |
| POST | /auth/login | – | Rate-limit 5 req/phút để chặn brute-force |
| POST | /auth/refresh | – | Đổi refresh token lấy access token mới |
| GET | /auth/me | ✅ | Thông tin Parent đang đăng nhập |
| POST/GET | /children | ✅ | Tạo / liệt kê hồ sơ trẻ của Parent hiện tại |
| PATCH/DELETE | /children/:id | ✅ | Chỉ thao tác được Child thuộc về Parent (404 nếu không phải, tránh lộ thông tin) |
| GET/PUT | /children/:id/progress | ✅ | Đồng bộ tiến độ offline-first, merge theo rule "không mất đồ đã có" |

Mọi route `✅` cần header `Authorization: Bearer <accessToken>`.

## Quyết định kỹ thuật đáng chú ý

- **Prisma 7**: không còn `url` trong `schema.prisma` — cấu hình datasource nằm
  ở `prisma.config.ts`, `PrismaClient` khởi tạo qua driver adapter
  (`@prisma/adapter-pg`) thay vì engine binary.
- **argon2** thay vì bcrypt để hash mật khẩu (khuyến nghị hiện hành, chống GPU
  cracking tốt hơn).
- **Cascade delete**: xóa Parent → xóa hết Child + Progress liên quan (đáp ứng
  quyền "xóa tài khoản" theo luật bảo vệ dữ liệu trẻ em — không để lại dữ liệu
  mồ côi của trẻ sau khi phụ huynh xóa tài khoản).
- **mergeProgress()** tách thành pure function không đụng DB, dễ test: coins/
  gems lấy max, unlockedPets/unlockedWorlds lấy hợp, streakDays tính lại từ
  `lastActiveDate` của SERVER (không tin client, tránh trẻ chỉnh giờ máy),
  localVersion luôn +1.
- **Lỗi 404 thay vì 403** khi truy cập Child/Progress không thuộc về mình —
  tránh lộ thông tin "id này có tồn tại hay không" cho người không sở hữu.
