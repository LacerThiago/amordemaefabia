import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart, formatBRL } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "5581985051950"; // Fábia

export function CartDrawer() {
  const {
    items,
    isOpen,
    setOpen,
    notes,
    setNotes,
    increment,
    decrement,
    removeItem,
    totalAmount,
    clear,
  } = useCart();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      const orderItems = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));

      const { error } = await supabase.from("orders").insert({
        customer_notes: notes || null,
        total_amount: totalAmount,
        items: orderItems,
        status: "pending",
      });

      if (error) throw error;

      const lines = [
        "Olá, Fábia! Gostaria de fazer um pedido pelo site:",
        "",
        ...items.map(
          (i) => `• ${i.quantity}x ${i.name} — ${formatBRL(i.price)} (${formatBRL(i.price * i.quantity)})`,
        ),
        "",
      ];
      if (notes.trim()) {
        lines.push(`Observações: ${notes.trim()}`, "");
      }
      lines.push(`Total: ${formatBRL(totalAmount)}`);

      const message = encodeURIComponent(lines.join("\n"));
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

      toast.success("Pedido registrado! Abrindo o WhatsApp…");
      window.open(url, "_blank");
      clear();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar o pedido. Tente novamente.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full flex flex-col sm:max-w-md bg-[var(--cream)]">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-[var(--chocolate)]">
            Seu Pedido
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-sm">Seu carrinho está vazio.</p>
              <p className="text-xs mt-1">Adicione um docinho com carinho 💕</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 items-start bg-card rounded-xl p-3 border border-border/60"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBRL(item.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => decrement(item.id)}
                        aria-label="Diminuir"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => increment(item.id)}
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--chocolate)] whitespace-nowrap">
                    {formatBRL(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-medium text-[var(--chocolate)]">
                Observações do pedido
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: entrega dia 20/08 às 15h, nome 'Ana' no topo do bolo…"
                className="mt-2 min-h-24 bg-card"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Lembrete: encomendas com no mínimo 24h de antecedência 💛
              </p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <Separator className="hidden" />
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-display font-semibold text-[var(--chocolate)]">
                {formatBRL(totalAmount)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full h-12 bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)] rounded-full"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Finalizar Pedido via WhatsApp
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
