# 🗳️ Election System Backend

Backend สำหรับระบบเลือกตั้งออนไลน์ รองรับการสมัครสมาชิก จัดการผู้ใช้/สิทธิ์ เขตเลือกตั้ง พรรค ผู้สมัคร การลงคะแนน และการดูผลการเลือกตั้ง

- **Tech Stack:** Express.js 5 + TypeScript + Prisma 7 + PostgreSQL (Supabase)
- **Auth:** JWT Bearer Token
- **Default Local URL:** `http://localhost:3000`

---

## 📌 ภาพรวมระบบ

ระบบนี้แบ่งผู้ใช้งานหลักเป็น 3 กลุ่ม:

- `ROLE_ADMIN` — ผู้ดูแลระบบ
- `ROLE_EC` — กกต.
- `ROLE_VOTER` — ผู้มีสิทธิ์เลือกตั้ง

ความสามารถหลักของระบบ:

- สมัครสมาชิกและเข้าสู่ระบบด้วยเลขบัตรประชาชน
- ยืนยันตัวตนด้วย JWT
- จัดการ role ของผู้ใช้
- จัดการจังหวัด อำเภอ และเขตเลือกตั้ง
- จัดการพรรคการเมือง
- จัดการผู้สมัครรับเลือกตั้ง
- ลงคะแนนและแก้ไขคะแนนก่อนปิดหีบ
- ดูผลรวมการเลือกตั้งและผลรายเขต
- อัปโหลดรูปภาพไปยัง Supabase Storage

---

## 📊 สรุปจำนวน Endpoints

| ประเภท | จำนวน | Authentication | Authorization |
| --- | ---: | --- | --- |
| Health Check | 1 | ❌ | - |
| Authentication | 3 | บางส่วน | - |
| Admin | 9 | ✅ | `ROLE_ADMIN` |
| EC | 13 | ✅ | `ROLE_EC` |
| Voter | 5 | ✅ | ต้อง login |
| Location | 3 | ❌ | - |
| Upload | 1 | ❌ | - |
| Public | 5 | ❌ | - |
| **รวมทั้งหมด** | **40** | - | - |

> หมายเหตุ:
> - `Voter` routes ปัจจุบันเช็คแค่การ login ผ่าน JWT ใน route layer
> - `EC` routes ใช้ `requireRole(RoleName.EC)` โดยตรง
> - middleware ปัจจุบันไม่มี role hierarchy อัตโนมัติ

---

## 🛠️ Tech Stack

| Component | Technology |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | `jsonwebtoken` |
| Password Hashing | `bcryptjs` |
| File Upload | `multer` |
| Image Processing | `sharp` |
| Object Storage | Supabase Storage (S3-compatible) |
| Dev Tools | `nodemon`, `tsx`, `tsc`, `tsc-alias` |

---

## 🧱 Project Structure

