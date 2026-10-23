-- ==============================================================================
-- AptoHire Seed Data: Parity with Mock Database & Spec Personas
-- Spec: architecture.md §6, §14
-- ==============================================================================

-- 1. App Configuration
INSERT INTO app_config (key, value) VALUES
  ('PASS_MARK', '50'::jsonb),
  ('BORDERLINE', '[40, 60]'::jsonb),
  ('AGENT_MODE', '"mock"'::jsonb),
  ('REQUIRE_VIDEO', 'true'::jsonb),
  ('AI_DAILY_CAP_PER_USER', '5'::jsonb),
  ('AI_KILL_SWITCH', 'false'::jsonb),
  ('VIDEO_MAX_MB', '50'::jsonb),
  ('VIDEO_MAX_SECONDS', '190'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Universities
INSERT INTO universities (id, name, short_name, tier, kind, city, state, email_domains, status, approved_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Uni A (Apex Institute of Technology)', 'Apex Tech', 'tier1', 'university', 'Bengaluru', 'Karnataka', ARRAY['unia.edu.test'], 'approved', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Uni B (Beacon State University)', 'Beacon State', 'tier2', 'university', 'Pune', 'Maharashtra', ARRAY['unib.edu.test'], 'approved', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Crestview University', 'Crestview', 'tier2', 'university', 'Hyderabad', 'Telangana', ARRAY['crestview.edu.test'], 'approved', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Core Skills
INSERT INTO skills (id, slug, name, family, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'react', 'React', 'Frontend Web', 'Component architecture, state hooks, and virtual DOM rendering'),
  ('10000000-0000-0000-0000-000000000002', 'typescript', 'TypeScript', 'Programming Languages', 'Static typing, interfaces, generics, and strict compile checking'),
  ('10000000-0000-0000-0000-000000000003', 'javascript', 'JavaScript', 'Programming Languages', 'ES6+ syntax, asynchronous programming, closures, and browser APIs'),
  ('10000000-0000-0000-0000-000000000004', 'sql', 'SQL', 'Database & Backend', 'Relational querying, joins, grouping, indexing, and transactions'),
  ('10000000-0000-0000-0000-000000000005', 'html-css', 'HTML & CSS', 'Frontend Web', 'Semantic markup, accessible controls, flexbox, and responsive layouts'),
  ('10000000-0000-0000-0000-000000000006', 'node-js', 'Node.js', 'Database & Backend', 'Server-side runtime, HTTP servers, REST APIs, and file streams'),
  ('10000000-0000-0000-0000-000000000007', 'accessibility', 'Accessibility (a11y)', 'Frontend Web', 'WCAG 2.1 AA standards, keyboard navigation, and ARIA attributes')
ON CONFLICT (id) DO NOTHING;

-- 4. Skill Graph Edges
INSERT INTO skill_edges (a, b, weight) VALUES
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 0.9),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 0.95),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 0.8),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 0.85),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 0.9)
ON CONFLICT (a, b) DO NOTHING;

-- 5. Project Templates
INSERT INTO project_templates (id, family, title, level, brief, rubric, active) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Frontend Web',
    'Interactive Accessible Product Catalog',
    'Proficient',
    '{
      "scenario": "Build an interactive product catalog for an enterprise e-commerce vendor.",
      "deliverables": [
        "Interactive web application with instant search and category filtering",
        "Keyboard-navigable details modal with focus management",
        "A 2-3 minute video walkthrough explaining code design choices"
      ],
      "constraints": [
        "WCAG 2.1 AA accessible with visible focus rings",
        "No UI component frameworks (use native HTML and Tailwind only)",
        "Zero TypeScript compiler errors in strict mode"
      ],
      "originality_questions": [
        "Which state management approach did you choose and why?",
        "How did you implement focus trapping in the dialog modal?"
      ]
    }'::jsonb,
    '{
      "criteria": [
        {"name": "Component architecture", "weight": 0.3},
        {"name": "Accessibility & semantics", "weight": 0.3},
        {"name": "TypeScript type safety", "weight": 0.2},
        {"name": "Walkthrough clarity", "weight": 0.2}
      ]
    }'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;
