import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { getLocale } from "@/shared/i18n/get-dictionary";
import { getPage } from "../../api/cms.queries";

/** An info page written in the dashboard. The HTML is sanitised by Express, so it is safe to render as is. */
export async function PageView({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeader title={page.title[locale]} />
      <div
        className="flex flex-col gap-4 text-lg leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-primary-800 [&_h2:not(:first-child)]:mt-4 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-primary-700 [&_strong]:text-foreground [&_blockquote]:rounded-2xl [&_blockquote]:border-s-4 [&_blockquote]:border-primary-300 [&_blockquote]:bg-blush [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-primary-800 [&_li]:ms-5 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: page.body[locale] }}
      />
    </article>
  );
}
