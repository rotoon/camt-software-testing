import { faker } from "@faker-js/faker";

import * as voterRepo from "@/repositories/VoterRepository";
import * as userRepo from "@/repositories/UserRepository";
import {
  createVoteService,
  getCandidatesService,
} from "@/services/VoterService";

jest.mock("@/repositories/VoterRepository", () => ({
  getCandidatesRepository: jest.fn(),
  getCandidateInConstituencyRepository: jest.fn(),
  createVoteRepository: jest.fn(),
  updateVoteRepository: jest.fn(),
  getMyVoteRepository: jest.fn(),
  getConstituencyRepository: jest.fn(),
}));
jest.mock("@/repositories/UserRepository", () => ({
  findByUserIdRepository: jest.fn(),
}));

const repo = jest.mocked(voterRepo);
const users = jest.mocked(userRepo);

function givenVoterInConstituency(
  constituencyId: number,
  { isClosed = false } = {},
) {
  users.findByUserIdRepository.mockResolvedValue({
    id: 1,
    district: { constituency: { id: constituencyId } },
  } as any);
  repo.getConstituencyRepository.mockResolvedValue({
    id: constituencyId,
    isClosed,
  } as any);
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe("createVoteService", () => {
  it("UT-01 saves the vote when the poll is open and the candidate is in the voter constituency", async () => {
    givenVoterInConstituency(1);
    repo.getCandidateInConstituencyRepository.mockResolvedValue({
      id: 5,
    } as any);
    repo.createVoteRepository.mockResolvedValue({
      id: 99,
      userId: 1,
      candidateId: 5,
    } as any);

    const result = await createVoteService({ userId: 1, candidateId: 5 });

    expect(repo.createVoteRepository).toHaveBeenCalledWith({
      userId: 1,
      candidateId: 5,
    });
    expect(result).toEqual({ id: 99, userId: 1, candidateId: 5 });
  });

  it("UT-02 refuses to vote when the poll is closed", async () => {
    givenVoterInConstituency(1, { isClosed: true });

    const result = await createVoteService({ userId: 1, candidateId: 5 });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      message: "Constituency is closed",
    });
    expect(repo.createVoteRepository).not.toHaveBeenCalled();
  });

  it("UT-10 saves exactly the generated voter and candidate ids (faker)", async () => {
    faker.seed(20261010);
    const userId = faker.number.int({ min: 1, max: 100_000 });
    const candidateId = faker.number.int({ min: 1, max: 1_000 });
    const constituencyId = faker.number.int({ min: 1, max: 400 });
    givenVoterInConstituency(constituencyId);
    repo.getCandidateInConstituencyRepository.mockResolvedValue({
      id: candidateId,
    } as any);

    await createVoteService({ userId, candidateId });

    expect(repo.getCandidateInConstituencyRepository).toHaveBeenCalledWith(
      constituencyId,
      candidateId,
    );
    expect(repo.createVoteRepository).toHaveBeenCalledWith({
      userId,
      candidateId,
    });
  });
});

describe("getCandidatesService", () => {
  it("UT-08 asks only for the candidates of the given constituency (spy)", async () => {
    repo.getCandidatesRepository.mockResolvedValue([]);

    await getCandidatesService(3);

    expect(repo.getCandidatesRepository).toHaveBeenCalledTimes(1);
    expect(repo.getCandidatesRepository.mock.calls[0][0]).toBe(3);
  });
});
