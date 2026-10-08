import { hashPassword, verifyPassword } from '../../src/auth/passwords';

describe('hashPassword', () => {
  it('does not return the plain text password', () => {
    const password = 'voter1234';

    const hash = hashPassword(password);

    expect(hash).not.toBe(password);
  });

  it('returns a different hash each time for the same password', () => {
    const password = 'voter1234';

    const first = hashPassword(password);
    const second = hashPassword(password);

    expect(first).not.toBe(second);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', () => {
    const stored = hashPassword('voter1234');

    const valid = verifyPassword('voter1234', stored);

    expect(valid).toBe(true);
  });

  it('returns false for a wrong password', () => {
    const stored = hashPassword('voter1234');

    const valid = verifyPassword('voter12345', stored);

    expect(valid).toBe(false);
  });

  it('returns false when the stored hash is malformed', () => {
    const stored = 'garbage';

    const valid = verifyPassword('voter1234', stored);

    expect(valid).toBe(false);
  });
});