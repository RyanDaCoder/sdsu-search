"use client";

import { useEffect, useRef } from "react";

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const shortcuts = [
  { key: "/", description: "Focus keyword search field" },
  { key: "Esc", description: "Close modals and drawers" },
  { key: "?", description: "Show keyboard shortcuts" },
];

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Handle Esc key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      // Trap focus within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Restore focus when modal closes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-lg shadow-2xl m-4 border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E5E5] p-5 flex items-start justify-between z-10">
          <div>
            <h2 id="shortcuts-title" className="text-xl font-semibold text-[#2C2C2C]">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-[#525252] mt-1.5">
              Use these shortcuts to navigate faster
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-2xl leading-none text-[#737373] hover:text-[#2C2C2C] transition-colors p-1 touch-manipulation"
            aria-label="Close keyboard shortcuts"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="space-y-3">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#E5E5E5] last:border-b-0"
              >
                <span className="text-sm text-[#404040]">{shortcut.description}</span>
                <kbd className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-[#F0F0F0] border border-[#D4D4D4] text-xs font-medium text-[#2C2C2C] font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] p-4">
          <button
            onClick={onClose}
            className="w-full rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors touch-manipulation"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