```text
election-backend-project/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-vote-only.ts
├── src/
│   ├── awsConfig.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── controllers/
│   ├── db/
│   ├── generated/
│   ├── lib/
│   │   └── prisma.ts
│   ├── middlewares/
│   │   ├── AuthMiddleware.ts
│   │   ├── PrismaErrorHandler.ts
│   │   └── RoleMiddleware.ts
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   │   ├── AdminRoutes.ts
│   │   ├── AuthRoutes.ts
│   │   ├── ECRoutes.ts
│   │   ├── LocationRoutes.ts
│   │   ├── PublicRoutes.ts
│   │   ├── UploadRoutes.ts
│   │   └── VoterRoutes.ts
│   ├── services/
│   └── utils/
│       └── jwt.ts
├── PRD.md
├── README.md
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

### Architecture โดยรวม

- `routes` — ประกาศ endpoint
- `controllers` — รับ request / ส่ง response
- `services` — business logic
- `repositories` — query database ผ่าน Prisma
- `middlewares` — auth / role / global error handling
- `models` — DTOs และ types
- `db` — seed helper modules

---

## 🏥 Health Check

### `GET /`

ตรวจสอบว่า server ทำงานอยู่

**Response**
```json
{
  "message": "Welcome to Election Backend API"
}
```

---

## 🔐 Authentication

### `POST /auth/register`

ลงทะเบียนผู้ใช้ใหม่ โดยผู้ใช้ใหม่จะได้ `ROLE_VOTER` อัตโนมัติ

**Request Body**
```json
{
  "citizenId": "1234567890123",
  "password": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "address": "Bangkok",
  "provinceId": 1,
  "districtId": 1
}
```

**Validation หลัก**
- `citizenId` ต้องเป็นตัวเลข 13 หลัก
- `citizenId` ต้องไม่ซ้ำ
- `provinceId` ต้องเป็น number
- `districtId` ต้องอยู่ในจังหวัดที่เลือก

**Response**
- สำเร็จ: `201 Created`
- ตัว response จริงจะคืนข้อมูล user ที่ถูกสร้าง ไม่ได้คืน token

ตัวอย่าง:
```json
{
  "id": 1,
  "citizenId": "1234567890123",
  "firstName": "John",
  "lastName": "Doe",
  "address": "Bangkok",
  "provinceId": 1,
  "districtId": 1,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "roles": [
    {
      "role": {
        "id": 1,
        "name": "ROLE_VOTER"
      }
    }
  ]
}
```

---

### `POST /auth/login`

เข้าสู่ระบบ

**Request Body**
```json
{
  "citizenId": "1234567890123",
  "password": "123456"
}
```

**Response**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### `GET /auth/me`

ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT

**Headers**
```http
Authorization: Bearer <jwt_token>
```

**Response ตัวอย่าง**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "citizenId": "1234567890123",
    "firstName": "John",
    "lastName": "Doe",
    "address": "Bangkok",
    "province": {
      "id": 1,
      "name": "กรุงเทพมหานคร"
    },
    "district": {
      "id": 1,
      "name": "พระนคร"
    },
    "constituency": {
      "id": 1,
      "number": 1,
      "isClosed": false
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "roles": ["ROLE_VOTER"]
  }
}
```

> หมายเหตุ: controller คืนค่า `req.body.user` ตรง ๆ ดังนั้นรูปแบบจริงขึ้นกับ service ที่ map ข้อมูล user

---

## 👨‍💼 Admin Routes

> ทุก endpoint ใต้ `/admin` ต้อง:
> - login ก่อน
> - มี `ROLE_ADMIN`

### Constituencies

#### `GET /admin/constituencies`

ดึงรายการเขตเลือกตั้งแบบแบ่งหน้า และ filter ตามจังหวัดได้

**Query Parameters**
- `page` default `1`
- `limit` default `10`
- `provinceId` optional

---

#### `POST /admin/constituencies`

สร้างเขตเลือกตั้งใหม่

**Request Body**
```json
{
  "number": 1,
  "provinceId": 1,
  "districtIds": [1, 2, 3]
}
```

---

#### `PUT /admin/constituencies/:id`

แก้ไขข้อมูลเขตเลือกตั้ง รวมถึงการผูก district และสถานะ `isClosed`

**Request Body**
```json
{
  "number": 1,
  "provinceId": 1,
  "isClosed": true,
  "districtIds": [1, 2]
}
```

---

#### `DELETE /admin/constituencies/:id`

ลบเขตเลือกตั้ง

---

#### `GET /admin/constituencies/:provinceId/available-districts`

ดึงอำเภอในจังหวัดนั้นที่ยังไม่ได้ถูก assign ให้ constituency

---

### Users

#### `GET /admin/users`

ดึงรายการผู้ใช้แบบแบ่งหน้า

**Query Parameters**
- `page`
- `limit`
- `search`
- `sortBy` = `id | createdAt | firstName | lastName`
- `order` = `asc | desc`
- `provinceId` optional

**ข้อมูลที่ response มี**
- ข้อมูลพื้นฐาน user
- province / district / constituency
- roles
- vote ของ user ถ้ามี

---

#### `GET /admin/users/:id/roles`

ดู roles ของ user ตาม id

---

#### `POST /admin/users/:userId/roles`

กำหนด role ให้ user

**Request Body**
```json
{
  "roleName": "ROLE_EC"
}
```

**ค่าที่ใช้ได้**
- `ROLE_VOTER`
- `ROLE_EC`
- `ROLE_ADMIN`

---

#### `DELETE /admin/users/:id/roles`

ลบ role ออกจาก user

**Request Body**
```json
{
  "roleName": "ROLE_EC"
}
```

> หมายเหตุ: `ROLE_VOTER` ถูกป้องกันไม่ให้ลบผ่าน service นี้

---

## 🗳️ EC Routes

> ทุก endpoint ใต้ `/ec` ต้อง:
> - login ก่อน
> - มี `ROLE_EC`

