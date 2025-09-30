import { GET } from "./route";

jest.mock("@/lib/tokenCheck", () => ({
  verifyToken: jest.fn(),
}));
const { verifyToken } = jest.requireMock("@/lib/tokenCheck") as any;

const mkReq = () => new Request("http://localhost/api/auth/me");

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);

    const res = await GET(mkReq());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns user info when authorized", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 123,
      email: "a@b.com",
    });

    const res = await GET(mkReq());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      userId: 123,
      email: "a@b.com",
    });
  });
});
