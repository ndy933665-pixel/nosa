"use client";

import { Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import type { AddCartItemInput, Locale } from "@nosa/contracts";
import { DateField, type DateFieldLabels } from "@/shared/components/date-field";
import { Price } from "@/shared/components/price";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import type { ActionState } from "@/shared/lib/action-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import type { PurchaseModel } from "../../lib/product-selection";
import { useProductPurchase } from "./product-purchase.ux";

type ProductPurchaseProps = {
  product: PurchaseModel;
  locale: Locale;
  labels: Dictionary["store"]["product"];
  dateLabels: DateFieldLabels;
  /** Toast texts for the add-to-cart result. */
  messages: { added: string; failed: string; chooseOptions: string; fillFields: string };
  /** Server action owned by the cart feature, passed in by the route. */
  addToCart: (input: AddCartItemInput) => Promise<ActionState>;
  /** Where "Buy now" goes after the piece is in the cart. */
  checkoutHref: string;
};

const chip = "rounded-full border px-4 py-1.5 text-sm transition-colors disabled:line-through";

/** Size and color pickers, customisation fields, quantity and the two buttons. */
export function ProductPurchase({ product, locale, labels, dateLabels, messages, addToCart, checkoutHref }: ProductPurchaseProps) {
  const purchase = useProductPurchase({ product, addToCart, messages });
  const total = purchase.price + purchase.surcharge;
  // Nothing is sold out until a size/color is chosen; before that the button asks her to choose.
  const soldOut = purchase.complete && !purchase.purchasable;
  const onSale = product.salePrice !== undefined && purchase.price === product.salePrice;

  return (
    <div className="flex flex-col gap-5">
      <Price amount={total} compareAt={onSale ? product.price + purchase.surcharge : undefined} locale={locale} size="lg" />

      {product.options.map((option) => (
        <fieldset key={option.key} className="flex flex-col gap-2">
          <legend className={cn("mb-1 text-sm font-medium transition-colors", purchase.optionMissing(option.key) && "text-destructive")}>{option.name[locale]}</legend>
          <div
            tabIndex={purchase.optionMissing(option.key) ? -1 : undefined}
            aria-invalid={purchase.optionMissing(option.key) || undefined}
            className={cn("-m-1.5 flex flex-wrap gap-2 rounded-2xl p-1.5 outline-none ring-2 ring-transparent transition-colors", purchase.optionMissing(option.key) && "bg-destructive/5 ring-destructive/40")}
          >
            {option.values.map((value) => {
              const selected = purchase.selection[option.key] === value.value;
              const available = purchase.isAvailable(option.key, value.value);
              return option.key === "color" ? (
                <button
                  key={value.value}
                  type="button"
                  title={value.label[locale]}
                  aria-label={value.label[locale]}
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => purchase.select(option.key, value.value)}
                  className={cn("size-9 rounded-full border-2 border-transparent ring-1 ring-black/10 transition-transform enabled:hover:scale-110 disabled:opacity-40", selected && "border-primary-600 ring-2 ring-primary-300")}
                  // The swatch color is data chosen in the dashboard.
                  style={{ backgroundColor: value.hex ?? "transparent" }}
                />
              ) : (
                <button
                  key={value.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => purchase.select(option.key, value.value)}
                  className={cn(chip, selected ? "border-primary-600 bg-primary-600 text-primary-foreground" : "bg-card enabled:hover:border-primary-300", !available && "opacity-50")}
                >
                  {value.label[locale]}
                </button>
              );
            })}
          </div>
          {purchase.optionMissing(option.key) && <p className="text-sm text-destructive">{labels.pickOption.replace("{name}", option.name[locale])}</p>}
        </fieldset>
      ))}

      {product.customization.enabled && product.customization.fields.length > 0 && (
        <div className="stitch flex flex-col gap-4 rounded-2xl border bg-secondary/60 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-primary-800">
              <Sparkles className="size-4 text-primary-600" aria-hidden />
              {labels.customizeTitle}
            </h3>
            <p className="text-sm text-muted-foreground">{labels.customizeHint}</p>
          </div>
          {product.customization.fields.map((field) =>
            field.type === "date" ? (
              <DateField
                key={field.key}
                label={field.label[locale]}
                required={field.required}
                locale={locale}
                labels={dateLabels}
                value={purchase.custom[field.key] ?? ""}
                onValueChange={(value) => purchase.setCustom(field.key, value)}
                error={purchase.fieldMissing(field.key, field.required) ? labels.fillFields : undefined}
              />
            ) : (
            <Field key={field.key} data-invalid={purchase.fieldMissing(field.key, field.required) || undefined}>
              <FieldLabel htmlFor={`custom-${field.key}`}>
                {field.label[locale]}
                {field.required && <span className="text-destructive"> *</span>}
              </FieldLabel>
              <Input
                id={`custom-${field.key}`}
                maxLength={field.maxLength}
                value={purchase.custom[field.key] ?? ""}
                aria-invalid={purchase.fieldMissing(field.key, field.required) || undefined}
                onChange={(event) => purchase.setCustom(field.key, event.target.value)}
                className="bg-card"
              />
              {field.maxLength && (
                <span className="self-end text-xs tabular-nums text-muted-foreground" aria-live="polite">
                  {(purchase.custom[field.key] ?? "").length}/{field.maxLength}
                </span>
              )}
            </Field>
            ),
          )}
          {product.customization.extraPrice > 0 && (
            <p className="text-sm text-muted-foreground">
              {labels.customizeExtra} <Price amount={product.customization.extraPrice} locale={locale} size="sm" />
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border bg-card" role="group" aria-label={labels.quantity}>
          <Button type="button" variant="ghost" size="icon" onClick={() => purchase.setQuantity(purchase.quantity - 1)} disabled={purchase.quantity <= 1} aria-label="−">
            <Minus />
          </Button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">{purchase.quantity}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => purchase.setQuantity(purchase.quantity + 1)} disabled={purchase.quantity >= purchase.max} aria-label="+">
            <Plus />
          </Button>
        </div>
        {soldOut && <span className="text-sm font-medium text-yarn-500">{labels.outOfStock}</span>}
        {!soldOut && purchase.variant?.isMadeToOrder && <span className="text-sm text-muted-foreground">{labels.madeToOrder}</span>}
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" size="xl" className="w-full" disabled={soldOut || purchase.pending} onClick={() => void purchase.submit()}>
          {purchase.pending ? <Spinner /> : <ShoppingBag />}
          {labels.addToCart}
        </Button>
        <Button
          type="button"
          size="xl"
          variant="outline"
          className="w-full"
          disabled={soldOut || purchase.pending}
          onClick={async () => {
            if (await purchase.submit()) window.location.assign(checkoutHref);
          }}
        >
          {labels.buyNow}
        </Button>
      </div>
    </div>
  );
}
