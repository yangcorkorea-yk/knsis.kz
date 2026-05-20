import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-warm p-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-deep">{t("kicker")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-display text-ink">{t("title")}</h1>
        <p className="mt-4 text-sm text-ink-body">{t("subtitle")}</p>
      </div>
    </main>
  );
}
