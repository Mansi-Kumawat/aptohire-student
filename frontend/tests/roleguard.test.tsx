import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '@/app/RoleGuard';
import { AuthUser } from '@/lib/backend/types';

describe('RoleGuard Hard Boundaries', () => {
  it('renders student content when role is student', () => {
    const studentUser: AuthUser = {
      id: 'user-1',
      email: 'student@unia.edu.test',
      role: 'student',
    };

    render(
      <RoleGuard user={studentUser}>
        <div data-testid="student-portal-content">Protected Student Content</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('student-portal-content')).toBeInTheDocument();
  });

  it('renders "Go to your portal" screen with portal link for university role', () => {
    const uniUser: AuthUser = {
      id: 'user-uni',
      email: 'prof@unia.edu.test',
      role: 'university',
    };

    render(
      <RoleGuard user={uniUser}>
        <div data-testid="student-portal-content">Should not be rendered</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('student-portal-content')).not.toBeInTheDocument();
    expect(screen.getByText('Go to your portal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open University portal/i })).toBeInTheDocument();
  });

  it('renders "Go to your portal" screen with portal link for organization role', () => {
    const orgUser: AuthUser = {
      id: 'user-org',
      email: 'recruiter@northwind.test',
      role: 'organization',
    };

    render(
      <RoleGuard user={orgUser}>
        <div data-testid="student-portal-content">Should not be rendered</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('student-portal-content')).not.toBeInTheDocument();
    expect(screen.getByText('Go to your portal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Organization portal/i })).toBeInTheDocument();
  });

  it('renders generic message with NO link and NEVER mentions or links admin portal when role is admin', () => {
    const adminUser: AuthUser = {
      id: 'user-admin',
      email: 'admin@aptohire.test',
      role: 'admin',
    };

    const { container } = render(
      <RoleGuard user={adminUser}>
        <div data-testid="student-portal-content">Should not be rendered</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('student-portal-content')).not.toBeInTheDocument();
    expect(screen.getByText("This account can't use the student site.")).toBeInTheDocument();

    // Verify hard boundaries:
    // 1. Never mention the word "admin"
    expect(container.textContent?.toLowerCase()).not.toContain('admin');
    // 2. No links on the page
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(0);
  });
});
