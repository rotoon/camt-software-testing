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
    it.todo('lets a commissioner create a party');
    it.todo('forbids a voter (403)');
    it.todo('requires a token (401)');
    it.todo('rejects a duplicate party name (409)');
  });

  describe('POST /districts/:id/candidates', () => {
    it.todo('adds a candidate that then appears in the public results of that district');
  });

  describe('PATCH /admin/users/:id/role', () => {
    it.todo('lets an admin promote a voter to commissioner');
  });

  describe('GET /me/candidates', () => {
    it.todo('shows a voter only the candidates of their own district');
  });
});