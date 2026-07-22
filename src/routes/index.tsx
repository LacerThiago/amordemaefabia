import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ShoppingBag, Clock, Heart, MapPin, Phone } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CartProvider, useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cake.jpg";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, image_url, is_available")
      .order("is_available", { ascending: false })
      .order("category")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amor de Mãe Fábia — Confeitaria Artesanal" },
      {
        name: "description",
        content:
          "Bolos recheados, bolos caseiros e docinhos feitos com carinho. Sabor e afeto em cada fatia. Encomendas com no mínimo 24h de antecedência.",
      },
      { property: "og:title", content: "Amor de Mãe Fábia — Confeitaria Artesanal" },
      {
        property: "og:description",
        content: "Sabor e afeto em cada fatia. Cardápio de bolos e doces artesanais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: PageWithProvider,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">Não foi possível carregar o cardápio: {error.message}</p>
    </div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Preparando o cardápio…</p>
    </div>
  ),
});

function PageWithProvider() {
  return (
    <CartProvider>
      <MenuPage />
      <CartDrawer />
    </CartProvider>
  );
}

function MenuPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [category, setCategory] = useState<string>("Todos");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(
    () => (category === "Todos" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <section id="cardapio" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--rose-soft)] font-medium">
            Nosso Cardápio
          </p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-display text-[var(--chocolate)]">
            Feito com amor,
            <br className="sm:hidden" /> servido com afeto
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm transition-all border ${
                  active
                    ? "bg-[var(--chocolate)] text-[var(--cream)] border-[var(--chocolate)] shadow-sm"
                    : "bg-card text-[var(--chocolate)] border-border hover:border-[var(--rose-soft)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Nenhum item disponível nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Header() {
  const { openCart, totalItems } = useCart();
  return (
    <header className="sticky top-0 z-30 bg-[var(--cream)]/85 backdrop-blur-md border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-[var(--rose-soft)] fill-[var(--rose-soft)]" />
          <span className="font-display text-lg text-[var(--chocolate)] leading-none">
            Amor de Mãe <span className="italic">Fábia</span>
          </span>
        </a>
        <Button
          onClick={openCart}
          variant="ghost"
          className="relative rounded-full hover:bg-[var(--rose-soft)]/30 text-[var(--chocolate)]"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline text-sm">Meu pedido</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[var(--chocolate)] text-[var(--cream)] text-[10px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-14 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--chocolate)]/70">
              <span className="h-px w-8 bg-[var(--rose-soft)]" />
              Confeitaria artesanal
            </span>
            <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl text-[var(--chocolate)] leading-[1.02]">
              Amor de Mãe
              <br />
              <span className="italic text-[var(--rose-soft)]">Fábia</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--chocolate)]/80 font-display italic">
              Sabor e afeto em cada fatia.
            </p>
            <p className="mt-3 text-muted-foreground max-w-md leading-relaxed">
              Bolos, doces e brigadeiros preparados no capricho, como aqueles feitos em casa —
              porque comida boa é lembrança de infância.
            </p>

            <div className="mt-7 inline-flex items-start gap-3 bg-[var(--rose-soft)]/30 border border-[var(--rose-soft)]/60 rounded-2xl px-5 py-4">
              <Clock className="h-5 w-5 text-[var(--chocolate)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--chocolate)]">
                  Encomendas com no mínimo 24h de antecedência
                </p>
                <p className="text-xs text-[var(--chocolate)]/70 mt-0.5">
                  Assim garantimos o frescor e todo o carinho no preparo.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <a href="#cardapio">
                <Button className="rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)] h-12 px-8">
                  Ver o cardápio
                </Button>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-[var(--rose-soft)]/30 rounded-[3rem] blur-2xl" />
            <img
              src={heroImage}
              alt="Bolo artesanal decorado com rosas de buttercream e doces"
              width={1600}
              height={900}
              className="relative rounded-[2.5rem] shadow-xl object-cover w-full aspect-[4/3]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--chocolate)] text-[var(--cream)] mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-[var(--rose-soft)] text-[var(--rose-soft)]" />
            <span className="font-display text-xl">Amor de Mãe Fábia</span>
          </div>
          <p className="mt-3 text-sm text-[var(--cream)]/70 leading-relaxed">
            Sabor e afeto em cada fatia. Bolos e doces artesanais feitos com o carinho de casa.
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg text-[var(--cream)]">Contato</h4>
          <a
            href="https://wa.me/5581985051950"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-[var(--cream)]/80 hover:text-[var(--cream)]"
          >
            <Phone className="h-4 w-4" /> (81) 98505-1950
          </a>
          <p className="mt-2 text-xs text-[var(--cream)]/60">
            Encomendas: no mínimo 24h de antecedência
          </p>
        </div>

        <div>
          <h4 className="font-display text-lg text-[var(--cream)]">Retirada</h4>
          <p className="mt-3 flex items-start gap-2 text-sm text-[var(--cream)]/80">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span>Cidade Jardim — Marabá, PA</span>
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--cream)]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--cream)]/50">
          <p>© {new Date().getFullYear()} Amor de Mãe Fábia · Feito com carinho</p>
          <a href="/admin" className="hover:text-[var(--cream)] transition-colors">
            Área da Fábia — editar cardápio
          </a>
        </div>
      </div>
    </footer>
  );
}
