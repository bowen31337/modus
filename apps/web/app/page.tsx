import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          m<span className="text-primary">.</span>
        </h1>
        <p className="text-lg text-foreground-secondary max-w-md">Community Moderation System</p>
        <p className="text-sm text-foreground-muted max-w-lg">
          A lightweight, high-efficiency platform for agents to discover, manage, and respond to
          community posts with intelligent prioritization and AI-assisted drafting.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-background-secondary text-foreground rounded-md border border-border hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
