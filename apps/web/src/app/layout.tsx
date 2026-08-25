import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KobeanAudio — Studio Text-to-Audio Workstation",
  description: "Elite multi-engine text-to-speech studio with Google AI Pro and local M3 acceleration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('kobeanaudio_theme') || 'claude-dark';
                  if (saved === 'system') {
                    var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    saved = isDark ? 'studio-dark' : 'studio-light';
                  }
                  document.documentElement.setAttribute('data-theme', saved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[var(--accent-primary)] selection:text-white bg-[var(--bg-base)] text-[var(--text-main)] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
