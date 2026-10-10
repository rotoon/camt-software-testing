# Election System Backend — Unit Testing

Backend สำหรับระบบเลือกตั้งออนไลน์ (Express + Prisma + PostgreSQL) ทำขึ้นในวิชา Backend ครอบคลุมตั้งแต่การสมัครสมาชิก จัดการผู้ใช้และสิทธิ์ เขตเลือกตั้ง พรรค ผู้สมัคร ไปจนถึงการลงคะแนนและการดูผลการเลือกตั้ง

> รายละเอียด API และโครงสร้างโปรเจกต์อยู่ที่ [docs/API.md](docs/API.md)

## Unit Testing (Voter module)

ทดสอบส่วน **Voter** (`src/services/VoterService.ts`) ด้วย unit test ที่ไม่ต่อ database จริง แต่ใช้ test double แทน repository ทั้งหมด เลยไม่ต้องมี PostgreSQL, Docker หรือไฟล์ `.env`

### วิธีรัน

ต้องมี Node.js 20 ขึ้นไป

```bash
git clone https://github.com/rotoon/camt-software-testing.git
cd camt-software-testing
git switch election/unit-test
npm install
npm test
```

ดูชื่อ test ทีละข้อ:

```bash
npm test -- --verbose
```

ผลที่ควรได้:

```
 PASS  tests/unit/voterService.test.ts
  createVoteService
    ✓ UT-01 saves the vote when the poll is open and the candidate is in the voter constituency
    ✓ UT-02 refuses to vote when the poll is closed
    ✓ UT-10 saves exactly the generated voter and candidate ids (faker)
  getCandidatesService
    ✓ UT-08 asks only for the candidates of the given constituency (spy)

Tests:       4 passed, 4 total
```

### ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|---|---|
| `tests/unit/voterService.test.ts` | unit test ทั้งหมด |
| `jest.config.js` | ตั้งค่า Jest กับ ts-jest และให้ alias `@/` ชี้ไปที่ `src/` |
| `tsconfig.test.json` | ขยาย `tsconfig.json` ให้คอมไพล์ `tests/` ด้วย โดยไม่แตะ config ตอน build |
| `tests/tsconfig.json` | ให้ VS Code รู้จัก `@/` และ type ของ Jest ในไฟล์ test |

### Test case (ข้อ 2.1)

| ID | Unit | Given | When | Then |
|---|---|---|---|---|
| UT-01 | `createVoteService` | voter อยู่เขต 1, หีบเปิด, ผู้สมัคร id 5 อยู่เขต 1 | โหวตผู้สมัคร id 5 | บันทึก vote `{ userId: 1, candidateId: 5 }` |
| UT-02 | `createVoteService` | หีบของเขต 1 ปิดแล้ว | โหวต | ได้ 400 `Constituency is closed` และไม่บันทึก |
| UT-08 | `getCandidatesService` | voter อยู่เขต 3 | ขอดูผู้สมัคร | เรียก repository ครั้งเดียว ด้วยเลขเขต 3 |
| UT-10 | `createVoteService` | id ของ voter, ผู้สมัคร และเขต สุ่มด้วย Faker | โหวต | บันทึกด้วย id ที่สุ่มมาตรงตัว |

### ตรงกับโจทย์ข้อ 2.3

| ข้อ | ต้องมี | test |
|---|---|---|
| 2.3.1 | Success (Happy Path) | UT-01 |
| 2.3.2 | Alternative / Failure | UT-02 |
| 2.3.3 | Stub | UT-02 — stub `getConstituencyRepository` ให้ตอบว่าหีบปิด |
| 2.3.4 | Spy | UT-08 — จดว่า `getCandidatesRepository` ได้รับเลขเขตอะไร แล้วเอามาตรวจ |
| 2.3.5 | Mock | UT-01 — `createVoteRepository` ต้องถูกเรียกด้วย `{ userId, candidateId }` |
| 2.3.6 | Faker | UT-10 |

### ทฤษฎีการทดสอบที่ใช้

**Unit test (solitary)** ทดสอบ service ตัวเดียวโดยแทนที่ dependency ทุกตัว เช่น repository ที่ต่อ Prisma ด้วย test double ถ้า test แดง ก็รู้ทันทีว่าพังที่ logic ของ service ไม่ใช่ที่ database หรือ network และรันได้เร็ว (ไม่ถึง 1 วินาที)

ทุก test แบ่งเป็น 3 ช่วงตามแบบ **Arrange–Act–Assert** คั่นด้วยบรรทัดว่าง เริ่มจากเตรียมข้อมูล จากนั้นเรียก service ครั้งเดียว และสุดท้ายตรวจผล ชื่อ test บอกพฤติกรรมที่ต้องการ ไม่ใช่ชื่อ function

**Test double** ตามแนวคิดใน *xUnit Test Patterns* ของ Gerard Meszaros
- **Stub** ป้อน input ทางอ้อมที่ควบคุมได้ เช่น ให้ repository ตอบว่าหีบปิด โดยไม่ต้องปิดหีบใน database จริง
- **Spy** บันทึก output ทางอ้อมไว้ตรวจทีหลัง ใช้ `mock.calls` ดูว่า service ส่งเลขเขตอะไรให้ repository เพราะค่าที่ return กลับมาไม่ได้บอกว่ากรองตามเขตแล้วหรือยัง
- **Mock** ตรวจว่า dependency ถูกเรียก (หรือไม่ถูกเรียก) ตามที่ควร เช่น โหวตสำเร็จต้องสั่งบันทึก หีบปิดต้องไม่สั่งบันทึก

**Seam** คือตำแหน่งที่เสียบ test double ได้โดยไม่ต้องแก้ code ของแอป `VoterService` ไม่ได้รับ repository ผ่าน constructor แต่ import function มาใช้ตรงๆ จึงต้องใช้ `jest.mock()` แทนทั้ง module ซึ่งเรียกว่า module seam ส่วนนี้ต้องเขียน factory เอง เพราะไฟล์ repository จริง import Prisma และจะพยายามต่อ database ตอนโหลดไฟล์

**Test isolation** `beforeEach(() => jest.resetAllMocks())` ล้างค่าที่ stub ไว้และประวัติการเรียกก่อนทุก test ผลของ test หนึ่งไม่ไปกระทบอีก test รันลำดับไหนก็ได้ผลเดิม

**ข้อมูลสุ่มแบบทำซ้ำได้** UT-10 ใช้ Faker สุ่ม id แทนเลขตายตัว เพื่อกันกรณีที่ code บังเอิญผ่านเพราะเลขตรงกัน และใช้ `faker.seed(...)` ให้สุ่มได้ชุดเดิมทุกครั้ง ถ้า test แดง ก็รันซ้ำได้ข้อมูลชุดเดิม

**ตรวจว่า test จับ bug ได้จริง** ตอนเขียน UT-01 และ UT-02 ลองแก้ code ให้ผิดโดยตั้งใจ (เช่น ปิดการเช็กหีบปิด) แล้วดูว่า test แดงจริงไหม จากนั้นจึงแก้คืน เพราะ test ที่ไม่เคยแดงเลย ก็ไม่รู้ว่าจับ bug ได้จริงหรือเปล่า