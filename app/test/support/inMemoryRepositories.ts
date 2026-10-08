import { District, Party } from '../../src/domain/types';
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