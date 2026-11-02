import { Globe, MapPin, Package, Truck } from "lucide-react";
import type { Locale, OrderDto } from "@nosa/contracts";
import { CopyButton } from "@/shared/components/copy-button";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { addressLine } from "../../lib/address-line";

type DeliveryDetailsProps = {
  address: OrderDto["address"];
  shipment: OrderDto["shipment"];
  locale: Locale;
  labels: Dictionary["common"]["delivery"];
};

const rowClass = "flex items-start gap-2";
const iconClass = "mt-0.5 size-4 shrink-0 text-primary-600";

/** Where a confirmed order goes, plus the shipping company and tracking number when they were filled in. */
export function DeliveryDetails({ address, shipment, locale, labels }: DeliveryDetailsProps) {
  const line = addressLine(address, locale);
  const ScopeIcon = shipment?.scope === "international" ? Globe : MapPin;

  return (
    <dl className="flex flex-col gap-3 text-sm">
      {shipment && (
        <div className={rowClass}>
          <ScopeIcon className={iconClass} aria-hidden />
          <div>
            <dt className="sr-only">{labels.scope}</dt>
            <dd className="font-medium">{labels.scopes[shipment.scope]}</dd>
          </div>
        </div>
      )}
      {line && (
        <div className={rowClass}>
          <MapPin className={iconClass} aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">{labels.address}</dt>
            <dd>{line}</dd>
          </div>
        </div>
      )}
      {shipment?.carrier && (
        <div className={rowClass}>
          <Truck className={iconClass} aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">{labels.carrier}</dt>
            <dd className="font-medium">{shipment.carrier}</dd>
          </div>
        </div>
      )}
      {shipment?.trackingNumber && (
        <div className={rowClass}>
          <Package className={iconClass} aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{labels.trackingNumber}</dt>
            <dd className="flex items-center gap-1">
              <span dir="ltr" className="font-mono font-medium break-all select-all">
                {shipment.trackingNumber}
              </span>
              <CopyButton value={shipment.trackingNumber} labels={labels} />
            </dd>
          </div>
        </div>
      )}
    </dl>
  );
}
