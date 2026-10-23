import React, { useState } from 'react';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { env } from '@/config/env';
import { Helmet } from 'react-helmet-async';
import {
  Shield,
  KeyRound,
  Mail,
  Download,
  Trash2,
  RotateCcw,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const backend = useBackend();
  const { user, signOut } = useAuth();
  const toast = useToast();

  // Email Change
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password Change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Export Data
  const [isExporting, setIsExporting] = useState(false);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !user) return;
    setIsUpdatingEmail(true);

    try {
      await backend.auth.updateEmail(newEmail);
      setEmailChangeRequested(true);
      toast.success('Confirmation email sent.');
    } catch {
      toast.error('Failed to request email update.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      toast.error('Password must be at least 10 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);

    try {
      await backend.auth.updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    } catch {
      toast.error('Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      const res = await backend.account.exportMyData(user.id);
      // Create download trigger
      const a = document.createElement('a');
      a.href = res.signed_url;
      a.download = `AptoHire-Data-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Data export generated.');
    } catch {
      toast.error('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOutAll = async () => {
    try {
      await signOut('global');
      window.location.href = '/login';
    } catch {
      toast.error('Failed to sign out of all devices.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);

    try {
      await backend.account.deleteMyAccount(user.id, deleteConfirmText, deletePassword);
      window.location.href = '/login';
    } catch {
      toast.error('Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await backend.account.resetDemoData();
      toast.success('Demo data reset to initial seed state.');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      toast.error('Failed to reset demo data.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 antialiased pb-16">
      <Helmet>
        <title>Account & Security · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          Account & security
        </h1>
        <p className="text-moss text-[15px] mt-1">
          Manage your credentials, sessions, and data privacy rights
        </p>
      </div>

      {/* 1. EMAIL ADDRESS */}
      <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-moss" />
          <h2 className="font-display font-semibold text-lg text-ink">Email address</h2>
        </div>

        <p className="text-xs text-moss">
          Current account email: <strong className="text-ink">{user?.email}</strong>
        </p>

        {emailChangeRequested ? (
          <div className="p-3.5 rounded-control bg-verdant-50 border border-verdant-200 text-verdant-800 text-xs leading-relaxed">
            Check your new address to confirm. Your old email works until you do.
          </div>
        ) : (
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            <Field label="New email address">
              <Input
                type="email"
                placeholder="new-address@example.edu"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </Field>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!newEmail}
              isLoading={isUpdatingEmail}
            >
              Update email
            </Button>
          </form>
        )}
      </section>

      {/* 2. PASSWORD CHANGE */}
      <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-moss" />
          <h2 className="font-display font-semibold text-lg text-ink">Change password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Field label="New password (≥ 10 characters)">
            <Input
              type="password"
              placeholder="••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>

          <Field label="Confirm new password">
            <Input
              type="password"
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!newPassword || !confirmPassword}
            isLoading={isUpdatingPassword}
          >
            Change password
          </Button>
        </form>
      </section>

      {/* 3. SESSIONS & COOKIES */}
      <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-verdant-700" />
            <h2 className="font-display font-semibold text-lg text-ink">Active session & cookies</h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-verdant-50 text-verdant-800 border border-verdant-200">
            Encrypted cookies active
          </span>
        </div>

        <p className="text-xs text-moss leading-relaxed">
          Signed in on this browser. Sessions and authentication cookies (<code>aptohire_session</code>, <code>aptohire_token</code>) persist for 30 days across all tabs. You can terminate sessions and flush cookies across all devices.
        </p>

        <div className="p-3 rounded-control bg-mist/60 border border-hairline text-xs space-y-1 font-mono text-moss">
          <div>Status: <span className="text-verdant-700 font-semibold">Authenticated</span></div>
          <div>User ID: <span className="text-ink">{user?.id}</span></div>
          <div>Cookie persistence: <span className="text-ink">30-day SameSite=Lax (Cross-tab synced)</span></div>
        </div>

        <Button variant="secondary" size="sm" onClick={handleSignOutAll}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Sign out of all devices</span>
        </Button>
      </section>

      {/* 4. DATA PRIVACY & EXPORT */}
      <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-moss" />
          <h2 className="font-display font-semibold text-lg text-ink">Download my data</h2>
        </div>

        <p className="text-xs text-moss leading-relaxed">
          Request a complete machine-readable JSON archive of all your submissions, rubric evaluations, score history, and consent records.
        </p>

        <Button variant="secondary" size="sm" onClick={handleExportData} isLoading={isExporting}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export all data (JSON)</span>
        </Button>
      </section>

      {/* 5. DEMO RESET (Demo mode only) */}
      {env.VITE_DEMO_MODE && (
        <section className="p-6 rounded-panel border border-ember-300 bg-ember-50/40 space-y-3">
          <div className="flex items-center gap-2 text-ember-700">
            <RotateCcw className="w-5 h-5" />
            <h2 className="font-display font-semibold text-lg">Reset demo state</h2>
          </div>

          <p className="text-xs text-moss leading-relaxed">
            Restore Aarav, Naman, Avi, and Niya to their original seed fixtures and clear cached session submissions.
          </p>

          <Button variant="secondary" size="sm" onClick={handleResetDemoData}>
            Reset demo data
          </Button>
        </section>
      )}

      {/* 6. DANGER ZONE - DELETE ACCOUNT */}
      <section className="p-6 rounded-panel border border-danger-600/30 bg-danger-50/30 space-y-3">
        <div className="flex items-center gap-2 text-danger-600">
          <Trash2 className="w-5 h-5" />
          <h2 className="font-display font-semibold text-lg">Delete student account</h2>
        </div>

        <p className="text-xs text-moss leading-relaxed">
          Permanently delete your profile, verified scorecards, and uploaded videos. Organizations with active access will immediately lose access. This cannot be undone.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete account
        </Button>
      </section>

      {/* DELETE ACCOUNT CONFIRMATION DIALOG */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-danger-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Permanently delete account?</span>
            </DialogTitle>
            <DialogDescription>
              All submissions, rubric scores, and video archives will be destroyed. Organizations with active access will immediately lose access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field label='Type "DELETE" to confirm'>
              <Input
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </Field>

            <Field label="Enter password to verify">
              <Input
                type="password"
                placeholder="••••••••••"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
            >
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AccountPage;
