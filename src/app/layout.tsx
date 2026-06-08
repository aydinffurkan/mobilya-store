import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const defaultTitle = "Mobilya Store – Kaliteli Mobilya";
const defaultDescription = "Türkiye'nin en güzel mobilyaları uygun fiyatlarla. Yatak odası, yemek odası, oturma grubu ve daha fazlası.";

async function getSeoSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "seo").single();
    return data?.value ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  return {
    title: seo.site_title || defaultTitle,
    description: seo.meta_description || defaultDescription,
    keywords: seo.keywords
      ? seo.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : undefined,
    openGraph: seo.og_image
      ? { images: [{ url: seo.og_image, width: 1200, height: 630 }] }
      : undefined,
    verification: seo.google_site_verification
      ? { google: seo.google_site_verification }
      : undefined,
    robots: seo.robots_index === false
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
