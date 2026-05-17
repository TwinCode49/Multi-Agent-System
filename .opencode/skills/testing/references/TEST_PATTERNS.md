# Test Patterns

## Mocking Dependencies (TypeScript)

```typescript
// Manual mock via DI
const mockRepo = {
  findById: vi.fn(),
  create: vi.fn(),
};
const service = new UserService(mockRepo, mockEmailService);

// Module-level mock
vi.mock("./email.service", () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(true),
  })),
}));
```

## Test Fixtures

```typescript
// factories.ts
import { faker } from "@faker-js/faker";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: "user",
    createdAt: new Date(),
    ...overrides,
  };
}
```

## Integration Test (Supertest + Express)

```typescript
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

describe("POST /api/v1/users", () => {
  let app: Express;

  beforeAll(async () => { app = await createApp(); });
  afterAll(async () => { await prisma.$disconnect(); });
  beforeEach(async () => { await prisma.user.deleteMany(); });

  it("creates a user and returns 201", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "a@b.com", name: "Alice", password: "secret1234" });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("a@b.com");
  });

  it("returns 409 on duplicate email", async () => {
    await prisma.user.create({ data: { email: "a@b.com", name: "A", password: "x" } });
    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "a@b.com", name: "Alice", password: "secret1234" });

    expect(res.status).toBe(409);
  });

  it("returns 422 for invalid body", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(422);
  });
});
```

## Async Error Testing

```typescript
it("throws when user not found", async () => {
  mockRepo.findById.mockResolvedValue(null);
  await expect(service.findById("nonexistent")).rejects.toThrow("User not found");
});

it("handles concurrent requests", async () => {
  mockRepo.create.mockResolvedValue({ id: "1" });
  const results = await Promise.allSettled([
    service.create({ email: "a@b.com" }),
    service.create({ email: "a@b.com" }),
  ]);
  expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
});
```

## Fixtures Cleanup / Fresh DB State

```typescript
// Transaction rollback strategy
beforeEach(async () => {
  await prisma.$executeRawUnsafe("BEGIN");
});
afterEach(async () => {
  await prisma.$executeRawUnsafe("ROLLBACK");
});
```

## Property-Based Testing (fast-check)

```typescript
import fc from "fast-check";

describe("StringUtils.reverse", () => {
  it("reverses correctly", () => {
    fc.assert(fc.property(fc.string(), (s) => {
      const reversed = reverse(s);
      expect(reversed.length).toBe(s.length);
      expect(reverse(reversed)).toBe(s);
    }));
  });
});
```

## Snapshot Best Practices

```typescript
it("renders user profile", () => {
  const { container } = render(<UserProfile user={buildUser()} />);
  // Keep snapshots small — only the relevant fragment
  expect(container.querySelector(".profile-name")).toMatchSnapshot();
});
```
