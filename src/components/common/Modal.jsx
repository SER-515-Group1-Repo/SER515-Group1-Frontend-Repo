import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * A reusable Modal component built on top of ShadCN's Dialog.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls whether the modal is open or closed.
 * @param {() => void} props.onClose - Function to call when the modal should be closed.
 * @param {string} props.title - The title to display in the modal header.
 * @param {string} [props.description] - An optional description to display below the title.
 * @param {React.ReactNode} props.children - The content to display in the modal body.
 * @param {React.ReactNode} [props.footer] - Optional content to display in the modal footer (e.g., buttons).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  footer,
}) {
  // The onOpenChange callback is the key to controlling the dialog from a parent
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Modal Body */}
        <div className="py-4">{children}</div>

        {/* Modal Footer */}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
