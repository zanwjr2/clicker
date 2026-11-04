import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERA BOUND — 돌에서 별까지",
  description: "원시 시대부터 우주 개척까지 14챕터 140개 미션의 이야기를 즐기는 한국어 클릭 RPG. 레벨별 스태미너 최대치 성장과 상점 회복·효율 강화, 기술 연구, 서버 저장.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
