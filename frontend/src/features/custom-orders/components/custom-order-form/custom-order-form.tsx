"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CUSTOM_ORDER_TYPES, type Locale } from "@nosa/contracts";
import { ColorSwatches } from "@/shared/components/color-swatches";
import { DateField, todayValue, type DateFieldLabels } from "@/shared/components/date-field";
import { ImageUploader } from "@/shared/components/image-uploader";
import { TextField } from "@/shared/components/text-field";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import type { CustomOrderDraft } from "../../lib/custom-order-draft";
import { useCustomOrderForm } from "./custom-order-form.ux";

type CustomOrderFormProps = {
  locale: Locale;
  initial: CustomOrderDraft;
  /** Uploads are signed for signed-in customers only. */
  signedIn: boolean;
  labels: Dictionary["store"]["customOrder"];
  dateLabels: DateFieldLabels;
  messages: FeedbackMessages;
};

export function CustomOrderForm({ locale, initial, signedIn, labels, dateLabels, messages }: CustomOrderFormProps) {
  const form = useCustomOrderForm({ locale, initial, messages, errorLabels: labels.errors, invalidMessage: labels.invalid });
  const { draft, set, error } = form;

  if (form.sentNumber) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="size-12 text-primary" aria-hidden />
        <h2 className="font-display text-2xl font-semibold text-primary-800">{labels.successTitle}</h2>
        <p className="text-muted-foreground">{labels.successText}</p>
        <p dir="ltr" className="rounded-full bg-primary-50 px-4 py-1 font-mono text-sm text-primary-800">
          {form.sentNumber}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="xl">
            <Link href={`/${locale}/shop`}>{labels.backToShop}</Link>
          </Button>
          <Button type="button" variant="outline" size="xl" onClick={form.reset}>
            {labels.another}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.submit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card">
        <legend className="sr-only">{labels.contact}</legend>
        <h2 className="font-display text-xl font-semibold text-primary-800">{labels.contact}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={labels.name} required autoComplete="name" value={draft.name} onValueChange={(value) => set("name", value)} error={error("contact.name")} />
          <TextField label={labels.phone} required dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01012345678" value={draft.phone} onValueChange={(value) => set("phone", value)} error={error("contact.phone")} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card">
        <legend className="sr-only">{labels.details}</legend>
        <h2 className="font-display text-xl font-semibold text-primary-800">{labels.details}</h2>
        <Field data-invalid={!!error("type")}>
          <FieldLabel>
            {labels.type}
            <span className="text-destructive"> *</span>
          </FieldLabel>
          <Select value={draft.type} onValueChange={(value) => set("type", value as CustomOrderDraft["type"])}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_ORDER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {labels.types[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={!!error("description")}>
          <FieldLabel htmlFor="custom-description">
            {labels.description}
            <span className="text-destructive"> *</span>
          </FieldLabel>
          <Textarea id="custom-description" rows={5} value={draft.description} onChange={(event) => set("description", event.target.value)} aria-invalid={!!error("description")} />
          {error("description") ? <FieldError>{error("description")}</FieldError> : <FieldDescription>{labels.descriptionHint}</FieldDescription>}
        </Field>
        <Field data-invalid={!!error("colors")}>
          <FieldLabel>{labels.colors}</FieldLabel>
          <ColorSwatches
            label={labels.colors}
            locale={locale}
            selected={draft.colors}
            onToggle={(key) => set("colors", draft.colors.includes(key) ? draft.colors.filter((item) => item !== key) : [...draft.colors, key])}
          />
          <FieldDescription>{labels.colorsHint}</FieldDescription>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={labels.sizes} value={draft.sizes} onValueChange={(value) => set("sizes", value)} error={error("sizes")} />
          <TextField label={labels.budget} dir="ltr" inputMode="numeric" value={draft.budget} onValueChange={(value) => set("budget", value.replace(/[^\d.]/g, ""))} error={error("budget")} />
          <DateField label={labels.neededBy} locale={locale} labels={dateLabels} min={todayValue()} value={draft.neededBy} onValueChange={(value) => set("neededBy", value)} error={error("neededBy")} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card">
        <legend className="sr-only">{labels.images}</legend>
        <h2 className="font-display text-xl font-semibold text-primary-800">{labels.images}</h2>
        {signedIn ? (
          <ImageUploader
            folder="custom-orders"
            value={draft.referenceImages}
            onChange={(images) => set("referenceImages", images)}
            labels={labels.uploader}
            feedback={messages}
            maxFiles={5}
            error={error("referenceImages")}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {labels.imagesLoginHint}{" "}
            <Link href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/custom-order`)}`} className="font-medium text-primary underline">
              {labels.signIn}
            </Link>
          </p>
        )}
      </fieldset>

      <Button type="submit" size="xl" disabled={form.pending} className="self-start">
        {form.pending && <Spinner />}
        {labels.submit}
      </Button>
    </form>
  );
}
