# Backend Code Patterns

## Controller Pattern

```typescript
// user.controller.ts
import { Request, Response } from "express";
import { UserService } from "./user.service";
import { createUserSchema } from "./user.validator";

export class UserController {
  constructor(private userService: UserService) {}

  async create(req: Request, res: Response) {
    const data = createUserSchema.parse(req.body);
    const user = await this.userService.create(data);
    res.status(201).json({ data: user });
  }

  async findAll(req: Request, res: Response) {
    const { page = "1", limit = "20" } = req.query;
    const result = await this.userService.findAll({
      page: Number(page),
      limit: Number(limit),
    });
    res.json({ data: result.data, meta: result.meta });
  }

  async findById(req: Request, res: Response) {
    const user = await this.userService.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ data: user });
  }
}
```

## Service Pattern

```typescript
// user.service.ts
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new ConflictError("Email already registered");

    const hashedPassword = await hash(data.password, 12);
    const user = await this.userRepo.create({
      ...data,
      password: hashedPassword,
    });

    await this.emailService.sendWelcome(user.email);
    return user;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const [data, total] = await Promise.all([
      this.userRepo.findAll(params),
      this.userRepo.count(),
    ]);
    return { data, meta: { page: params.page, limit: params.limit, total } };
  }
}
```

## Repository Pattern

```typescript
// user.repository.ts
export class UserRepository {
  constructor(private db: PrismaClient) {}

  async create(data: CreateUserDto): Promise<User> {
    return this.db.user.create({ data: { ...data } });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findAll(params: PaginationParams): Promise<User[]> {
    const { page, limit } = params;
    return this.db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async count(): Promise<number> {
    return this.db.user.count();
  }
}
```

## Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends AppError {
  constructor(detail: string) {
    super(422, "VALIDATION_ERROR", detail);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}
```

## Centralized Error Middleware

```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      type: `https://api.example.com/errors/${err.code.toLowerCase()}`,
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      instance: req.path,
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      type: "https://api.example.com/errors/validation",
      title: "VALIDATION_ERROR",
      status: 422,
      detail: err.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
      instance: req.path,
    });
  }

  console.error("Unhandled error:", err);
  Sentry.captureException(err);
  res.status(500).json({
    type: "https://api.example.com/errors/internal",
    title: "INTERNAL_ERROR",
    status: 500,
    detail: "An unexpected error occurred",
    instance: req.path,
  });
}
```

## Validation Schema (Zod)

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2).max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```
