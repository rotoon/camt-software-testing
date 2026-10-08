import { toPublicUser } from '../../src/services/accountService';
import { User } from '../../src/domain/types';

describe('toPublicUser', () => {
  it('removes passwordHash from the user', () => {
    const user: User = {
      id: 1,
      nationalId: '1509900000017',
      passwordHash: 'scrypt$salt$hash',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      districtId: 'CM-1',
      role: 'VOTER',
    };

    const result = toPublicUser(user);

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('keeps every other field unchanged', () => {
    const user: User = {
      id: 1,
      nationalId: '1509900000017',
      passwordHash: 'scrypt$salt$hash',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      districtId: 'CM-1',
      role: 'VOTER',
    };

    const result = toPublicUser(user);

    expect(result).toEqual({
      id: 1,
      nationalId: '1509900000017',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      districtId: 'CM-1',
      role: 'VOTER',
    });
  });
});