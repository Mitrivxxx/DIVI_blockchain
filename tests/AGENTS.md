# Tests AGENTS — DIVI Test Suites

Short testing-layer context. Broader project overview: `../AGENTS.md`.

## Role

Automated integration and functional test suites verifying backend API endpoints, authentication, business workflows, and persistence. Tests execute against an isolated in-memory runtime without requiring external dependencies (Postgres, Sepolia RPC, Pinata, or MinIO).

## Structure

```
tests/
  backend.Tests/
    backend.Tests.csproj
    Infrastructure/
      DiviApiFactory.cs       # WebApplicationFactory fixture configuring fakes & in-memory DB
      TestEnvironment.cs      # Test configuration & environment variables
      TestAuth.cs             # JWT token generators & Web3 login helpers
      TestDocuments.cs        # Test document & PDF fixtures
      HttpTestExtensions.cs   # HTTP response assertions & JSON helpers
      Roles.cs                # System role IDs & names
      Fakes/                  # In-memory test doubles (Sepolia, Pinata, MinIO)
        FakeBlockchainService.cs
        FakePinataHandler.cs
        InMemoryObjectStorage.cs
    Identity/                 # Auth & registration tests (email, Web3, JWT)
    Documents/                # Issuance, verification, revoke & credential wallet tests
    Issuers/                  # Issuer applications, institution profiles & admin tests
    Members/                  # Profile updates, avatars & social follow tests
```

## Running Tests

From root or `tests/` directory:

```bash
dotnet test tests/backend.Tests/backend.Tests.csproj
```

Run a specific test class or filter:

```bash
dotnet test tests/backend.Tests/backend.Tests.csproj --filter "FullyQualifiedName~AuthTests"
```

