import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';
import { HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center antialiased">
      <Helmet>
        <title>Page Not Found · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center text-moss mb-6 border border-hairline">
        <HelpCircle className="w-8 h-8 stroke-[1.75]" />
      </div>

      <h1 className="font-display font-bold text-3xl text-ink mb-2">
        That page doesn't exist.
      </h1>
      <p className="text-moss text-[16px] max-w-md mb-8 leading-relaxed">
        The link you followed may be broken or the page may have been moved.
      </p>

      <Link to="/">
        <Button variant="primary" size="lg">
          Go home
        </Button>
      </Link>
    </div>
  );
};
export default NotFoundPage;