### Parties

#### `GET /ec/parties`

ดึงรายการพรรคแบบแบ่งหน้า

**Query Parameters**
- `page` default `1`
- `limit` default `10`

---

#### `GET /ec/parties/:id`

ดูพรรคตาม id

---

#### `POST /ec/parties`

สร้างพรรคใหม่

**Request Body**
```json
{
  "name": "พรรคตัวอย่าง",
  "logoUrl": "https://example.com/logo.png",
  "policy": "นโยบายของพรรค"
}
```

---

#### `PUT /ec/parties/:id`

แก้ไขพรรค

**Request Body**
```json
{
  "name": "พรรคตัวอย่าง",
  "logoUrl": "https://example.com/logo.png",
  "policy": "นโยบายใหม่"
}
```

---

#### `DELETE /ec/parties/:id`

ลบพรรค

---

### Candidates

#### `GET /ec/candidates`

ดึงรายการผู้สมัครแบบแบ่งหน้า พร้อม search / sort / filter

**Query Parameters**
- `page` default `1`
- `limit` default `10`
- `search` optional
- `sortBy`
- `order`
- `partyId` optional
- `constituencyId` optional
- `provinceId` optional

> search ปัจจุบันรองรับการค้นหาหลายคำ โดยจะแยกคำจากช่องว่าง

---

#### `POST /ec/candidates`

สร้างผู้สมัครใหม่

**Request Body**
```json
{
  "citizenId": "1234567890123",
  "number": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "candidatePolicy": "นโยบายเฉพาะตัว",
  "imageUrl": "https://example.com/candidate.webp",
  "partyId": 1,
  "constituencyId": 1
}
```

**Validation หลัก**
- citizenId ผู้สมัครต้องไม่ซ้ำ
- เบอร์ผู้สมัครห้ามซ้ำในเขตเดียวกัน
- พรรคเดียวกันส่งได้ 1 คนต่อเขต
- party และ constituency ต้องมีอยู่จริง

> ถ้าไม่ส่ง `candidatePolicy` ระบบจะ fallback ไปใช้นโยบายของพรรค

---

#### `PATCH /ec/candidates/:id`

แก้ไขข้อมูลผู้สมัครแบบ partial update

---

#### `DELETE /ec/candidates/:id`

ลบผู้สมัคร

> ลบไม่ได้ถ้ามี vote ผูกอยู่

---

### Constituencies

#### `GET /ec/constituencies`

ดึงรายการ constituency แบบแบ่งหน้า

---

#### `POST /ec/constituencies/close-all`

ปิดหีบทุกเขต

---

#### `POST /ec/constituencies/open-all`

เปิดหีบทุกเขต

---

#### `POST /ec/constituencies/:id/toggle`

สลับสถานะ `isClosed` ของเขตเดียว

---

## 🙋 Voter Routes

> ทุก endpoint ใต้ `/voter` ต้อง login ก่อน  
> ปัจจุบันใน route layer ยังไม่ได้เช็ค `ROLE_VOTER` โดยตรง

### `GET /voter/candidates`

ดึงผู้สมัครในเขตของ user

ระบบหาเขตจาก:
- `user -> district -> constituency`

---

### `GET /voter/constituency`

ดึงข้อมูล constituency ของ user

---

### `GET /voter/my-vote`

ดึง vote ปัจจุบันของ user

---

### `POST /voter/vote`

สร้าง vote ใหม่

**Request Body**
```json
{
  "candidateId": 1
}
```

**เงื่อนไข**
- user ต้องมี constituency
- constituency ต้องยังไม่ปิด
- candidate ต้องอยู่ใน constituency เดียวกับ user

---

### `PUT /voter/vote`

เปลี่ยน vote

**Request Body**
```json
{
  "candidateId": 2
}
```

**เงื่อนไข**
- ใช้ validation เดียวกับ create vote
- แก้ไขไม่ได้ถ้าเขตปิดแล้ว

---

## 📍 Location Routes

public ทั้งหมด ไม่ต้อง login

### `GET /location/provinces`

ดึงรายการจังหวัดทั้งหมด

---

### `GET /location/provinces/:provinceId/districts`

ดึงอำเภอทั้งหมดในจังหวัดนั้น

---

### `GET /location/districts/:districtId/constituencies`

ดึง constituency ของ district นั้น

