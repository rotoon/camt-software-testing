import * as voterRepo from '@/repositories/VoterRepository';
import * as userRepo from '@/repositories/UserRepository';
import { createVoteService } from '@/services/VoterService';

jest.mock('@/repositories/VoterRepository', () => ({
  getCandidatesRepository: jest.fn(),
  getCandidateInConstituencyRepository: jest.fn(),
  createVoteRepository: jest.fn(),
  updateVoteRepository: jest.fn(),
  getMyVoteRepository: jest.fn(),
  getConstituencyRepository: jest.fn(),
}));
jest.mock('@/repositories/UserRepository', () => ({
  findByUserIdRepository: jest.fn(),
}));

const repo = jest.mocked(voterRepo);
const users = jest.mocked(userRepo);

function givenVoterInConstituency(constituencyId: number, { isClosed = false } = {}) {
  users.findByUserIdRepository.mockResolvedValue({ id: 1, district: { constituency: { id: constituencyId } } } as any);
  repo.getConstituencyRepository.mockResolvedValue({ id: constituencyId, isClosed } as any);
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('createVoteService', () => {
  it('UT-01 saves the vote when the poll is open and the candidate is in the voter constituency', async () => {
    givenVoterInConstituency(1);
    repo.getCandidateInConstituencyRepository.mockResolvedValue({ id: 5 } as any);
    repo.createVoteRepository.mockResolvedValue({ id: 99, userId: 1, candidateId: 5 } as any);

    const result = await createVoteService({ userId: 1, candidateId: 5 });

    expect(repo.createVoteRepository).toHaveBeenCalledWith({ userId: 1, candidateId: 5 });
    expect(result).toEqual({ id: 99, userId: 1, candidateId: 5 });
  });
});