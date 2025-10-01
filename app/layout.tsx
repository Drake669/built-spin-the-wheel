import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Built Customer Service Week",
  description:
    "Simplify  Payments, Track Expenses and manage payroll effortlessly with Built Accounting Software. Try now free for 30 days.",
  openGraph: {
    url: "https://built.africa/",
    title: "Built Financial Technologies",
    description:
      "Simplify payments, streamline invoices, track expenses and ...",
    images: [
      "https://u89an0hx8g.ufs.sh/f/eDg1yHPbEZdzf5RMupXQSneUaXprEHMWRvBTkYuItZclqo8D",
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/circular-std"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="true"
      >
        {children}
      </body>
    </html>
  );
}
