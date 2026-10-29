import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useBackend } from '@/lib/backend';
import { UniversityPublic, SkillItem } from '@/lib/domain/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/proof/StatusChip';
import { Logo } from '@/components/brand/Logo';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { copy } from '@/content/copy';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const backend = useBackend();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [catalogWarning, setCatalogWarning] = useState(false);

  // Step 1: About you
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [programLevel, setProgramLevel] = useState<'ug' | 'pg'>('ug');
  const [yearStatus, setYearStatus] = useState<string>('2');

  // Step 2: University & Verification outcome
  const [universities, setUniversities] = useState<UniversityPublic[]>([]);
  const [selectedUniId, setSelectedUniId] = useState<string>('');
  const [customUniName, setCustomUniName] = useState<string>('');
  const [studentIdNumber, setStudentIdNumber] = useState<string>('');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [outcomeState, setOutcomeState] = useState<
    | null
    | 'verified_roster'
    | 'needs_student_id'
    | 'verified_student_id'
    | 'unverified'
    | 'roster_no_match'
    | 'confirm_existing'
  >(null);
  const [matchedUniName, setMatchedUniName] = useState<string>('');

  // Step 3: Target skills / roles
  const [availableSkills, setAvailableSkills] = useState<SkillItem[]>([]);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    backend.affiliations.listUniversities()
      .then((items) => { if (!cancelled) setUniversities(items); })
      .catch(() => { if (!cancelled) setCatalogWarning(true); });
    backend.skills.listSkills()
      .then((items) => { if (!cancelled) setAvailableSkills(items); })
      .catch(() => { if (!cancelled) setCatalogWarning(true); });
    return () => { cancelled = true; };
  }, [backend]);

  const getValidStatus = (): 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters' => {
    if (['incoming', 'enrolled', 'dropout', 'alumni', 'masters'].includes(yearStatus)) {
      return yearStatus as 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
    }
    return 'enrolled';
  };

  // Handle Step 1 submit -> check roster detection
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await backend.auth.registerStudent({
        full_name: fullName,
        program_level: programLevel,
        year: parseInt(yearStatus, 10) || 1,
        status: getValidStatus(),
        choice: { kind: 'detect' },
      });

      if (result.outcome === 'verified_roster') {
        setOutcomeState('verified_roster');
        setMatchedUniName(result.affiliation?.university_name || 'Your university');
      } else if (result.outcome === 'confirm_existing') {
        setOutcomeState('confirm_existing');
      } else {
        // Needs manual selection or student ID
        setOutcomeState(null);
      }
      setStep(2);
    } catch {
      setErrorMessage('We could not check the university roster just now. You can still choose a university or add an unlisted one.');
      setOutcomeState(null);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student ID submit
  const handleVerifyStudentId = async () => {
    if (!selectedUniId) {
      setErrorMessage('Choose a registered university before verifying a student ID.');
      return;
    }
    if (!studentIdNumber.trim()) {
      setErrorMessage('Enter your student ID number to continue.');
      return;
    }
    const submittedStudentIdNumber = studentIdNumber.trim();
    // Raw student IDs must not remain in component state after submission.
    setStudentIdNumber('');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await backend.auth.registerStudent({
        full_name: fullName,
        program_level: programLevel,
        year: parseInt(yearStatus, 10) || 1,
        status: getValidStatus(),
        choice: {
          kind: 'student_id',
          university_id: selectedUniId,
          student_id_number: submittedStudentIdNumber,
        },
      });

      setOutcomeState(result.outcome);
      if (result.affiliation?.university_name) {
        setMatchedUniName(result.affiliation.university_name);
      } else if (result.outcome === 'verified_student_id') {
        setMatchedUniName(universities.find((uni) => uni.id === selectedUniId)?.name || 'Your university');
      }
    } catch {
      setErrorMessage('We could not complete verification. Check the ID and try again, or continue without verification.');
      setOutcomeState('roster_no_match');
    } finally {
      setIsLoading(false);
    }
  };

  // Continue unverified
  const handleContinueUnverified = async () => {
    const selectedUniversity = universities.find((uni) => uni.id === selectedUniId);
    const uniName = customUniName.trim() || selectedUniversity?.name || '';
    if (!uniName) {
      setErrorMessage('Enter your university name or select a registered university first.');
      return;
    }
    if (uniName.length > 160) {
      setErrorMessage('University name must be 160 characters or fewer.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await backend.auth.registerStudent({
        full_name: fullName,
        program_level: programLevel,
        year: parseInt(yearStatus, 10) || 1,
        status: getValidStatus(),
        choice: {
          kind: 'unregistered',
          university_name: uniName,
        },
      });
      setOutcomeState(result.outcome);
      setMatchedUniName(uniName);
      if (result.outcome !== 'unverified') {
        setErrorMessage('The affiliation could not be added as unverified. Please retry or contact support.');
      }
    } catch {
      setErrorMessage('We could not add that university. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Target Skill
  const toggleSkill = (skillName: string) => {
    if (targetSkills.includes(skillName)) {
      setTargetSkills(targetSkills.filter((s) => s !== skillName));
    } else if (targetSkills.length < 3) {
      setTargetSkills([...targetSkills, skillName]);
    }
  };

  // Finish Onboarding
  const handleFinish = async () => {
    if (!user) {
      setErrorMessage('Your sign-in session expired. Please sign in again.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await backend.student.updateProfile(user.id, {
        full_name: fullName.trim(),
        target_skills: targetSkills,
        target_roles: targetRole.trim() ? [targetRole.trim()] : [],
      });
      navigate('/', { replace: true });
    } catch {
      setErrorMessage('Your details could not be saved yet. Please retry before leaving onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUnis = universities.filter((u) =>
    u.name.toLowerCase().includes(uniSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased">
      <Helmet>
        <title>Student Onboarding · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={step === 1 ? 'Return to sign in' : 'Go to previous onboarding step'}
            onClick={() => {
              setErrorMessage(null);
              if (step === 3) setStep(2);
              else if (step === 2) setStep(1);
              else navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-2 text-sm font-medium text-moss hover:text-ink hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{step === 1 ? 'Exit' : 'Back'}</span>
          </button>
          <Logo showPortalBadge={true} />
        </div>
        <span className="text-xs font-semibold text-moss">Step {step} of 3</span>
      </div>

      <div className="w-full max-w-xl mx-auto my-auto py-6">
        {errorMessage && (
          <div role="alert" className="mb-5 rounded-control border border-ember-300 bg-ember-50 px-4 py-3 text-sm text-ember-700">
            {errorMessage}
          </div>
        )}
        {/* STEP 1: ABOUT YOU */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                About you
              </h1>
              <p className="text-moss text-[15px] mt-1.5">
                Tell us about your current academic standing
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5">
              <Field label="Full name" htmlFor="fullName" required>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Program level">
                  <Select
                    value={programLevel}
                    onChange={(e) => setProgramLevel(e.target.value as 'ug' | 'pg')}
                  >
                    <option value="ug">Undergraduate (UG)</option>
                    <option value="pg">Postgraduate (PG / Masters)</option>
                  </Select>
                </Field>

                <Field label="Year or status">
                  <Select
                    value={yearStatus}
                    onChange={(e) => setYearStatus(e.target.value)}
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                    <option value="incoming">Incoming</option>
                    <option value="alumni">Alumni</option>
                    <option value="dropout">Dropout</option>
                  </Select>
                </Field>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
              >
                <span>Continue to university verification</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: YOUR UNIVERSITY */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                Your university
              </h1>
              <p className="text-moss text-[15px] mt-1.5">
                We verify your university status without compromising your privacy
              </p>
            </div>
            {catalogWarning && (
              <div role="status" className="rounded-control border border-hairline bg-mist px-4 py-3 text-sm text-moss">
                The university or skills list could not be loaded. You can still add an unlisted university and continue.
              </div>
            )}

            {/* Case 1: Verified via email domain roster */}
            {outcomeState === 'verified_roster' && (
              <div className="p-6 rounded-panel border border-verdant-300 bg-verdant-50/50 space-y-4">
                <div className="flex items-center gap-2">
                  <StatusChip kind="verified-university" label="Verified university (roster)" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  {copy.university.rosterMatched(matchedUniName)}
                </h3>
                <p className="text-sm text-moss leading-relaxed">
                  Your email matched the enrolled student roster provided by your university.
                  Your affiliation badge is verified.
                </p>
                <Button variant="primary" size="lg" onClick={() => setStep(3)} className="w-full">
                  <span>Continue to target skills</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {outcomeState === 'confirm_existing' && (
              <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
                <div className="flex items-center gap-2">
                  <StatusChip kind="unverified-university" label="Existing affiliation needs confirmation" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ink">We found an existing student record</h3>
                <p className="text-sm text-moss leading-relaxed">
                  Your current profile and scores have not been changed. Finish onboarding now; you can review the university proposal from your Profile page.
                </p>
                <Button variant="primary" size="lg" onClick={() => setStep(3)} className="w-full">
                  <span>Continue to target skills</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Case 2: Verified via student ID */}
            {outcomeState === 'verified_student_id' && (
              <div className="p-6 rounded-panel border border-verdant-300 bg-verdant-50/50 space-y-4">
                <div className="flex items-center gap-2">
                  <StatusChip kind="verified-university" label="Verified (student ID)" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  Student ID verified
                </h3>
                <p className="text-sm text-moss leading-relaxed">
                  Your hashed student ID matched the university roster. No raw ID or photo was
                  stored.
                </p>
                <Button variant="primary" size="lg" onClick={() => setStep(3)} className="w-full">
                  <span>Continue to target skills</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Case 3: Unverified university */}
            {outcomeState === 'unverified' && (
              <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
                <div className="flex items-center gap-2">
                  <StatusChip kind="unverified-university" label="Unverified affiliation" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  University affiliation added
                </h3>
                <p className="text-sm text-moss leading-relaxed">
                  {copy.university.unverifiedNotice}
                </p>
                <Button variant="primary" size="lg" onClick={() => setStep(3)} className="w-full">
                  <span>Continue to target skills</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Case 4: Needs student ID input */}
            {(outcomeState === 'needs_student_id' || outcomeState === 'roster_no_match') && (
              <div className="space-y-4 p-5 rounded-panel border border-hairline bg-mist/40">
                {outcomeState === 'roster_no_match' && (
                  <div className="p-3 rounded-control bg-ember-50 border border-ember-300 text-ember-700 text-xs">
                    {copy.university.rosterNoMatch} You can enter a student ID below or continue
                    unverified.
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-base text-ink">
                    Student ID verification
                  </h3>
                  <p className="text-xs text-moss leading-relaxed">
                    Selected university: <strong>{universities.find((uni) => uni.id === selectedUniId)?.name || 'Registered university'}</strong>.
                    Enter your student ID. We store only a secure hash. Never upload an ID card.
                  </p>
                </div>

                <Field label="Student ID number" htmlFor="studentIdNumber">
                  <Input
                    id="studentIdNumber"
                    autoComplete="off"
                    placeholder="e.g. B-1042"
                    value={studentIdNumber}
                    onChange={(e) => {
                      setStudentIdNumber(e.target.value);
                      setErrorMessage(null);
                    }}
                  />
                </Field>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleVerifyStudentId}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Verify student ID
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleContinueUnverified}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Continue without verifying
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOutcomeState(null);
                    setSelectedUniId('');
                    setStudentIdNumber('');
                    setErrorMessage(null);
                  }}
                  className="text-sm font-medium text-verdant-700 hover:underline"
                >
                  Choose a different university
                </button>
              </div>
            )}

            {/* Default: Manual Picker */}
            {outcomeState === null && (
              <div className="space-y-5">
                <Field label="Search registered universities">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
                    <Input
                      className="pl-10"
                      placeholder="Type your university name…"
                      value={uniSearchQuery}
                      onChange={(e) => setUniSearchQuery(e.target.value)}
                    />
                  </div>
                </Field>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredUnis.map((uni) => (
                    <button
                      key={uni.id}
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSelectedUniId(uni.id);
                        setOutcomeState('needs_student_id');
                      }}
                      className="w-full text-left p-3 rounded-control border border-hairline hover:border-verdant-300 hover:bg-verdant-50/40 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-ink group-hover:text-verdant-800">
                        {uni.name}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-verdant-700 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-hairline">
                  <p className="text-xs text-moss mb-2">My university isn't listed:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter university name"
                      value={customUniName}
                      onChange={(e) => {
                        setCustomUniName(e.target.value);
                        setErrorMessage(null);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleContinueUnverified}
                      disabled={!customUniName.trim() || isLoading}
                      isLoading={isLoading}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: YOUR TARGET */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                Your target skills
              </h1>
              <p className="text-moss text-[15px] mt-1.5">
                Choose up to 3 skills you would like to prove and get hired for
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Target role (optional)" helperText="e.g. Frontend developer, Data Analyst">
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Frontend developer"
                />
              </Field>

              <div>
                <label className="text-[14px] font-medium text-ink mb-2 block">
                  Select target skills ({targetSkills.length}/3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const isSelected = targetSkills.includes(skill.name);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-verdant-700 text-white border-verdant-700 shadow-sm'
                            : 'bg-canvas text-ink border-hairline hover:border-moss'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{skill.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleFinish}
                isLoading={isLoading}
                className="flex-1"
              >
                <span>Complete setup</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleFinish}
                className="text-moss hover:text-ink text-sm"
              >
                Skip for now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OnboardingPage;
