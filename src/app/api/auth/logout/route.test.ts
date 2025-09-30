import { POST } from "./route";

it("clears the token cookie and returns a message", async () => {
  const res = await POST();
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({ message: "Logged out" });

  const setCookie = res.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  expect(setCookie!).toMatch(/(?:^|,)\s*token=/);
  expect(setCookie!).toMatch(/Max-Age=0/i);
  expect(setCookie!).toMatch(/HttpOnly/i);
  expect(setCookie!).toMatch(/Path=\//i);
  expect(setCookie!).toMatch(/SameSite=Strict/i);
});
