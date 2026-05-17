# Mermaid Diagram Patterns

## Flowchart — Process Flow (TD)

```mermaid
flowchart TD
    start([Start]) --> parse{Valid input?}
    parse -->|Yes| process[Process data]
    parse -->|No| error[Return error]
    process --> validate{Passes validation?}
    validate -->|Yes| save[(Save to DB)]
    validate -->|No| error
    save --> finish([Done])
```

## Flowchart — Architecture (LR)

```mermaid
flowchart LR
    client[Client Browser] --> cdn[CDN]
    cdn --> app[App Server]
    app --> auth[Auth Service]
    app --> api[API Gateway]
    api --> svc1[Service 1]
    api --> svc2[Service 2]
    svc1 --> db1[(Primary DB)]
    svc2 --> db2[(Cache)]
    svc1 --> queue[Message Queue]
    queue --> worker[Background Worker]
    worker --> db1
```

## Sequence Diagram — API Interaction

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Service
    participant DB

    Client->>Gateway: POST /api/resource
    Gateway->>Auth: Validate token
    Auth-->>Gateway: Token valid
    Gateway->>Service: Forward request
    Service->>DB: Write data
    DB-->>Service: Success
    Service-->>Gateway: 201 Created
    Gateway-->>Client: Response with resource
```

## Class Diagram — Domain Model

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +validate() bool
        +toJSON() object
    }
    class Account {
        +String id
        +String userId
        +Number balance
        +deposit(amount) void
        +withdraw(amount) bool
    }
    class Transaction {
        +String id
        +String accountId
        +Number amount
        +String type
        +Date createdAt
    }
    User "1" --> "*" Account : owns
    Account "1" --> "*" Transaction : has
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Submit
    Review --> Approved: Approve
    Review --> Rejected: Reject
    Rejected --> Draft: Revise
    Approved --> Deployed: Deploy
    Deployed --> [*]
```

## ER Diagram — Database Schema

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Address : has
    Order ||--|{ OrderItem : contains
    OrderItem ||--|| Product : references
    Product }o--|| Category : belongsTo
    Address ||--|| City : locatedIn

    User {
        uuid id PK
        string email UK
        string name
        datetime created_at
    }
    Order {
        uuid id PK
        uuid user_id FK
        decimal total
        string status
        datetime created_at
    }
    Product {
        uuid id PK
        string name
        string sku UK
        decimal price
        uuid category_id FK
    }
```

## Git Graph

```mermaid
gitGraph
    commit id: "chore: initial setup"
    branch feature/auth
    checkout feature/auth
    commit id: "feat: add login endpoint"
    commit id: "feat: add JWT middleware"
    checkout main
    commit id: "fix: db connection pool"
    merge feature/auth
    commit id: "chore: bump version 1.1.0"
```

## C4 Container Diagram

```mermaid
C4Container
    title Container Diagram — System Name
    Person(user, "End User", "A user of the system")
    System_Boundary(sys, "System Name") {
        Container(web, "Web App", "React + TypeScript", "Provides UI")
        Container(api, "API", "Node.js + Express", "Handles business logic")
        ContainerDb(db, "Database", "PostgreSQL", "Persists data")
    }
    Rel(user, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "REST/JSON")
    Rel(api, db, "Reads/Writes", "SQL")
```
