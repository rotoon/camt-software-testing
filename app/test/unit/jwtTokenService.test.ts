import { JwtTokenService, Principal } from '../../src/auth/tokenService';

const principal: Principal = { userId: 7, role: 'VOTER', districtId: 'CM-1' };

describe('JwtTokenService', () => {
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
  it.todo('rejects a token after it expires (jest.useFakeTimers + jest.setSystemTime)');
});
