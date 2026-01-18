import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center space-y-6 max-w-lg">
        {/* Error icon with consistent styling */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <AlertCircle className="h-16 w-16 text-primary" aria-hidden="true" />
          </div>
        </div>

        {/* 404 heading */}
        <h1 className="text-7xl font-bold text-primary font-mono">404</h1>

        {/* Error title */}
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>

        {/* Error description */}
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved to a different location.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-150 active:scale-95 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </div>

        {/* Additional help text */}
        <p className="text-xs text-muted-foreground/60 pt-4">
          If you believe this is an error, please contact your system administrator
        </p>
      </div>
    </main>
  );
}
