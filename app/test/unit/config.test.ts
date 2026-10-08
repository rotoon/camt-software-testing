import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('uses default values when env is empty', () => {
    const env = {};

    const config = loadConfig(env);

    expect(config).toEqual({
      port: 3000,
      databaseUrl: 'postgres://election:election@localhost:5432/election_dev',
      jwtSecret: 'dev-secret',
    });
  });

  it('reads PORT, DATABASE_URL and JWT_SECRET from env', () => {
    const env = {
      PORT: '8080',
      DATABASE_URL: 'postgres://user:pass@db:5432/election_test',
      JWT_SECRET: 'test-secret',
    };

    const config = loadConfig(env);

    expect(config).toEqual({
      port: 8080,
      databaseUrl: 'postgres://user:pass@db:5432/election_test',
      jwtSecret: 'test-secret',
    });
  });
});