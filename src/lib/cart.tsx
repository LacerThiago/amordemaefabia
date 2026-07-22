import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  notes: string;
  setNotes: (v: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
  totalItems: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      isOpen,
      notes,
      setNotes,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      setOpen: setIsOpen,
      addItem: (item) => {
        setItems((prev) => {
          const existing = prev.find((p) => p.id === item.id);
          if (existing) {
            return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p));
          }
          return [...prev, { ...item, quantity: 1 }];
        });
        setIsOpen(true);
      },
      removeItem: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      increment: (id) =>
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p))),
      decrement: (id) =>
        setItems((prev) =>
          prev
            .map((p) => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
            .filter((p) => p.quantity > 0),
        ),
      clear: () => {
        setItems([]);
        setNotes("");
      },
      totalItems,
      totalAmount,
    };
  }, [items, isOpen, notes]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
