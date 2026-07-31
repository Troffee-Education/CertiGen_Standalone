import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CertiGen - Certificate Generator',
  description: 'Create, distribute, and track certificate events.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
