import type { Metadata } from "next";
import "./globals.css";
import "./investigation.css";
export const metadata: Metadata = {
    title: "디지털 장의사 · MOAKIT",
    description: "네 가지 사건으로 배우는 디지털 개인정보 보호 진로 체험",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="ko">
      <body className="antialiased">{children}</body>
    </html>);
}
