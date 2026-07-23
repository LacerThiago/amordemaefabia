import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Search,
  Package,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getProductsAdmin, createProduct, updateProduct, deleteProduct } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { type Product } from "@/components/ProductCard";

const adminProductsQuery = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => getProductsAdmin(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio — Fábia Bolos" },
      {
        name: "description",
        content: "Painel de gestão do cardápio da Fábia Bolos.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProductsQuery),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <p className="opacity-70">Erro ao carregar admin: {error.message}</p>
    </div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--admin-bg)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-accent)]" />
    </div>
  ),
});

function AdminPage() {
  const { data: products } = useSuspenseQuery(adminProductsQuery);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image_url: "",
    is_available: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setForm((prev) => ({ ...prev, image_url: compressedDataUrl }));
          toast.success("Foto carregada com sucesso!");
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        toast.error("Erro ao processar a imagem.");
        setUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo de imagem.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const createFn = useServerFn(createProduct);
  const updateFn = useServerFn(updateProduct);
  const deleteFn = useServerFn(deleteProduct);

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      category: "",
      image_url: "",
      is_available: true,
    });
    setIsOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name!,
        description: form.description,
        price: Number(form.price),
        category: form.category!,
        image_url: form.image_url || "",
        is_available: form.is_available ?? true,
      };
      if (editing) {
        await updateFn({ data: { id: editing.id, product: payload } });
        toast.success("Produto atualizado!");
      } else {
        await createFn({ data: payload });
        toast.success("Produto adicionado!");
      }
      setIsOpen(false);
      invalidateProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("Produto removido!");
      invalidateProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover produto");
    } finally {
      setDeleting(null);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem("temp_admin_bypass");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const available = products.filter((p) => p.is_available).length;
    const categories = new Set(products.map((p) => p.category)).size;
    return { total: products.length, available, categories };
  }, [products]);

  return (
    <div
      className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]"
      style={{
        backgroundImage:
          "radial-gradient(1200px 500px at 90% -10%, oklch(0.28 0.05 55 / 0.35), transparent 60%), radial-gradient(800px 400px at -10% 20%, oklch(0.24 0.04 300 / 0.25), transparent 60%)",
      }}
    >
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--admin-bg)]/70 border-b border-[var(--admin-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Voltar ao site</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--admin-accent)] flex items-center justify-center">
              <span className="font-mono text-sm font-bold text-[var(--admin-accent-ink)]">F</span>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--admin-muted)]">Fábia Bolos</p>
              <p className="font-mono text-sm text-[var(--admin-text)]">/studio</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="rounded-full text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface)]"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title + stats */}
        <section className="mb-8">
          <p className="font-mono text-xs text-[var(--admin-accent)] uppercase tracking-[0.25em]">
            // painel do cardápio
          </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="font-display text-4xl sm:text-5xl">
              Studio<span className="text-[var(--admin-accent)]">.</span>
            </h1>
            <Button
              onClick={openNew}
              className="rounded-xl bg-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/90 text-[var(--admin-accent-ink)] font-medium shadow-lg shadow-[var(--admin-accent)]/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo produto
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Produtos" value={stats.total} icon={<Package className="h-4 w-4" />} />
            <StatCard
              label="Disponíveis"
              value={stats.available}
              icon={<CircleDot className="h-4 w-4 text-[var(--admin-accent)]" />}
            />
            <StatCard label="Categorias" value={stats.categories} icon={<span className="font-mono text-xs">#</span>} />
          </div>
        </section>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="buscar produto, categoria..."
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:border-[var(--admin-accent)] font-mono text-sm transition-colors"
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="border border-dashed border-[var(--admin-border)] rounded-2xl bg-[var(--admin-surface)]/40 py-16 text-center">
            <p className="text-[var(--admin-muted)] font-mono text-sm">
              {products.length === 0 ? "// nenhum produto cadastrado" : "// nenhum resultado"}
            </p>
            {products.length === 0 && (
              <Button
                onClick={openNew}
                variant="outline"
                className="mt-4 rounded-xl border-[var(--admin-border)] bg-transparent text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]"
              >
                Adicionar o primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((p, idx) => (
              <article
                key={p.id}
                className={`group rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-2)] transition-colors overflow-hidden ${
                  !p.is_available ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-stretch gap-0">
                  <div className="w-24 sm:w-32 shrink-0 bg-[var(--admin-bg)] relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--admin-muted)]">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--admin-muted)] uppercase tracking-wider">
                        <span>#{String(idx + 1).padStart(2, "0")}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--admin-border)]" />
                        <span className="text-[var(--admin-accent)]">{p.category}</span>
                        {!p.is_available && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[var(--admin-border)]" />
                            <span className="text-[var(--admin-danger)]">esgotado</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 font-display text-lg text-[var(--admin-text)] truncate">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-[var(--admin-muted)] line-clamp-1 mt-0.5">{p.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                      <span className="font-mono text-base text-[var(--admin-text)] whitespace-nowrap">
                        R$ {p.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="h-9 w-9 rounded-lg bg-[var(--admin-bg)] hover:bg-[var(--admin-accent)] hover:text-[var(--admin-accent-ink)] text-[var(--admin-muted)] flex items-center justify-center transition-colors"
                          aria-label="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="h-9 w-9 rounded-lg bg-[var(--admin-bg)] hover:bg-[var(--admin-danger)]/20 hover:text-[var(--admin-danger)] text-[var(--admin-muted)] flex items-center justify-center transition-colors"
                          aria-label="Remover"
                        >
                          {deleting === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)]">
          <DialogHeader>
            <p className="font-mono text-xs text-[var(--admin-accent)] uppercase tracking-[0.2em]">
              {editing ? "// editar" : "// criar"}
            </p>
            <DialogTitle className="font-display text-2xl text-[var(--admin-text)]">
              {editing ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <FieldWrap>
              <Label htmlFor="name" className="text-[var(--admin-muted)] font-mono text-xs uppercase tracking-wider">
                Nome
              </Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Bolo de Ninho com Nutella"
                className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)]/60 focus-visible:ring-[var(--admin-accent)]"
              />
            </FieldWrap>
            <FieldWrap>
              <Label htmlFor="category" className="text-[var(--admin-muted)] font-mono text-xs uppercase tracking-wider">
                Categoria
              </Label>
              <Input
                id="category"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Bolos Recheados"
                list="categories"
                className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)]/60 focus-visible:ring-[var(--admin-accent)]"
              />
              <datalist id="categories">
                <option value="Bolos Recheados" />
                <option value="Bolos Caseiros" />
                <option value="Doces & Brigadeiros" />
                <option value="Sobremesas" />
              </datalist>
            </FieldWrap>
            <FieldWrap>
              <Label htmlFor="price" className="text-[var(--admin-muted)] font-mono text-xs uppercase tracking-wider">
                Preço (R$)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="0,00"
                className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)]/60 font-mono focus-visible:ring-[var(--admin-accent)]"
              />
            </FieldWrap>
            <FieldWrap>
              <Label htmlFor="description" className="text-[var(--admin-muted)] font-mono text-xs uppercase tracking-wider">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ingredientes, tamanho, detalhes..."
                rows={3}
                className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text)] placeholder:text-[var(--admin-muted)]/60 focus-visible:ring-[var(--admin-accent)]"
              />
            </FieldWrap>
            <FieldWrap>
              <Label className="text-[var(--admin-muted)] font-mono text-xs uppercase tracking-wider">
                Foto do produto
              </Label>
              {form.image_url ? (
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                  <img src={form.image_url} alt="Prévia" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute top-2 right-2 rounded-lg h-8 px-3 text-xs shadow-md"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload-input"
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[var(--admin-border)] hover:border-[var(--admin-accent)] rounded-xl cursor-pointer bg-[var(--admin-bg)]/50 hover:bg-[var(--admin-bg)] transition-colors text-center"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-accent)]" />
                  ) : (
                    <>
                      <div className="p-3 rounded-lg bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--admin-text)]">
                          Escolher foto
                        </p>
                        <p className="text-xs text-[var(--admin-muted)] mt-0.5 font-mono">
                          câmera ou galeria · PNG/JPG
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    id="file-upload-input"
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
              <details className="text-xs text-[var(--admin-muted)] mt-1 cursor-pointer">
                <summary className="hover:text-[var(--admin-text)] transition-colors font-mono">
                  // ou colar URL manualmente
                </summary>
                <Input
                  id="image_url"
                  type="url"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-2 text-xs bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text)]"
                />
              </details>
            </FieldWrap>
            <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
              <div className="flex items-center gap-2">
                {form.is_available ? (
                  <Eye className="h-4 w-4 text-[var(--admin-accent)]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[var(--admin-muted)]" />
                )}
                <Label htmlFor="available" className="text-sm font-normal cursor-pointer text-[var(--admin-text)]">
                  Disponível no cardápio
                </Label>
              </div>
              <Switch
                id="available"
                checked={form.is_available}
                onCheckedChange={(checked) => setForm({ ...form, is_available: checked })}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/90 text-[var(--admin-accent-ink)] font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Salvando..." : "Salvar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70 p-3 sm:p-4">
      <div className="flex items-center justify-between text-[var(--admin-muted)]">
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono">{label}</span>
        {icon}
      </div>
      <p className="mt-2 font-display text-2xl sm:text-3xl text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
