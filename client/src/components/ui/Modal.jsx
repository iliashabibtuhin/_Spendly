import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Accessible modal built on the native <dialog> element, which provides focus
 * trapping and Escape-to-close. On small screens it docks to the bottom as a sheet.
 */
export function Modal({ open, onClose, title, description, children, size = "md" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const width = size === "sm" ? "sm:max-w-sm" : "sm:max-w-lg";

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={[
        "max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain bg-white p-0 text-ink shadow-pop backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]",
        // Mobile: bottom sheet. sm+: centered card.
        "mx-0 mb-0 mt-auto w-full max-w-none rounded-t-3xl animate-sheet-in",
        `sm:m-auto sm:w-[calc(100%-2rem)] ${width} sm:rounded-2xl sm:animate-dialog-in`,
      ].join(" ")}
    >
      {open && (
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="mx-auto -mt-1 mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 -mt-1 grid size-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
