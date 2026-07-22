import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Edit2,
  Heart,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getProductsAdmin, createProduct, updateProduct, deleteProduct } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { type Product } from "@/components/ProductCard";

const adminProductsQuery = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => getProductsAdmin(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gerenciar Cardápio — Amor de Mãe Fábia" },
      {
        name: "description",
        content: "Área administrativa para editar o cardápio da Amor de Mãe Fábia.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProductsQuery),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">Erro ao carregar admin: {error.message}</p>
    </div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--chocolate)]" />
    </div>
  ),
});

function AdminPage() {
  const { data: products } = useSuspenseQuery(adminProductsQuery);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="sticky top-0 z-30 bg-[var(--cream)]/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <ArrowLeft className="h-5 w-5 text-[var(--chocolate)]" />
            <span className="font-display text-lg text-[var(--chocolate)] leading-none hidden sm:inline">Cardápio</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Amor de Mãe Fábia" className="h-8 w-auto object-contain rounded-lg" />
            <span className="font-display text-lg text-[var(--chocolate)] leading-none">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="rounded-full text-[var(--chocolate)] hover:bg-[var(--rose-soft)]/30"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-[var(--chocolate)]">Gerenciar cardápio</h1>
            <p className="text-muted-foreground mt-1">Adicione, edite ou desative produtos pelo celular.</p>
          </div>
          <Button
            onClick={openNew}
            className="rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo produto
          </Button>
        </div>

        {products.length === 0 ? (
          <Card className="border border-dashed border-border bg-card/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
              <Button onClick={openNew} variant="outline" className="mt-4 rounded-full">
                Adicionar o primeiro produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card
                key={p.id}
                className={`overflow-hidden border ${p.is_available ? "border-border" : "border-border/60 opacity-70"}`}
              >
                <div className="aspect-[4/3] bg-muted relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Heart className="h-8 w-8 text-[var(--rose-soft)]" />
                    </div>
                  )}
                  {!p.is_available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold px-3 py-1 rounded-full bg-black/50">Esgotado</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[var(--rose-soft)] font-medium uppercase tracking-wide">{p.category}</p>
                      <h3 className="font-display text-lg text-[var(--chocolate)]">{p.name}</h3>
                    </div>
                    <span className="font-semibold text-[var(--chocolate)] whitespace-nowrap">
                      R$ {p.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(p)}
                      className="rounded-full flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[var(--chocolate)]">
              {editing ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Bolo de Ninho com Nutella"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Bolos Recheados"
                list="categories"
              />
              <datalist id="categories">
                <option value="Bolos Recheados" />
                <option value="Bolos Caseiros" />
                <option value="Doces & Brigadeiros" />
                <option value="Sobremesas" />
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ingredientes, tamanho, detalhes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Foto do produto</Label>
              {form.image_url ? (
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-border bg-muted">
                  <img src={form.image_url} alt="Prévia do produto" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute top-2 right-2 rounded-full h-8 px-3 text-xs shadow-md"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover foto
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload-input"
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border hover:border-[var(--chocolate)]/50 rounded-2xl cursor-pointer bg-muted/30 hover:bg-muted/60 transition-colors text-center"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--chocolate)]" />
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-[var(--rose-soft)]/20 text-[var(--chocolate)]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--chocolate)]">
                          Escolher foto no celular ou PC
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tire uma foto ou escolha da galeria (PNG, JPG)
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
              <details className="text-xs text-muted-foreground mt-1 cursor-pointer">
                <summary className="hover:text-[var(--chocolate)] transition-colors">Ou cole a URL da imagem manualmente</summary>
                <Input
                  id="image_url"
                  type="url"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-2 text-xs"
                />
              </details>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                {form.is_available ? <Eye className="h-4 w-4 text-[var(--chocolate)]" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="available" className="text-sm font-normal cursor-pointer">
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
                className="w-full rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)]"
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
