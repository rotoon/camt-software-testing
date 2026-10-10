# 📝 งานส่ง Software Testing Assignment (15%)

repo นี้มี 2 ส่วนตามโจทย์ แต่ละส่วนอยู่คนละ branch ส่วน README ของ workshop (ของอาจารย์) อยู่ด้านล่างหัวข้อนี้

## ส่วนที่ 1 — ทำ workshop ซ้ำ (3–4 ต.ค.)

แต่ละ lab อยู่ branch ของตัวเอง commit ทีละขั้น และอธิบายสิ่งที่ทำ/สังเกตไว้ใน commit message ของแต่ละขั้น ดูได้ด้วย `git log <branch>`

| Branch | เรื่อง | แนวคิดที่ใช้ |
|---|---|---|
| `jest/lab/00-setup` | ตั้งเครื่องและรัน test ทุกระดับ | red–green: ทำให้ test แดงแล้วแก้ให้เขียว, เทียบ unit / integration / e2e ด้านความเร็ว การต้องใช้ Docker และความแม่นในการบอกจุดพัง |
| `jest/lab/01-boundaries` | จัด test case เข้า boundary | test boundary (unit, integration, component, contract, e2e), เลือกระดับต่ำสุดที่ยังมั่นใจพอ, test pyramid |
| `jest/lab/02-aaa-unit` · `jest/solution/02-aaa-unit` | Arrange–Act–Assert | AAA / four-phase test, test smells (Obscure Test, Eager Test, Assertion Roulette, Conditional Test Logic, ไม่มี assertion), `it.each` แทน loop |
| `jest/solution/03-test-doubles` | Test doubles | dummy, stub, spy, mock, fake, seam ผ่าน constructor, fake timers กับการ inject `Clock`, ไม่ mock สิ่งที่เราไม่ได้เป็นเจ้าของ |
| `jest/solution/04-test-data` | Test data | Liquibase (update, tag, rollback, contexts, checksum), Test Data Builder + Faker แบบตั้ง seed, fresh fixture (`truncateAll`), component test, `--runInBand`, สร้าง seed data ด้วย script |

รัน unit test ของ workshop (ไม่ต้องใช้ Docker):

```bash
git switch jest/solution/04-test-data
cd app
npm install
npm run test:unit
```

integration test ต้องเปิด Docker ก่อน แล้วรัน `npm run test:integration`

## ส่วนที่ 2 — Unit test ของ Election App (Voter module)

| Branch | เนื้อหา |
|---|---|
| `election/original` | code ที่ส่งวิชา Backend ไม่แก้ |
| `election/unit-test` | code เดิม + unit test ข้อ 2.1 และ 2.3 |

วิธีรัน รายการ test case ตารางที่ตรงกับข้อ 2.3.1–2.3.6 และทฤษฎีที่ใช้ อยู่ใน **README ของ branch `election/unit-test`**

```bash
git switch election/unit-test
npm install
npm test
```

---

# Software Testing in Real Industry

**Hands-on automated testing workshop & readiness checklist**

Workshop 2 วัน · CMU CAMT · ส.–อา. 3–4 ตุลาคม 2026 · 09:00–16:30

ฝึกเขียน automated test แบบที่ทีมจริงใช้ บน **ระบบเลือกตั้ง** ฉบับย่อ (Express + TypeScript + PostgreSQL + Liquibase)
ตั้งแต่ unit test ไปจนถึง CI, outside-in และการเอา legacy code เข้า test — แล้วนำไปใช้กับโปรเจกต์ของตัวเอง

## เริ่มที่นี่

1. **ก่อนมา workshop** — ทำตาม [setup/README.md](setup/README.md) จน `npm run doctor` ขึ้น ✅ READY
   แล้วส่ง screenshot + test cases ภายใน **พฤ. 1 ต.ค. 2026**
2. **ระหว่าง workshop** — รายการ lab และวิธีสลับ branch อยู่ที่ [labs/README.md](labs/README.md)
3. **ประเมินโปรเจกต์ตัวเอง** — [checklist/README.md](checklist/README.md) (รอบ 1 เช้า Day 1 · รอบ 2 ท้าย Day 2)

## Branches

```text
main                      ระบบอ้างอิง + test infra + CI (+ slides, facilitator guide)
jest/lab/NN-name          จุดเริ่มต้นของ lab NN — โจทย์อยู่ที่ labs/NN-name/README.md
jest/solution/NN-name     เฉลย lab NN = จุดเริ่มต้นของ lab NN+1
demo/testcontainers       demo: integration test บน Testcontainers
demo/playwright-browser   demo: Playwright ผ่าน browser
```

ตามไม่ทันไม่เป็นไร — ทุก lab เริ่มจากเฉลยของ lab ก่อนหน้า:

```bash
git stash -u                         # เก็บงานตัวเอง (-u = รวมไฟล์ใหม่ด้วย)
git switch jest/lab/06-outside-in    # ไป lab ถัดไปได้ทันที
```

## โครงสร้าง repo

| | |
|---|---|
| [`app/`](app/) | ระบบเลือกตั้ง + test ทั้งหมด (`test/unit`, `test/integration`, `e2e/`) และ Liquibase changelog (`db/`) — รายละเอียดใน [app/README.md](app/README.md) |
| [`labs/`](labs/) | โจทย์ของแต่ละ lab |
| [`checklist/`](checklist/) | Readiness Checklist สำหรับโปรเจกต์ของตัวเอง |
| [`setup/`](setup/) | สิ่งที่ต้องทำก่อนมา workshop |
| `.github/workflows/ci.yml` · `.gitlab-ci.yml` · `Jenkinsfile` | pipeline เดียวกันบน 3 CI |
| `slides/` · `facilitator/` | สไลด์ (Marp) และคู่มือผู้สอน — อยู่บน `main` เท่านั้น |

## คำสั่งที่ใช้บ่อย

รันในโฟลเดอร์ `app/` (ต้องเปิด Docker ไว้ ยกเว้น `test:unit`)

```bash
npm run doctor            # ตรวจความพร้อมของเครื่อง
npm run test:unit         # unit test — ไม่มี I/O
npm run test:integration  # เปิด test DB (port 5433) + migrate แล้วรัน component test
npm run test:e2e          # build app container แล้วรัน Playwright API test
npm run db:reset:test     # สร้าง test DB ใหม่ทั้งก้อน
```

## Workshop นี้อิงจาก

- Toby Clemson — [*Testing Strategies in a Microservice Architecture*](https://martinfowler.com/articles/microservice-testing/) (martinfowler.com)
- Gerard Meszaros — [*xUnit Test Patterns: Refactoring Test Code*](http://xunitpatterns.com/)
- Steve Freeman & Nat Pryce — [*Growing Object-Oriented Software, Guided by Tests*](https://growing-object-oriented-software.com/)
- Michael Feathers — [*Working Effectively with Legacy Code*](https://www.informit.com/store/working-effectively-with-legacy-code-9780131177055)