> ปัจจุบัน district 1 ตัวผูกกับ constituency ได้ 0 หรือ 1 ตัว

---

## ☁️ Upload Route

### `POST /upload`

อัปโหลดไฟล์รูปภาพ

**Form Data**
- `file` — ไฟล์รูป
- `folder` — optional, default = `uploads`

**พฤติกรรม**
- รับไฟล์ผ่าน memory storage
- ถ้าเป็นรูปจะถูกแปลงเป็น `webp`
- สุ่มชื่อไฟล์ใหม่
- upload ไป bucket `Election_App`
- คืน public URL กลับมา

**Response ตัวอย่าง**
```json
{
  "url": "https://your-project.supabase.co/storage/v1/object/public/Election_App/uploads/xxxx.webp"
}
```

> หมายเหตุ:
> - route นี้ปัจจุบันยังไม่มี auth
> - ถ้าไฟล์ไม่ใช่ image จะถูกปฏิเสธ

---

## 🌐 Public Routes

public ทั้งหมด ไม่ต้อง login

### `GET /public/results`

ดึง dashboard สรุปผลรวมการเลือกตั้ง

**ข้อมูลที่ได้**
- `totalVotes`
- `turnout`
- `countingProgress`
- `partyStats`
- `updateAt`

**หมายเหตุ**
- นับ seat จากเขตที่ `isClosed = true`
- ถ้าในเขตมีคะแนนเสมอ จะถือว่าไม่มีผู้ชนะของเขตนั้น

---

### `GET /public/contstituencies-result/:id`

ดึงผลรายเขตเลือกตั้งตาม id

**Behavior**
- ถ้าเขตยังไม่ปิด จะคืน `votes: 0`
- ถ้าเขตปิดแล้ว จะแสดงจำนวนคะแนนจริง

> ชื่อ path ปัจจุบันสะกดเป็น `contstituencies-result` ตามโค้ดจริง

---

### `GET /public/provinces-with-constituencies`

ดึงรายการจังหวัดพร้อมเขตเลือกตั้งทั้งหมด

response มี:
- `provinces`
- `countingProgress`
- `updateAt`

---

### `GET /public/parties`

ดึงรายการพรรคทั้งหมด

> ใช้ controller เดียวกับ party list แบบ non-paginated

---

### `GET /public/candidates`

ดึงรายการผู้สมัครทั้งหมด

> ใช้ controller เดียวกับ candidate list แบบ paginated/filterable

---

## 🔑 Authentication & Authorization

### JWT Header Format

```http
Authorization: Bearer <jwt_token>
```

### Available Roles

| Role | Description |
| --- | --- |
| `ROLE_ADMIN` | ผู้ดูแลระบบ |
| `ROLE_EC` | กกต. |
| `ROLE_VOTER` | ผู้มีสิทธิ์เลือกตั้ง |

### Authorization behavior ปัจจุบัน

- `requireAuth` จะอ่าน JWT แล้วใส่ข้อมูล user ลงใน `req.body.user`
- `requireRole` จะเช็ค role จาก `req.body.user.roles`
- ไม่มี role hierarchy อัตโนมัติใน middleware
- ดังนั้น `ROLE_ADMIN` จะเข้า route ของ `ROLE_EC` ได้ ก็ต่อเมื่อ user มี role นั้นอยู่จริง

### Middleware Flow

```text
Request
  -> CORS
  -> JSON Parser
  -> requireAuth
  -> requireRole
  -> Controller
  -> errorHandler
```

---

## 🗃️ Database Schema

ระบบใช้ Prisma schema โดยมี model หลัก 9 ตัว:

- `user`
- `role`
- `userRole`
- `province`
- `district`
- `constituency`
- `party`
- `candidate`
- `vote`

### ความสัมพันธ์สำคัญ

- ผู้ใช้ผูกกับ `province` และ `district`
- `district` ผูกกับ `constituency`
- ผู้ใช้ไม่ได้เก็บ `constituencyId` โดยตรง
- ผู้สมัครผูกกับ `party` และ `constituency`
- `vote` ผูกกับ `user` และ `candidate`
- 1 user มี vote ได้ 1 record (`userId` unique)

### Constraints สำคัญ

- `user.citizenId` unique
- `party.name` unique
- `candidate.citizenId` unique
- `candidate(number, constituencyId)` unique
- `candidate(partyId, constituencyId)` unique
- `vote.userId` unique

---

