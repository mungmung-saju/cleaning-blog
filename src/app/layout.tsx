import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "청소업체 네이버 블로그 자동 포스팅 생성기",
  description: "레퍼런스 말투 복제 · 네이버 SEO 최적화 · 이미지 배치 가이드까지 한 번에",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
