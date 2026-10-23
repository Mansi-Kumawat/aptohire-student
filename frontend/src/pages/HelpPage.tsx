import React from 'react';
import { rootUrl } from '@/config/links';
import { env } from '@/config/env';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Share2, Mail, ExternalLink, Scale, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/common/BackButton';

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 antialiased pb-16">
      <Helmet>
        <title>Help & Guidance · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton to="/" label="Back to dashboard" className="mb-2" />
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          Help & guidance
        </h1>
        <p className="text-moss text-[15px] mt-1">
          Everything you need to know about project scoring, verified credentials, and consent
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. How reviews work */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-verdant-700" />
            <h2 className="font-display font-semibold text-lg text-ink">
              How project reviews work
            </h2>
          </div>
          <p className="text-sm text-moss leading-relaxed">
            When you submit a project with your deliverables and mandatory 3-minute demo video, our automated proof engine evaluates your code against strict rubric criteria. Scores are directly linked to timestamps in your video and lines of code in your repository.
          </p>
        </section>

        {/* 2. What Verified means */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-verdant-700" />
            <h2 className="font-display font-semibold text-lg text-ink">
              What "Verified" means
            </h2>
          </div>
          <p className="text-sm text-moss leading-relaxed">
            Skills scoring strictly above 50 points on the rubric become <strong>Verified</strong>. Scores between 40 and 60 are considered borderline and are marked as "Under human review". Borderline scores are confirmed by a human reviewer within 3 working days and are never shared with organizations until confirmed.
          </p>
        </section>

        {/* 3. Appeals */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-moss" />
            <h2 className="font-display font-semibold text-lg text-ink">
              Appealing a score
            </h2>
          </div>
          <p className="text-sm text-moss leading-relaxed">
            If you believe your evidence was misjudged or overlooked, you can raise an appeal ticket directly from any skill scorecard. Your ticket will be reviewed by a different human reviewer who has no knowledge of the initial evaluator.
          </p>
        </section>

        {/* 4. Blind hiring & sharing */}
        <section className="p-6 rounded-panel border border-hairline bg-canvas space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-moss" />
            <h2 className="font-display font-semibold text-lg text-ink">
              Blind hiring and sharing control
            </h2>
          </div>
          <p className="text-sm text-moss leading-relaxed">
            Organizations discover verified talent through anonymized skills. They cannot see your name, photo, or contact information when searching. Identity is only revealed when you explicitly review and accept their access request, and you can withdraw access at any time.
          </p>
        </section>

        {/* 5. Support & Legal Links */}
        <section className="p-6 rounded-panel border border-hairline bg-mesh space-y-4">
          <h2 className="font-display font-semibold text-lg text-ink">Contact & policies</h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-moss">
              Have questions or need assistance with an assessment?
            </p>
            <a href={`mailto:${env.VITE_SUPPORT_EMAIL}`}>
              <Button variant="secondary" size="sm">
                <Mail className="w-4 h-4 mr-1.5" />
                <span>Contact support</span>
              </Button>
            </a>
          </div>

          <div className="pt-4 border-t border-hairline flex flex-wrap gap-4 text-xs">
            <a
              href={rootUrl('/ai-and-fairness')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-verdant-700 hover:text-verdant-800 underline inline-flex items-center gap-1"
            >
              <span>AI & Fairness policy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={rootUrl('/privacy')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-verdant-700 hover:text-verdant-800 underline inline-flex items-center gap-1"
            >
              <span>Privacy policy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={rootUrl('/terms')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-verdant-700 hover:text-verdant-800 underline inline-flex items-center gap-1"
            >
              <span>Terms of service</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
export default HelpPage;
