import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EX Group",
  description: "Book your next beauty appointment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-surface text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
