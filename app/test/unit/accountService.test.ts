import { AccountService, Registration } from '../../src/services/accountService';
import { TokenService } from '../../src/auth/tokenService';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { UserRepository } from '../../src/repositories/userRepository';
import { ValidationError } from '../../src/errors';
import { verifyPassword } from '../../src/auth/passwords';

// ข้อมูลสมัครที่ถูกต้องทุกช่อง แต่ละ test เปลี่ยนเฉพาะช่องที่สนใจ
const validRegistration: Registration = {
  nationalId: '1509900000017',
  password: 'voter1234',
  firstName: 'Somchai',
  lastName: 'Jaidee',
  address: '1 Nimman Rd',
  districtId: 'CM-1',
};

// Dummy: register ไม่ได้ใช้ token ถ้าถูกเรียกให้พังทันที
const dummyTokens: TokenService = {
  issue: () => { throw new Error('dummy should not be used'); },
  verify: () => { throw new Error('dummy should not be used'); },
};
// Lab 03 — replace each it.todo with a real test. See labs/03-test-doubles/README.md
describe('AccountService', () => {
  describe('register', () => {

    it('registers a voter in an existing district (stub DistrictRepository, dummy TokenService)', async () => {
      // Stub: districts ตอบว่าเขต CM-1 มีอยู่จริง (ป้อน input ทางอ้อม)
      const districts: DistrictRepository = {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue({ id: 'CM-1', province: 'เชียงใหม่', number: 1 }),
      };
      // Stub: users ตอบว่ายังไม่มีเลขบัตรนี้ และ create คืน user ที่บันทึกแล้ว
      const users: UserRepository = {
        findById: jest.fn(),
        findByNationalId: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async (u) => ({ ...u, id: 1, role: 'VOTER' })),
        updateRole: jest.fn(),
      };
      // Dummy: dummyTokens ต้องส่งให้ constructor แต่ register ไม่ได้ใช้
      const service = new AccountService(users, districts, dummyTokens);

      const user = await service.register(validRegistration);

      expect(user).toMatchObject({ nationalId: '1509900000017', districtId: 'CM-1', role: 'VOTER' });
    });

    it('rejects an unknown district', async () => {
      // Stub: districts ตอบว่าไม่มีเขตนี้
      const districts: DistrictRepository = {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue(null),
      };
      // Stub: users ตอบว่ายังไม่มีเลขบัตรนี้ (ไม่ควรไปถึง create)
      const users: UserRepository = {
        findById: jest.fn(),
        findByNationalId: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        updateRole: jest.fn(),
      };
      const service = new AccountService(users, districts, dummyTokens);

      const registering = service.register({ ...validRegistration, districtId: 'XX-9' });

      await expect(registering).rejects.toThrow(ValidationError);
    });

    it('stores a hash, never the plain-text password', async () => {
      // Stub: districts ตอบว่าเขต CM-1 มีอยู่จริง
      const districts: DistrictRepository = {
        findAll: jest.fn(),
        findById: jest.fn().mockResolvedValue({ id: 'CM-1', province: 'เชียงใหม่', number: 1 }),
      };
      // Spy: create จดไว้ว่าได้รับข้อมูลอะไร เพื่อเอามาตรวจทีหลัง
      const create = jest.fn().mockImplementation(async (u) => ({ ...u, id: 1, role: 'VOTER' }));
      const users: UserRepository = {
        findById: jest.fn(),
        findByNationalId: jest.fn().mockResolvedValue(null),
        create,
        updateRole: jest.fn(),
      };
      const service = new AccountService(users, districts, dummyTokens);

      await service.register({ ...validRegistration, password: 'voter1234' });

      const saved = create.mock.calls[0][0];
      expect(saved.passwordHash).not.toBe('voter1234');
      expect(verifyPassword('voter1234', saved.passwordHash)).toBe(true);
    });

    it.todo('rejects a national id that is already registered (fake UserRepository)');
    it.todo('does not save anything when the national id is invalid (mock: create not called)');
  });

  describe('login', () => {
    it.todo('issues a token for the user (mock TokenService.issue called with the principal)');
    it.todo('rejects a wrong password without issuing a token');
  });

  describe('changeRole', () => {
    it.todo('refuses to make anyone an ADMIN');
  });
});
