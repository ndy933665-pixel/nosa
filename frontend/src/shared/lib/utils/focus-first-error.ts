/**
 * After a rejected submit: scrolls to the first field marked invalid and focuses it, so the visitor
 * sees what to fix instead of only a toast. Runs after React paints the error state.
 */
export function focusFirstError(root: ParentNode = document) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const field = root.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (!field) return;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      field.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
      field.focus({ preventScroll: true });
    }),
  );
}
