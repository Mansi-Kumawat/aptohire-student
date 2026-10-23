import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submissionFormSchema, SubmissionFormInput } from '@/lib/schemas';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { SkillItem, SubmissionDocument, PublicConfig } from '@/lib/domain/types';
import { validateMagicBytes, validateVideoFile } from '@/lib/files';
import { getVideoDuration } from '@/lib/media';
import { formatBytes, formatSeconds } from '@/lib/format';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { BackButton } from '@/components/common/BackButton';
import { Helmet } from 'react-helmet-async';
import {
  Upload,
  Video,
  FileText,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { copy, mapErrorCodeToCopy } from '@/content/copy';

export const SubmissionPage: React.FC = () => {
  const { id: submissionIdParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignment');
  const isOwnProject = searchParams.get('own') === '1';

  const backend = useBackend();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [skillsTaxonomy, setSkillsTaxonomy] = useState<SkillItem[]>([]);
  const [submissionId, setSubmissionId] = useState<string>(submissionIdParam || '');
  const [documents, setDocuments] = useState<SubmissionDocument[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null);
  const [documentErrorMessage, setDocumentErrorMessage] = useState<string | null>(null);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<string>('');
  const [isResumedDraft, setIsResumedDraft] = useState(false);

  // Originality questions from brief
  const [originalityQuestions, setOriginalityQuestions] = useState<string[]>([
    'How did you structure the core logic of this project?',
    'What was the most challenging technical tradeoff you made?',
  ]);

  // Confirm dialog state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAiAccurate, setConfirmAiAccurate] = useState(false);
  const [confirmReviewTerms, setConfirmReviewTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubmissionFormInput>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      skills_claimed: [],
      live_url: '',
      github_url: '',
      video_url: '',
      video_source: 'none',
      originality_responses: [],
      ai_used: false,
      ai_tools: [],
      ai_notes: '',
    },
  });

  const formValues = watch();

  // Load config & taxonomy
  useEffect(() => {
    backend.config.getPublicConfig().then(setConfig);
    backend.skills.listSkills().then(setSkillsTaxonomy);
  }, [backend]);

  // Load assignment if starting from brief
  useEffect(() => {
    if (assignmentIdParam) {
      backend.projects.getAssignment(assignmentIdParam).then((asg) => {
        if (asg) {
          setValue('title', asg.brief.title);
          setValue('skills_claimed', asg.brief.target_skills);
          setOriginalityQuestions(asg.brief.originality_questions);
          setValue(
            'originality_responses',
            asg.brief.originality_questions.map((q) => ({
              question: q,
              answer: '',
              answered_in_video: false,
            }))
          );
        }
      });
    }
  }, [assignmentIdParam, backend, setValue]);

  // Load existing submission if editing
  useEffect(() => {
    if (submissionIdParam) {
      backend.submissions.getSubmission(submissionIdParam).then((sub) => {
        if (sub) {
          setSubmissionId(sub.id);
          setValue('title', sub.title);
          setValue('description', sub.description);
          setValue('skills_claimed', sub.skills_claimed);
          setValue('live_url', sub.live_url || '');
          setValue('github_url', sub.github_url || '');
          setValue('video_url', sub.video_url || '');
          setValue('video_source', sub.video_source);
          setValue(
            'originality_responses',
            (sub.originality_responses || []).map((r) => ({
              question: r.question,
              answer: r.answer,
              answered_in_video: !!r.answered_in_video,
            }))
          );
          setValue('ai_used', sub.ai_used);
          setValue('ai_tools', sub.ai_tools);
          setValue('ai_notes', sub.ai_notes);
          setDocuments(sub.documents || []);
          if (sub.video_url) {
            setVideoPreviewUrl(sub.video_url);
            setVideoDuration(sub.video_duration_seconds || null);
          }
          setIsResumedDraft(true);
        }
      });
    }
  }, [submissionIdParam, backend, setValue]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Debounced Autosave (1.5s)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performAutosave = useCallback(async () => {
    if (!user || !formValues.title || formValues.title.trim().length < 2) return;

    try {
      setAutosaveStatus('Saving draft…');
      const saved = await backend.submissions.saveDraft({
        id: submissionId || undefined,
        student_id: user.id,
        assignment_id: assignmentIdParam || null,
        title: formValues.title,
        description: formValues.description,
        skills_claimed: formValues.skills_claimed,
        live_url: formValues.live_url || null,
        github_url: formValues.github_url || null,
        video_url: formValues.video_url || null,
        video_duration_seconds: videoDuration || undefined,
        video_size_bytes: videoFile?.size,
        video_source: formValues.video_source,
        documents,
        originality_responses: formValues.originality_responses,
        ai_used: formValues.ai_used,
        ai_tools: formValues.ai_tools,
        ai_notes: formValues.ai_notes,
      });

      if (!submissionId) {
        setSubmissionId(saved.id);
      }
      setAutosaveStatus('Saved just now');
    } catch {
      setAutosaveStatus('Failed to save draft');
    }
  }, [user, formValues, submissionId, assignmentIdParam, videoDuration, videoFile, documents, backend]);

  useEffect(() => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave();
    }, 1500);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [formValues.title, formValues.description, formValues.live_url, formValues.github_url, documents, performAutosave]);

  // Video Selection & Validation
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = config?.video_max_mb || 50;
    const maxSec = config?.video_max_seconds || 190;

    // 1. Initial size & type check
    const basicCheck = validateVideoFile(file, maxMb, maxSec);
    if (!basicCheck.valid) {
      setVideoErrorMessage(basicCheck.error || 'Invalid video file');
      return;
    }

    // 2. Duration check via loadedmetadata
    try {
      const duration = await getVideoDuration(file);
      const durationCheck = validateVideoFile(file, maxMb, maxSec, duration);
      if (!durationCheck.valid) {
        setVideoErrorMessage(durationCheck.error || 'Video exceeds length limit');
        return;
      }

      setVideoFile(file);
      setVideoDuration(duration);
      const objUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objUrl);
      setValue('video_source', 'upload');

      // 3. Resumable upload (TUS)
      setVideoUploadProgress(10);
      const subId = submissionId || `sub-${Date.now()}`;
      setSubmissionId(subId);

      const uploaded = await backend.uploads.uploadVideoTus(file, subId, (percent) => {
        setVideoUploadProgress(percent);
      });

      setValue('video_url', uploaded.url);
      setVideoUploadProgress(null);
      toast.success('Video uploaded successfully.');
    } catch (err: unknown) {
      console.error(err);
      setVideoErrorMessage('Failed to read video metadata or upload.');
      setVideoUploadProgress(null);
    }
  };

  // Document Selection & Validation
  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (documents.length + files.length > 5) {
      setDocumentErrorMessage('You can upload a maximum of 5 documents.');
      return;
    }

    const subId = submissionId || `sub-${Date.now()}`;
    setSubmissionId(subId);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const check = await validateMagicBytes(file);
      if (!check.valid) {
        setDocumentErrorMessage(check.error || 'Invalid document file signature.');
        return;
      }

      try {
        const doc = await backend.uploads.uploadDocument(file, subId);
        setDocuments((prev) => [...prev, doc]);
      } catch {
        setDocumentErrorMessage(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Skill claiming toggles
  const toggleSkillClaim = (skillName: string) => {
    const current = formValues.skills_claimed || [];
    if (current.includes(skillName)) {
      setValue('skills_claimed', current.filter((s) => s !== skillName));
    } else {
      setValue('skills_claimed', [...current, skillName]);
    }
  };

  // AI tools toggle
  const toggleAiTool = (tool: string) => {
    const current = formValues.ai_tools || [];
    if (current.includes(tool)) {
      setValue('ai_tools', current.filter((t) => t !== tool));
    } else {
      setValue('ai_tools', [...current, tool]);
    }
  };

  // Validation before opening confirm dialog
  const handleValidateAndOpenConfirm = (data: SubmissionFormInput) => {
    const requireVideo = config ? config.require_video : true;
    if (requireVideo && !data.video_url && data.video_source === 'none') {
      setVideoErrorMessage(copy.errors.VIDEO_REQUIRED);
      return;
    }

    setShowConfirmModal(true);
  };

  // Final Submit
  const handleConfirmSubmit = async () => {
    if (!user || !submissionId) return;
    setIsSubmitting(true);

    try {
      // 1. Ensure current draft is saved
      await backend.submissions.saveDraft({
        id: submissionId,
        student_id: user.id,
        assignment_id: assignmentIdParam || null,
        title: formValues.title,
        description: formValues.description,
        skills_claimed: formValues.skills_claimed,
        live_url: formValues.live_url || null,
        github_url: formValues.github_url || null,
        video_url: formValues.video_url || null,
        video_duration_seconds: videoDuration || undefined,
        video_size_bytes: videoFile?.size,
        video_source: formValues.video_source,
        documents,
        originality_responses: formValues.originality_responses,
        ai_used: formValues.ai_used,
        ai_tools: formValues.ai_tools,
        ai_notes: formValues.ai_notes,
      });

      // 2. Submit project
      await backend.submissions.submitProject({
        submission_id: submissionId,
        confirm: true,
      });

      setShowConfirmModal(false);
      toast.success('Project submitted. We\'re reviewing it now.');
      navigate(`/submissions/${submissionId}`, { replace: true });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const code = (err as { code?: string })?.code || 'UNKNOWN';
      toast.error(mapErrorCodeToCopy(code));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 antialiased pb-16">
      <Helmet>
        <title>Submit Project · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton
          to={assignmentIdParam ? `/projects/${assignmentIdParam}` : '/projects'}
          label={assignmentIdParam ? 'Back to project brief' : 'Back to projects'}
          className="mb-3"
        />
      </div>

      {/* Header & Autosave Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            {isOwnProject ? 'Upload my own project' : 'Submit project'}
          </h1>
          <p className="text-moss text-[15px] mt-0.5">
            Submit your deliverables, code repositories, and demo video for rubric scoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          {autosaveStatus && (
            <span
              className="text-xs font-mono text-moss bg-mist px-2.5 py-1 rounded-control border border-hairline"
              aria-live="polite"
            >
              {autosaveStatus}
            </span>
          )}
          {isResumedDraft && (
            <span className="text-xs font-semibold text-verdant-700 bg-verdant-50 px-2 py-0.5 rounded-full border border-verdant-100">
              Draft resumed
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleValidateAndOpenConfirm)} className="space-y-8" noValidate>
        {/* 1. PROJECT SECTION */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-5">
          <h2 className="font-display font-semibold text-lg text-ink">Project overview</h2>

          <Field label="Project title" htmlFor="title" error={errors.title?.message} required>
            <Input
              id="title"
              placeholder="e.g. Accessible Filterable Product Catalog"
              error={!!errors.title}
              {...register('title')}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            helperText="Summarize what you built, architecture choices, and how it meets the goals (≤ 2,000 characters)."
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={4}
              placeholder="Explain what the project accomplishes, key features, and performance considerations…"
              error={!!errors.description}
              {...register('description')}
            />
          </Field>

          <div>
            <label className="text-[14px] font-medium text-ink mb-1.5 block">
              Skills claimed <span className="text-danger-600">*</span>
            </label>
            <p className="text-xs text-moss mb-3">
              Choose the primary skills demonstrated by this project
            </p>
            <div className="flex flex-wrap gap-2">
              {skillsTaxonomy.map((skill) => {
                const isChecked = (formValues.skills_claimed || []).includes(skill.name);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkillClaim(skill.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isChecked
                        ? 'bg-verdant-700 text-white border-verdant-700'
                        : 'bg-canvas text-ink border-hairline hover:border-moss'
                    }`}
                  >
                    {isChecked && '✓ '}
                    {skill.name}
                  </button>
                );
              })}
            </div>
            {errors.skills_claimed && (
              <p className="text-xs text-danger-600 mt-2">{errors.skills_claimed.message}</p>
            )}
          </div>
        </section>

        {/* 2. DEMO VIDEO SECTION */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <Video className="w-5 h-5 text-verdant-700" />
              <span>Mandatory 3-minute demo video</span>
            </h2>
            <span className="text-xs font-medium text-moss">Max 3:10 duration · ≤ 50 MB</span>
          </div>

          <p className="text-xs text-moss leading-relaxed">
            Walk through your code and live application. Video must be 3:10 or shorter.
          </p>

          {videoErrorMessage && (
            <div className="p-3.5 rounded-control bg-danger-50 border border-danger-600/30 text-danger-600 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{videoErrorMessage}</span>
            </div>
          )}

          {/* Video Dropzone */}
          <div className="border-2 border-dashed border-hairline rounded-panel p-6 text-center hover:border-verdant-600 transition-colors bg-mist/30">
            {videoPreviewUrl ? (
              <div className="space-y-3">
                <div className="aspect-video max-w-md mx-auto rounded-control bg-ink/90 overflow-hidden relative">
                  <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs font-mono text-moss">
                  {videoDuration && <span>Duration: {formatSeconds(videoDuration)}</span>}
                  {videoFile && <span>Size: {formatBytes(videoFile.size)}</span>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                    setVideoDuration(null);
                    setValue('video_url', '');
                    setValue('video_source', 'none');
                  }}
                  className="text-xs text-danger-600"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Remove video</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-moss mx-auto opacity-70" />
                <div>
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <span className="font-semibold text-verdant-700 hover:text-verdant-800 text-sm underline underline-offset-2">
                      Upload your demo video
                    </span>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="sr-only"
                      onChange={handleVideoSelect}
                    />
                  </label>
                  <p className="text-xs text-moss mt-1">MP4, WebM, or MOV up to 50 MB</p>
                </div>
              </div>
            )}

            {videoUploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto space-y-1">
                <div className="w-full h-2 rounded-full bg-hairline overflow-hidden">
                  <div
                    className="h-full bg-verdant-600 transition-all duration-fast"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-moss font-mono">Uploading… {videoUploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Fallback Video Link */}
          <div className="pt-2">
            <Field
              label="Can't upload? Add an unlisted video link instead"
              helperText="Accepts Loom, YouTube unlisted, or Google Drive share link."
            >
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={formValues.video_url || ''}
                onChange={(e) => {
                  setValue('video_url', e.target.value);
                  if (e.target.value) setValue('video_source', 'link');
                }}
              />
            </Field>
          </div>
        </section>

        {/* 3. DOCUMENTS SECTION */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink">Project documents</h2>
            <span className="text-xs text-moss font-mono">
              {documents.length} / 5 files (≤ 20 MB each)
            </span>
          </div>

          {documentErrorMessage && (
            <div className="p-3.5 rounded-control bg-danger-50 border border-danger-600/30 text-danger-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{documentErrorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label htmlFor="doc-upload" className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-mist text-ink border border-hairline hover:bg-hairline text-xs font-semibold">
                <Upload className="w-3.5 h-3.5" />
                <span>Add documents</span>
              </span>
              <input
                id="doc-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.md,.zip"
                className="sr-only"
                onChange={handleDocumentSelect}
              />
            </label>
            <span className="text-xs text-moss">Allowed: .pdf, .docx, .md, .zip</span>
          </div>

          {documents.length > 0 && (
            <div className="divide-y divide-hairline border border-hairline rounded-panel mt-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-moss" />
                    <span className="font-medium text-ink">{doc.name}</span>
                    <span className="text-moss font-mono">({formatBytes(doc.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-1 rounded text-moss hover:text-danger-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. LINKS SECTION */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
          <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-moss" />
            <span>Repository & live links</span>
          </h2>

          <Field
            label="GitHub repository URL"
            htmlFor="github_url"
            helperText="e.g. https://github.com/your-username/your-repo"
            error={errors.github_url?.message}
          >
            <Input
              id="github_url"
              placeholder="https://github.com/owner/repo"
              error={!!errors.github_url}
              {...register('github_url')}
            />
          </Field>

          <Field
            label="Live project URL"
            htmlFor="live_url"
            helperText="e.g. https://my-project.vercel.app"
            error={errors.live_url?.message}
          >
            <Input
              id="live_url"
              placeholder="https://my-project.example.com"
              error={!!errors.live_url}
              {...register('live_url')}
            />
          </Field>
        </section>

        {/* 5. ORIGINALITY QUESTIONS SECTION */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-moss" />
            <h2 className="font-display font-semibold text-lg text-ink">Originality questions</h2>
          </div>
          <p className="text-xs text-moss leading-relaxed">
            Explain the decisions you made or check the box if you demonstrated these in your demo video.
          </p>

          <div className="space-y-4">
            {originalityQuestions.map((question, idx) => {
              const currentResp = formValues.originality_responses?.[idx] || {
                question,
                answer: '',
                answered_in_video: false,
              };

              return (
                <div key={idx} className="p-4 rounded-control border border-hairline bg-mist/30 space-y-2">
                  <p className="text-sm font-semibold text-ink">
                    {idx + 1}. {question}
                  </p>

                  <Checkbox
                    checked={currentResp.answered_in_video}
                    onChange={(e) => {
                      const updated = [...(formValues.originality_responses || [])];
                      updated[idx] = {
                        question,
                        answer: currentResp.answer,
                        answered_in_video: (e.target as HTMLInputElement).checked,
                      };
                      setValue('originality_responses', updated);
                    }}
                    label="I answered this in my demo video"
                  />

                  {!currentResp.answered_in_video && (
                    <Textarea
                      rows={2}
                      placeholder="Write your explanation here (≤ 600 characters)…"
                      value={currentResp.answer}
                      onChange={(e) => {
                        const updated = [...(formValues.originality_responses || [])];
                        updated[idx] = {
                          question,
                          answer: e.target.value,
                          answered_in_video: false,
                        };
                        setValue('originality_responses', updated);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. AI USE DISCLOSURE */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-moss" />
            <h2 className="font-display font-semibold text-lg text-ink">AI-use disclosure</h2>
          </div>

          <p className="text-xs text-moss leading-relaxed">
            Telling us doesn't lower your score. We review what you built and whether you understand it.
          </p>

          <Checkbox
            checked={formValues.ai_used}
            onChange={(e) => setValue('ai_used', (e.target as HTMLInputElement).checked)}
            label="I used AI tools while building this project"
          />

          {formValues.ai_used && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-ink mb-2 block">
                  Which tools did you use?
                </label>
                <div className="flex flex-wrap gap-2">
                  {['ChatGPT', 'Claude', 'GitHub Copilot', 'Gemini', 'Cursor', 'Other'].map(
                    (tool) => {
                      const isSelected = (formValues.ai_tools || []).includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => toggleAiTool(tool)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            isSelected
                              ? 'bg-ink text-white border-ink'
                              : 'bg-canvas text-ink border-hairline'
                          }`}
                        >
                          {tool}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <Field
                label="How did you use them? (≤ 300 characters)"
                helperText="e.g. Scaffolding unit tests, explaining regex syntax, debugging layout errors"
              >
                <Textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Notes on AI assistance…"
                  {...register('ai_notes')}
                />
              </Field>
            </div>
          )}
        </section>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-moss">
            Drafts are saved automatically and preserved for 30 days.
          </p>

          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
            <span>Submit project</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm project submission</DialogTitle>
            <DialogDescription>
              Please confirm the following declarations before submitting for review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Checkbox
              checked={confirmAiAccurate}
              onChange={(e) => setConfirmAiAccurate((e.target as HTMLInputElement).checked)}
              label="I've told you accurately how I used AI tools"
            />
            <Checkbox
              checked={confirmReviewTerms}
              onChange={(e) => setConfirmReviewTerms((e.target as HTMLInputElement).checked)}
              label="I agree to my project being reviewed by AI and by a human reviewer if needed."
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              disabled={!confirmAiAccurate || !confirmReviewTerms}
              isLoading={isSubmitting}
            >
              Confirm and submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SubmissionPage;
