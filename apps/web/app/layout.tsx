import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { ToastContainer } from '@/components/ui/toast-container';
import { AnnouncerListener } from '@/components/ui/screen-reader-announcer';
import '@/lib/init'; // Initialize app and validate env vars

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'm - Community Moderation System',
  description:
    'Lightweight, high-efficiency community moderation platform for agents to discover, manage, and respond to community posts.',
  keywords: ['moderation', 'community', 'management', 'dashboard'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        <ToastProvider>
          {children}
          <ToastContainer />
          <AnnouncerListener />
        </ToastProvider>
      </body>
    </html>
  );
}
