# Van Dinh Land Management System (Hệ thống Hồ sơ Địa chính)

Hệ thống quản lý bản đồ số và hồ sơ địa chính nội bộ cho xã Vạn Đình. Được xây dựng theo kiến trúc Local-First.

## Công nghệ sử dụng (Tech Stack)

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Bản đồ (Map)**: MapLibre GL JS
- **Backend**: Next.js API Routes (Monorepo)
- **Database**: PostgreSQL với PostGIS extension
- **ORM**: Prisma (v5.x)
- **Auth**: iron-session (Cookie-based stateless session)

## Yêu cầu hệ thống (Prerequisites)

- Node.js (v20+)
- PostgreSQL (Cài đặt local hoặc server nội bộ)
- PostGIS Extension (Đã bật trong PostgreSQL)

## Hướng dẫn cài đặt (Setup Instructions)

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**
   Copy file `.env.example` thành `.env` (hoặc tạo file `.env` mới) và cập nhật chuỗi kết nối:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/vandinh?schema=public"
   ```

3. **Cập nhật Database Schema**
   Đồng bộ cấu trúc database từ Prisma schema:
   ```bash
   npm run db:push
   ```

4. **Tạo dữ liệu mẫu (Seed Data)**
   Chạy script seed để tạo tài khoản admin và dữ liệu mẫu ban đầu:
   ```bash
   npm run db:seed
   ```
   *Tài khoản mặc định: `admin` / `admin123`*

5. **Chạy ứng dụng**
   ```bash
   npm run dev
   ```
   Mở trình duyệt và truy cập `http://localhost:3000`.

## Tính năng chính (Core Features)

- Quản lý tài khoản và phân quyền (Admin / Staff).
- Hiển thị bản đồ số và thửa đất (Import file GeoJSON/DXF).
- Tra cứu hồ sơ địa chính.
- Nhật ký hoạt động (Audit logs).
