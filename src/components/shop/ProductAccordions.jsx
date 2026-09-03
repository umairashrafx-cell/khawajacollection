import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function ProductAccordions({ product }) {
  const sections = [
    { id: "details", title: "Product details", body: product.details },
    { id: "care", title: "Fabric & care", body: product.care },
    { id: "shipping", title: "Delivery & returns", body: [product.shipping] },
  ];
  const [open, setOpen] = useState("details");

  return (
    <div className="mt-8 border-t border-border">
      {sections.map((s) => {
        const isOpen = open === s.id;
        return (
          <div key={s.id} className="border-b border-border">
            <button
              onClick={() => setOpen(isOpen ? null : s.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-left text-sm"
            >
              {s.title}
              {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
            {isOpen && (
              <ul className="space-y-2 pb-5 text-sm text-muted-foreground">
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
