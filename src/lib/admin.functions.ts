import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Product } from "@/components/ProductCard";

const productIdSchema = z.object({ id: z.string().uuid() });

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(2),
  image_url: z.string().url().optional().or(z.literal("")),
  is_available: z.boolean().default(true),
});

const productUpdateSchema = z.object({
  id: z.string().uuid(),
  product: productSchema,
});

/**
 * Verifica se o usuário tem role 'admin' na tabela user_roles.
 * Usa o cliente autenticado do usuário — a RLS policy "Users can view their own roles"
 * garante que só o próprio usuário consegue ler seus papéis.
 */
async function ensureAdmin(userId: string, supabase: any) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Não autorizado: apenas administradores podem gerenciar o cardápio.");
  }
}

export const getProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId, context.supabase);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("is_available", { ascending: false })
      .order("category")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, price: Number(p.price) })) as Product[];
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId, context.supabase);
    const { data: inserted, error } = await context.supabase
      .from("products")
      .insert({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image_url: data.image_url || null,
        is_available: data.is_available,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...inserted, price: Number(inserted.price) } as Product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId, context.supabase);
    const { data: updated, error } = await context.supabase
      .from("products")
      .update({
        name: data.product.name,
        description: data.product.description,
        price: data.product.price,
        category: data.product.category,
        image_url: data.product.image_url || null,
        is_available: data.product.is_available,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return { ...updated, price: Number(updated.price) } as Product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId, context.supabase);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
