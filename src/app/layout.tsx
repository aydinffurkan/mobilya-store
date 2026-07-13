import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const defaultTitle = "Messa Home – Kaliteli Mobilya";
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

async function getFaviconUrl(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "favicon").single();
    return (data?.value as { url?: string } | null)?.url ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [seo, faviconUrl] = await Promise.all([getSeoSettings(), getFaviconUrl()]);

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
    icons: {
      icon: faviconUrl ? [{ url: faviconUrl, type: 'image/png' }] : '/icon.png',
      apple: faviconUrl ?? '/icon.png',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