## 🌱 Seed Data

โปรเจกต์นี้มี seed script สำหรับ mock data

### คำสั่ง
```bash
npm run seed
```

### ลำดับการ seed หลัก
- roles
- provinces
- constituencies
- districts
- parties
- candidates
- users
- votes

### ไฟล์ที่เกี่ยวข้อง
- `prisma/seed.ts`
- `prisma/seed-vote-only.ts`
- `src/db/seedRole.ts`
- `src/db/seedProvince.ts`
- `src/db/seedConstituency.ts`
- `src/db/seedDistrict.ts`
- `src/db/seedParty.ts`
- `src/db/seedCandidate.ts`
- `src/db/seedUser.ts`
- `src/db/seedVote.ts`

---

## 📜 Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `nodemon --exec tsx src/server.ts` | รัน dev server |
| `npm run build` | `tsc && tsc-alias` | build โปรเจกต์ |
| `npm start` | `node dist/server.js` | รัน production build |
| `npm run seed` | `prisma db seed` | seed ข้อมูลตัวอย่าง |
| `npm test` | `echo "Error: no test specified" && exit 1` | ยังไม่มี test จริง |

---

## ⚙️ Environment Variables

ค่าที่ระบบใช้งานจริงจากโค้ดมีอย่างน้อย:

```env
PORT=3000
DIRECT_URL=postgresql://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
SUPABASE_ENDPOINT_URL=...
```

| Variable | Required | Description |
| --- | --- | --- |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection string |
| `JWT_SECRET` | ✅ | secret สำหรับ sign/verify JWT |
| `JWT_EXPIRES_IN` | ✅ | อายุ token เช่น `7d` |
| `AWS_ACCESS_KEY_ID` | ✅ | key สำหรับ object storage |
| `AWS_SECRET_ACCESS_KEY` | ✅ | secret สำหรับ object storage |
| `AWS_REGION` | ✅ | region ของ S3-compatible storage |
| `SUPABASE_ENDPOINT_URL` | ✅ | Supabase S3 endpoint |
| `FRONTEND_URL` | ❌ | frontend URL สำหรับ CORS |
| `PORT` | ❌ | port ของ server |

> หมายเหตุ: ใน repository ปัจจุบันมีไฟล์ `.env` แต่ไม่ได้มี `.env.example`

---

## 🚀 Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Setup environment
สร้างหรือแก้ไขไฟล์ `.env` ให้มีค่าตามหัวข้อด้านบน

### 3) Run migrations
```bash
npx prisma migrate dev
```

### 4) Seed database
```bash
npm run seed
```

### 5) Start dev server
```bash
npm run dev
```

server จะรันที่:
```text
http://localhost:3000
```

---

## 📝 Notes

- response format ของแต่ละ route ยังไม่สม่ำเสมอ 100%
- บาง route คืน `{ ok, status, message, data }`
- บาง route คืน object ตรง ๆ เช่น login / register บางกรณี
- Prisma errors ถูกจัดการผ่าน global error handler
- CORS เปิดให้เฉพาะ origin ที่กำหนดใน `src/server.ts`
- `dist/` จะมีไฟล์หลัง build
- โปรเจกต์นี้ยังไม่มี automated test suite จริง

---

## 🎯 Use Cases by Role

### 👨‍💼 Admin
- จัดการเขตเลือกตั้ง
- ดูอำเภอที่ยังไม่ถูกผูกกับเขต
- ดูผู้ใช้ทั้งหมด
- ดู/เพิ่ม/ลบ role ของผู้ใช้

### 🗳️ EC
- จัดการพรรคการเมือง
- จัดการผู้สมัคร
- ดูรายการเขตเลือกตั้ง
- เปิด/ปิดหีบรายเขตหรือทั้งหมด

### 🙋 Voter
- ดูเขตของตัวเอง
- ดูผู้สมัครในเขต
- ลงคะแนน
- เปลี่ยนคะแนนก่อนปิดหีบ

### 🌐 Public
- ดูผลรวมการเลือกตั้ง
- ดูผลรายเขต
- ดูจังหวัดพร้อมเขต
- ดูพรรคทั้งหมด
- ดูผู้สมัครทั้งหมด

---

## 🔗 Related

- **Frontend:** [election-frontend-project](https://election-frontend-project.vercel.app)
- **Repository:** [github.com/rotoon/election-backend-project](https://github.com/rotoon/election-backend-project)