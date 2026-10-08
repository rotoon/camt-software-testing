import { ElectionAdminService } from '../../src/services/electionAdminService';
import { ConflictError, ValidationError } from '../../src/errors';
import {
  InMemoryCandidateRepository,
  InMemoryDistrictRepository,
  InMemoryPartyRepository,
} from '../support/inMemoryRepositories';

// Fake ทั้ง 3 ตัว: เพิ่มผู้สมัครแล้ว findByDistrict เห็นคนที่เพิ่งเพิ่มเอง
async function setup() {
  const districts = new InMemoryDistrictRepository([
    { id: 'CM-1', province: 'เชียงใหม่', number: 1 },
    { id: 'CM-2', province: 'เชียงใหม่', number: 2 },
  ]);
  const parties = new InMemoryPartyRepository();
  const candidates = new InMemoryCandidateRepository(parties);
  const service = new ElectionAdminService(parties, candidates, districts);

  const partyA = await parties.create({ name: 'พรรคเอ', logoUrl: null, policy: 'นโยบายเอ' });
  const partyB = await parties.create({ name: 'พรรคบี', logoUrl: null, policy: 'นโยบายบี' });

  return { service, candidates, partyA, partyB };
}

const candidate = (partyId: number, number: number) => ({
  partyId,
  number,
  firstName: 'Somchai',
  lastName: 'Jaidee',
});

describe('ElectionAdminService.addCandidate', () => {
  it('adds a candidate to a district', async () => {
    const { service, candidates, partyA } = await setup();

    const created = await service.addCandidate('CM-1', candidate(partyA.id, 1));

    expect(created).toMatchObject({ districtId: 'CM-1', number: 1, partyName: 'พรรคเอ' });
    expect(await candidates.findByDistrict('CM-1')).toHaveLength(1);
  });

  it('rejects a candidate number already used in the district', async () => {
    const { service, partyA, partyB } = await setup();
    await service.addCandidate('CM-1', candidate(partyA.id, 1));

    const adding = service.addCandidate('CM-1', candidate(partyB.id, 1));

    await expect(adding).rejects.toThrow('candidate number already used');
  });

  it('rejects a second candidate from the same party in the district', async () => {
    const { service, partyA } = await setup();
    await service.addCandidate('CM-1', candidate(partyA.id, 1));

    const adding = service.addCandidate('CM-1', candidate(partyA.id, 2));

    await expect(adding).rejects.toThrow('party already has a candidate');
  });

  it('allows the same number in a different district', async () => {
    const { service, partyA, partyB } = await setup();
    await service.addCandidate('CM-1', candidate(partyA.id, 1));

    const created = await service.addCandidate('CM-2', candidate(partyB.id, 1));

    expect(created).toMatchObject({ districtId: 'CM-2', number: 1 });
  });

  it('rejects an unknown party', async () => {
    const { service } = await setup();

    const adding = service.addCandidate('CM-1', candidate(999, 1));

    await expect(adding).rejects.toThrow(ValidationError);
  });
});
