import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, useCart } from "@/lib/cart";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const unavailable = !product.is_available;

  return (
    <article className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              unavailable ? "grayscale opacity-70" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full bg-[var(--rose-soft)]/40" />
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
            <span className="bg-[var(--chocolate)] text-[var(--cream)] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-lg text-[var(--chocolate)] leading-tight">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed flex-1">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xl font-display font-semibold text-[var(--chocolate)]">
            {formatBRL(product.price)}
          </span>
          <Button
            size="sm"
            disabled={unavailable}
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
              })
            }
            className="rounded-full bg-[var(--rose-soft)] hover:bg-[var(--accent)] text-[var(--chocolate)] disabled:opacity-40"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}
