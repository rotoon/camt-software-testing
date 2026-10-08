import { District } from '../../src/domain/types';
import { DistrictRepository } from '../../src/repositories/districtRepository';

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