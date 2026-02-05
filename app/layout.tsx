import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "御坂记账",
  description: "极简风格的 Web 记账应用"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {children}
          <footer className="mt-10 text-center text-xs text-muted-foreground">
            御坂记账 · 作者 RainMoe ·{" "}
            <a
              href="https://github.com/moeharumi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              github
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
