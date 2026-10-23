import express, { Request, Response } from 'express';
import cors from 'cors';

export const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Public Config
app.get('/api/config/public', (_req: Request, res: Response) => {
  res.json({
    pass_mark: 50,
    borderline_min: 40,
    borderline_max: 60,
    levels: {
      emerging: [0, 50],
      competent: [51, 69],
      proficient: [70, 84],
      advanced: [85, 100],
    },
    require_video: true,
    video_max_mb: 50,
    video_max_seconds: 190,
    ai_daily_cap_per_user: 5,
    agent_mode: 'mock',
  });
});

// Seed data storage
const SEED_PERSONAS = [
  { id: 'user-aarav', name: 'Aarav Sharma', email: 'aarav@unia.edu.test', role: 'student', university: 'Uni A' },
  { id: 'user-naman', name: 'Naman Patel', email: 'naman@demo.aptohire.test', role: 'student', university: 'Uni B' },
  { id: 'user-avi', name: 'Avi Verma', email: 'avi@demo.aptohire.test', role: 'student', university: 'Uni B' },
  { id: 'user-niya', name: 'Niya Sen', email: 'niya@demo.aptohire.test', role: 'student', university: 'Uni D' },
];

const SKILLS = [
  { id: 'skill-react', slug: 'react', name: 'React', family: 'Frontend Web' },
  { id: 'skill-ts', slug: 'typescript', name: 'TypeScript', family: 'Languages' },
  { id: 'skill-js', slug: 'javascript', name: 'JavaScript', family: 'Languages' },
  { id: 'skill-sql', slug: 'sql', name: 'SQL', family: 'Databases' },
  { id: 'skill-node', slug: 'node-js', name: 'Node.js', family: 'Backend' },
];

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = SEED_PERSONAS.find((p) => p.email === email) || {
    id: `user-${Date.now()}`,
    name: email.split('@')[0],
    email,
    role: 'student',
    university: 'Independent University',
  };
  res.json({ user, token: `mock-jwt-${user.id}` });
});

// Skills
app.get('/api/skills', (_req: Request, res: Response) => {
  res.json(SKILLS);
});

app.get('/api/student/:id/scores', (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === 'user-aarav') {
    res.json([
      { id: 'score-1', skill_slug: 'react', skill_name: 'React', score: 72, level: 'Proficient', is_verified: true, is_borderline: false },
      { id: 'score-2', skill_slug: 'typescript', skill_name: 'TypeScript', score: 58, level: 'Competent', is_verified: true, is_borderline: true },
    ]);
  } else if (id === 'user-avi') {
    res.json([
      { id: 'score-3', skill_slug: 'sql', skill_name: 'SQL', score: 88, level: 'Advanced', is_verified: true, is_borderline: false },
    ]);
  } else {
    res.json([]);
  }
});

// Sharing & Access Requests
app.get('/api/sharing/:id/access-requests', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'req-1',
      organization_name: 'Apex Innovations',
      organization_verified: true,
      job_title: 'Full Stack Engineer',
      message: 'We liked your verified React evidence.',
      requested_scopes: ['profile', 'scorecard', 'projects'],
      duration_days: 30,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ]);
});

app.post('/api/sharing/respond', (req: Request, res: Response) => {
  const { request_id, decision, duration_days } = req.body;
  res.json({
    request_id,
    status: decision === 'accept' ? 'accepted' : 'declined',
    expires_at: new Date(Date.now() + (duration_days || 30) * 86400000).toISOString(),
  });
});

// Personal Data Export (GDPR / FERPA)
app.get('/api/account/:id/export', (req: Request, res: Response) => {
  const { id } = req.params;
  const bundle = {
    exported_at: new Date().toISOString(),
    student_id: id,
    platform: 'AptoHire Student Portal',
    notice: 'Machine-readable personal data archive compliant with GDPR and FERPA.',
  };
  const encoded = encodeURIComponent(JSON.stringify(bundle, null, 2));
  res.json({ signed_url: `data:application/json;charset=utf-8,${encoded}` });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`AptoHire Backend API server listening on http://localhost:${port}`);
  });
}
