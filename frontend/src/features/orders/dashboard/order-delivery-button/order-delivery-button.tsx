"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { OrderDeliveryDialog } from "../order-delivery-dialog";
import { useOrderDeliveryButton } from "./order-delivery-button.ux";

type OrderDeliveryButtonProps = Omit<ComponentProps<typeof OrderDeliveryDialog>, "open" | "onOpenChange"> & {
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
};

/** A button that opens the delivery form: "confirm reservation" in the status panel, "edit" on the delivery card. */
export function OrderDeliveryButton({ children, variant, size, className, ...dialog }: OrderDeliveryButtonProps) {
  const button = useOrderDeliveryButton();
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={button.show}>
        {children}
      </Button>
      {button.open && <OrderDeliveryDialog open onOpenChange={button.setOpen} {...dialog} />}
    </>
  );
}
