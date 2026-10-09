import { Pool } from 'pg';
import { JwtTokenService } from '../../../src/auth/tokenService';
import { User } from '../../../src/domain/types';
import { PgCandidateRepository } from '../../../src/repositories/candidateRepository';
import { PgPartyRepository } from '../../../src/repositories/partyRepository';
import { PgUserRepository } from '../../../src/repositories/userRepository';
import { CandidateBuilder, PartyBuilder, UserBuilder } from '../../support/builders';

// secret เดียวกับ app ที่เทส (env.ts ตั้ง JWT_SECRET ไว้)
export const testTokens = new JwtTokenService(process.env.JWT_SECRET!);

export function given(pool: Pool) {
    const users = new PgUserRepository(pool);
    const parties = new PgPartyRepository(pool);
    const candidates = new PgCandidateRepository(pool);

    return {
        async user(builder: UserBuilder): Promise<User> {
            const { role, ...newUser } = builder.build();
            const created = await users.create(newUser);
            if (role === 'VOTER') return created;
            return (await users.updateRole(created.id, role))!;
        },
        party: (builder: PartyBuilder) => parties.create(builder.build()),
        candidate: (builder: CandidateBuilder) => candidates.create(builder.build()),
    };
}

export function authHeader(user: User): string {
    return `Bearer ${testTokens.issue({ userId: user.id, role: user.role, districtId: user.districtId })}`;
}