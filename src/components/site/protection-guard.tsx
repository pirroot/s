"use client";

import { useEffect } from "react";

/**
 * Site-wide anti-download guards:
 * - context menu suppressed on any protected media (canvas containers)
 * - drag-start suppressed on protected media
 * - Ctrl/Cmd+S (save page) suppressed globally
 *
 * Combined with the /api/media route (same-origin gate + burned-in
 * watermark + no direct file URLs) this is the "strict" protection tier.
 * Screenshots can never be blocked by any website — the PDF catalogue is
 * the sanctioned download channel.
 */
export function ProtectionGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-protected]")) {
        e.preventDefault();
      }
    };
    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-protected]")) {
        e.preventDefault();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
