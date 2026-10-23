# AptoHire Backend: Database Migrations, RLS & Edge Functions

This repository directory contains the server-side architecture, Supabase database schemas, Row Level Security (RLS) policies, Edge Function contracts, and TypeScript types for the AptoHire platform.

## Directory Structure

```
aptohire-backend/
├── README.md
├── supabase/
│   ├── config.toml                   # Local Supabase CLI configuration
│   ├── migrations/
│   │   ├── 20261014000000_schema.sql         # Core schema: profiles, students, universities, submissions, audits
│   │   ├── 20261014000001_rls_policies.sql   # Security definer helpers, FERPA/GDPR student isolation
│   │   └── 20261014000002_seed.sql           # Deterministic seed data & configuration
│   └── functions/
│       ├── assign-project/index.ts           # Project brief and assignment generation
│       ├── audit-submission/index.ts         # Multi-modal code and video audit pipeline
│       ├── confirm-affiliation/index.ts      # University verification and history preservation
│       ├── export-data/index.ts              # FERPA/GDPR personal data export bundle
│       └── verify-originality/index.ts       # Originality evaluation against commit history
└── types/
    └── database.types.ts             # Strongly typed database definitions for client & Edge Functions
```

## Security & Architecture Highlights

1. **The Database is the Security Boundary**: Every table has Row Level Security (RLS) enabled.
2. **Student Data Sovereignty**: Students maintain full ownership of their profiles and proof items. Transferred or graduated students retain their scores and past affiliations.
3. **Blind Hiring Projections**: Organizations query `candidate_profiles` which omit personal identifiable information (PII) like names, emails, and university brands until a formal access request is approved by the student.
4. **Deterministic Mock Parity**: The schema, Edge Functions, and seeds correspond 1:1 with the student portal mock provider (`aptohire-student/src/lib/backend/mock`).
