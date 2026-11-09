import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitchly — Live Vocal Tuner',
  description: 'Pitchly: Real-time vocal tuner powered by Web Audio API and YIN DSP pitch detection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#101216] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
