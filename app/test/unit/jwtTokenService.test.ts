import { JwtTokenService, Principal } from '../../src/auth/tokenService';

const principal: Principal = { userId: 7, role: 'VOTER', districtId: 'CM-1' };

describe('JwtTokenService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('verifies a token it issued and returns the same principal', () => {
    const tokens = new JwtTokenService('test-secret');
    const token = tokens.issue(principal);

    const verified = tokens.verify(token);

    expect(verified).toEqual(principal);
  });


  it('rejects a token signed with another secret', () => {
    const attacker = new JwtTokenService('attacker-secret');
    const token = attacker.issue(principal);
    const tokens = new JwtTokenService('test-secret');

    const verified = tokens.verify(token);

    expect(verified).toBeNull();
  });

  it('rejects a token after it expires', () => {
    jest.useFakeTimers({ now: new Date('2026-10-03T09:00:00+07:00') });
    const tokens = new JwtTokenService('test-secret', 60);   // หมดอายุใน 60 วินาที
    const token = tokens.issue(principal);
    jest.setSystemTime(new Date('2026-10-03T09:01:01+07:00')); // ผ่านไป 61 วินาที

    const verified = tokens.verify(token);

    expect(verified).toBeNull();
  });
});
