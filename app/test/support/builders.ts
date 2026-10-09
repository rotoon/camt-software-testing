import { faker, fakerTH } from '@faker-js/faker';
import { hashPassword } from '../../src/auth/passwords';
import { Role } from '../../src/domain/types';
import { NewUser } from '../../src/repositories/userRepository';
import { NewCandidate } from '../../src/repositories/candidateRepository';
import { NewParty } from '../../src/repositories/partyRepository';

export const DEFAULT_PASSWORD = 'password1234';
const DEFAULT_PASSWORD_HASH = hashPassword(DEFAULT_PASSWORD);

export function aValidNationalId(): string {
    const first12 = faker.string.numeric({ length: 12, allowLeadingZeros: false });
    const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (13 - i), 0);
    const checksum = (11 - (sum % 11)) % 10;
    return first12 + checksum;
}

export type UserSpec = NewUser & { role: Role };

export class UserBuilder {
    private spec: UserSpec;

    constructor(role: Role) {
        this.spec = {
            nationalId: aValidNationalId(),
            passwordHash: DEFAULT_PASSWORD_HASH,
            firstName: fakerTH.person.firstName(),
            lastName: fakerTH.person.lastName(),
            address: fakerTH.location.streetAddress(),
            districtId: 'CM-1',
            role,
        };
    }

    inDistrict(districtId: string): this {
        this.spec.districtId = districtId;
        return this;
    }

    withNationalId(nationalId: string): this {
        this.spec.nationalId = nationalId;
        return this;
    }

    build(): UserSpec {
        return { ...this.spec };
    }
}

export class PartyBuilder {
    private spec: NewParty = {
        name: `พรรค${fakerTH.person.lastName()}`,
        logoUrl: null,
        policy: fakerTH.lorem.sentence(),
    };

    named(name: string): this {
        this.spec.name = name;
        return this;
    }

    build(): NewParty {
        return { ...this.spec };
    }
}

export const aParty = () => new PartyBuilder();

export class CandidateBuilder {
    private spec: NewCandidate = {
        districtId: 'CM-1',
        partyId: 1,
        number: 1,
        firstName: fakerTH.person.firstName(),
        lastName: fakerTH.person.lastName(),
        photoUrl: null,
    };

    inDistrict(districtId: string): this {
        this.spec.districtId = districtId;
        return this;
    }

    forParty(partyId: number): this {
        this.spec.partyId = partyId;
        return this;
    }

    numbered(number: number): this {
        this.spec.number = number;
        return this;
    }

    build(): NewCandidate {
        return { ...this.spec };
    }
}


export const aCandidate = () => new CandidateBuilder();
export const aVoter = () => new UserBuilder('VOTER');
export const aCommissioner = () => new UserBuilder('COMMISSIONER');
export const anAdmin = () => new UserBuilder('ADMIN');