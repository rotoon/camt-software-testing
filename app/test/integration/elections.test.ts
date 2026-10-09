import request from 'supertest';
import { Pool } from 'pg';
import { createApp, pgDeps } from '../../src/app';
import { pool as legacyPool } from '../../src/db';
import { aCandidate, aCommissioner, anAdmin, aParty, aVoter } from '../support/builders';
import { createTestPool, truncateAll } from './support/database';
import { authHeader, given, testTokens } from './support/given';

describe('election management (component)', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  let db: ReturnType<typeof given>;

  beforeAll(() => {
    pool = createTestPool();
    app = createApp(pgDeps(pool, testTokens));
    db = given(pool);
  });

  beforeEach(async () => {
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
    await legacyPool.end(); // voteRoutes ใช้ pool ของตัวเอง ต้องปิดด้วยไม่งั้น jest ไม่จบ
  });

  describe('POST /parties', () => {
    const newParty = { name: 'พรรคทดสอบ', policy: 'นโยบายทดสอบ' };

    it('lets a commissioner create a party', async () => {
      const commissioner = await db.user(aCommissioner());

      const res = await request(app).post('/parties').set('Authorization', authHeader(commissioner)).send(newParty);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'พรรคทดสอบ' });
    });

    it('forbids a voter (403)', async () => {
      const voter = await db.user(aVoter());

      const res = await request(app).post('/parties').set('Authorization', authHeader(voter)).send(newParty);

      expect(res.status).toBe(403);
    });

    it('requires a token (401)', async () => {
      const res = await request(app).post('/parties').send(newParty);

      expect(res.status).toBe(401);
    });

    it('rejects a duplicate party name (409)', async () => {
      const commissioner = await db.user(aCommissioner());
      await db.party(aParty().named('พรรคทดสอบ'));

      const res = await request(app).post('/parties').set('Authorization', authHeader(commissioner)).send(newParty);

      expect(res.status).toBe(409);
    });
  });

  it('adds a candidate that then appears in the public results of that district', async () => {
    const commissioner = await db.user(aCommissioner());
    const party = await db.party(aParty());

    const added = await request(app)
      .post('/districts/CM-1/candidates')
      .set('Authorization', authHeader(commissioner))
      .send({ partyId: party.id, number: 3, firstName: 'สมหญิง', lastName: 'ใจงาม' });
    const results = await request(app).get('/districts/CM-1/results');

    expect(added.status).toBe(201);
    expect(results.body.candidates).toEqual([
      expect.objectContaining({ number: 3, firstName: 'สมหญิง', partyName: party.name }),
    ]);
  });

  it('lets an admin promote a voter to commissioner', async () => {
    const admin = await db.user(anAdmin());
    const voter = await db.user(aVoter());

    const res = await request(app)
      .patch(`/admin/users/${voter.id}/role`)
      .set('Authorization', authHeader(admin))
      .send({ role: 'COMMISSIONER' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: voter.id, role: 'COMMISSIONER' });
  });

  it('shows a voter only the candidates of their own district', async () => {
    const voter = await db.user(aVoter().inDistrict('CM-2'));
    const party = await db.party(aParty());
    await db.candidate(aCandidate().inDistrict('CM-1').forParty(party.id).numbered(1));
    await db.candidate(aCandidate().inDistrict('CM-2').forParty(party.id).numbered(1));

    const res = await request(app).get('/me/candidates').set('Authorization', authHeader(voter));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ number: 1, party: party.name });
  });
});