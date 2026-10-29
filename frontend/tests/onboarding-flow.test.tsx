import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const mocks = vi.hoisted(() => ({
  backend: {
    auth: { registerStudent: vi.fn() },
    affiliations: { listUniversities: vi.fn() },
    skills: { listSkills: vi.fn() },
    student: { updateProfile: vi.fn() },
  },
  user: { id: 'student-user-id', email: 'student@example.test', role: 'student', full_name: 'Demo Student' },
}));

vi.mock('@/lib/backend', () => ({ useBackend: () => mocks.backend }));
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));

import { OnboardingPage } from '@/pages/OnboardingPage';

const renderPage = () => render(
  <HelmetProvider>
    <MemoryRouter initialEntries={['/onboarding']}>
      <OnboardingPage />
    </MemoryRouter>
  </HelmetProvider>
);

const reachUniversityStep = async () => {
  renderPage();
  fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Demo Student' } });
  fireEvent.click(screen.getByRole('button', { name: /Continue to university verification/i }));
  await screen.findByRole('heading', { name: 'Your university' });
};

describe('Student onboarding actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.backend.affiliations.listUniversities.mockResolvedValue([
      { id: '11111111-1111-4111-8111-111111111111', name: 'Beacon State University' },
    ]);
    mocks.backend.skills.listSkills.mockResolvedValue([]);
    mocks.backend.student.updateProfile.mockResolvedValue({});
    mocks.backend.auth.registerStudent.mockResolvedValue({
      student_id: 'student-row-id',
      outcome: 'needs_student_id',
      matched_existing_person: false,
    });
  });

  it('shows the ID verification state, then shows a successful verification result', async () => {
    mocks.backend.auth.registerStudent
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'needs_student_id', matched_existing_person: false })
      .mockResolvedValueOnce({
        student_id: 'student-row-id',
        outcome: 'verified_student_id',
        affiliation: { university_name: 'Beacon State University', verification_type: 'student_id' },
        matched_existing_person: false,
      });
    await reachUniversityStep();
    fireEvent.click(screen.getByRole('button', { name: /Beacon State University/i }));
    expect(await screen.findByText(/Student ID verification/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Student ID number/i), { target: { value: 'B-1042' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify student ID/i }));
    expect(await screen.findByText('Student ID verified')).toBeInTheDocument();
    expect(mocks.backend.auth.registerStudent).toHaveBeenLastCalledWith(expect.objectContaining({
      choice: expect.objectContaining({
        kind: 'student_id',
        university_id: '11111111-1111-4111-8111-111111111111',
        student_id_number: 'B-1042',
      }),
    }));
  });

  it('adds an unlisted university and clearly shows the unverified result', async () => {
    mocks.backend.auth.registerStudent
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'needs_student_id', matched_existing_person: false })
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'unverified', matched_existing_person: false });
    await reachUniversityStep();
    fireEvent.change(screen.getByPlaceholderText(/Enter university name/i), { target: { value: 'Fictional Valley College' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(await screen.findByText('University affiliation added')).toBeInTheDocument();
    expect(mocks.backend.auth.registerStudent).toHaveBeenLastCalledWith(expect.objectContaining({
      choice: { kind: 'unregistered', university_name: 'Fictional Valley College' },
    }));
  });

  it('allows continuing without ID verification for the selected university', async () => {
    mocks.backend.auth.registerStudent
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'needs_student_id', matched_existing_person: false })
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'unverified', matched_existing_person: false });
    await reachUniversityStep();
    fireEvent.click(screen.getByRole('button', { name: /Beacon State University/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue without verifying/i }));
    expect(await screen.findByText('University affiliation added')).toBeInTheDocument();
    expect(mocks.backend.auth.registerStudent).toHaveBeenLastCalledWith(expect.objectContaining({
      choice: { kind: 'unregistered', university_name: 'Beacon State University' },
    }));
  });

  it('provides a back control to return from university selection to student details', async () => {
    await reachUniversityStep();
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous onboarding step' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument());
  });

  it('shows a visible error when adding an unlisted university fails', async () => {
    mocks.backend.auth.registerStudent
      .mockResolvedValueOnce({ student_id: 'student-row-id', outcome: 'needs_student_id', matched_existing_person: false })
      .mockRejectedValueOnce(new Error('SERVICE_UNAVAILABLE'));
    await reachUniversityStep();
    fireEvent.change(screen.getByPlaceholderText(/Enter university name/i), { target: { value: 'Fictional Valley College' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not add that university/i);
  });
});
