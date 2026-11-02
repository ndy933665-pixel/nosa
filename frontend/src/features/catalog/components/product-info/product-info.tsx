import { Heart, Info } from "lucide-react";
import type { Locale, ProductDto } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";

type ProductInfoProps = {
  product: ProductDto;
  locale: Locale;
  labels: Dictionary["store"]["product"];
};

/** Paragraphs from the plain text the owner typed (a blank line starts a new one). */
const paragraphs = (text: string | undefined) => (text ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

/** "Details / Care" accordion (delivery is agreed on WhatsApp, so it has no section here) plus the handmade note and the set contents. */
export function ProductInfo({ product, locale, labels }: ProductInfoProps) {
  const care = paragraphs(product.careInstructions?.[locale]);
  const sections = [
    { value: "details", icon: Info, title: labels.details, body: paragraphs(product.description[locale]) },
    ...(care.length ? [{ value: "care", icon: Heart, title: labels.care, body: care }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {product.setItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{labels.setIncludes}:</span>
          {product.setItems.map((item, index) => (
            <span key={index} className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {item[locale]}
            </span>
          ))}
        </div>
      )}

      <p className="stitch rounded-2xl border bg-secondary/60 p-4 text-sm text-primary-800">
        {labels.handmadeIn}
        {product.productionDays > 0 && <> · {labels.readyIn.replace("{days}", String(product.productionDays))}</>}
      </p>

      <Accordion type="single" collapsible defaultValue="details">
        {sections.map(({ value, icon: Icon, title, body }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="gap-3 py-4 text-base">
              <span className="flex items-center gap-3">
                <Icon className="size-4 text-primary-600" aria-hidden />
                {title}
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 text-muted-foreground">
              {body.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
