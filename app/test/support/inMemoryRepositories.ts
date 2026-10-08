import { Candidate, District, Party } from '../../src/domain/types';
import { CandidateRepository, NewCandidate } from '../../src/repositories/candidateRepository';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { NewParty, PartyRepository } from '../../src/repositories/partyRepository';

export class InMemoryDistrictRepository implements DistrictRepository {
    constructor(private readonly districts: District[] = []) { }

    async findById(id: string): Promise<District | null> {
        return this.districts.find((d) => d.id === id) ?? null;
    }

    async findAll(): Promise<District[]> {
        return [...this.districts].sort(
            (a, b) => a.province.localeCompare(b.province) || a.number - b.number,
        );
    }
}

export class InMemoryPartyRepository implements PartyRepository {
    private readonly parties: Party[] = [];
    private nextId = 1;

    async findAll(): Promise<Party[]> {
        return [...this.parties].sort((a, b) => a.name.localeCompare(b.name));
    }

    async findById(id: number): Promise<Party | null> {
        return this.parties.find((p) => p.id === id) ?? null;
    }

    async findByName(name: string): Promise<Party | null> {
        return this.parties.find((p) => p.name === name) ?? null;
    }

    async create(party: NewParty): Promise<Party> {
        const created: Party = { ...party, id: this.nextId++ };
        this.parties.push(created);
        return { ...created };
    }
}

export class InMemoryCandidateRepository implements CandidateRepository {
    private readonly candidates: Candidate[] = [];
    private nextId = 1;

    constructor(private readonly parties: PartyRepository) { }

    async findByDistrict(districtId: string): Promise<Candidate[]> {
        return this.candidates
            .filter((c) => c.districtId === districtId)
            .sort((a, b) => a.number - b.number);
    }

    async findByParty(partyId: number): Promise<Candidate[]> {
        return this.candidates
            .filter((c) => c.partyId === partyId)
            .sort((a, b) => a.districtId.localeCompare(b.districtId) || a.number - b.number);
    }

    async create(candidate: NewCandidate): Promise<Candidate> {
        const party = await this.parties.findById(candidate.partyId);
        if (!party) throw new Error(`party ${candidate.partyId} does not exist`);

        const created: Candidate = { ...candidate, id: this.nextId++, partyName: party.name };
        this.candidates.push(created);
        return { ...created };
    }
}