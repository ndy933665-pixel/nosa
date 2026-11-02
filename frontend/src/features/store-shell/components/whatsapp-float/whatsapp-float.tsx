import { whatsappLink } from "@/shared/lib/whatsapp";

type WhatsappFloatProps = {
  /** The shop's WhatsApp number from settings; nothing renders without it. */
  phone?: string;
  label: string;
  /** Ready-typed first message. */
  message: string;
};

/**
 * Floating chat button: WhatsApp is how every order is confirmed, so it stays in reach on every store page.
 * Only a small round icon stays on screen; its label peeks out once after load and again on hover.
 */
export function WhatsappFloat({ phone, label, message }: WhatsappFloatProps) {
  if (!phone) return null;

  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-4 end-4 z-40 flex size-13 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft transition-[transform,background-color] duration-300 ease-thread hover:bg-whatsapp-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-whatsapp/50 motion-safe:hover:scale-110 sm:bottom-6 sm:end-6"
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-whatsapp motion-safe:animate-whatsapp-ping" aria-hidden />
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-7" aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>
      {/* Small speech bubble beside the button: on hover/focus, and once on its own after load. */}
      <span
        className="pointer-events-none absolute end-full top-1/2 me-3 -translate-y-1/2 scale-90 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-card transition-[opacity,transform] duration-300 ease-thread group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-safe:animate-whatsapp-peek"
        aria-hidden
      >
        {label}
      </span>
    </a>
  );
}
