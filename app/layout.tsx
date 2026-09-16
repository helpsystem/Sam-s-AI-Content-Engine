import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Sam's Driving School Content Engine",
  description: 'AI-powered core content engine for multi-platform social media campaigns.',
  openGraph: {
    title: "Sam's Driving School Content Engine",
    description: 'AI-powered core content engine for multi-platform social media campaigns.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sam's Driving School Content Engine",
    description: 'AI-powered core content engine for multi-platform social media campaigns.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

