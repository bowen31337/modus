'use client';

import { logout } from '@/lib/auth-actions';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@modus/ui';
import { CheckCircle2, Home, Inbox, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AgentStatusIndicator } from './agent-status-indicator';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Inbox, label: 'Queue', href: '/dashboard/queue' },
  { icon: CheckCircle2, label: 'Assigned', href: '/dashboard/assigned' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function LeftRail() {
  const pathname = usePathname();

  const handleLogout = async () => {
    // Check if Supabase is configured before attempting logout
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (_error) {
        // If Supabase fails, continue to redirect
      }
    }

    try {
      // Call server action to clear the session cookie
      await logout();
    } catch (error) {
      // Log error but continue with navigation
      console.error('Logout error:', error);
    }

    // Force a hard navigation to login page
    // This ensures the page fully reloads and picks up the cookie changes
    window.location.replace('/login');
  };

  return (
    <aside
      className="w-16 bg-obsidian-900 border-r border-obsidian-700 flex flex-col items-center py-4 gap-2"
      data-testid="left-rail"
    >
      {/* Logo */}
      <div className="mb-2 p-2 bg-obsidian-700 rounded-lg text-obsidian-200 font-bold text-xl">
        m
      </div>

      {/* Agent Status Indicator */}
      <AgentStatusIndicator data-testid="agent-status" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-obsidian-600 text-white shadow-md'
                  : 'text-obsidian-400 hover:bg-obsidian-800 hover:text-obsidian-200 hover:scale-105 active:scale-95'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <item.icon size={20} className="transition-transform duration-200" />
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="w-10 h-10 text-obsidian-400 hover:text-red-400 hover:bg-obsidian-800 transition-all duration-200"
        title="Logout"
        aria-label="Logout from the application"
      >
        <LogOut size={20} className="transition-transform duration-200" />
      </Button>
    </aside>
  );
}
