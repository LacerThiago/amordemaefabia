
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_notes TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create an order" ON public.orders FOR INSERT WITH CHECK (true);

INSERT INTO public.products (name, description, price, category, image_url, is_available) VALUES
('Bolo de Ninho com Nutella', 'Massa branca fofinha, recheio cremoso de leite ninho com generosas camadas de Nutella.', 120.00, 'Bolos Recheados', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', true),
('Bolo Prestígio', 'Massa de chocolate, recheio de coco cremoso e cobertura de ganache meio amargo.', 110.00, 'Bolos Recheados', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', true),
('Bolo Red Velvet', 'Clássico veludo vermelho com recheio e cobertura de cream cheese aveludado.', 135.00, 'Bolos Recheados', 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&q=80', true),
('Bolo de Cenoura com Brigadeiro', 'O queridinho da vovó: bolo de cenoura fofinho com cobertura generosa de brigadeiro.', 65.00, 'Bolos Caseiros', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80', true),
('Bolo de Fubá Cremoso', 'Bolo caseiro de fubá com aquele miolo cremoso, feito com carinho de mãe.', 55.00, 'Bolos Caseiros', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80', true),
('Bolo de Laranja', 'Massa úmida de laranja com calda cítrica fresquinha por cima.', 50.00, 'Bolos Caseiros', 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=800&q=80', false),
('Brigadeiro Gourmet (cento)', 'Cento de brigadeiros tradicionais feitos com chocolate belga e granulado belga.', 90.00, 'Doces & Brigadeiros', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80', true),
('Beijinho de Coco (cento)', 'Docinhos cremosos de leite condensado e coco fresco, decorados com cravo.', 85.00, 'Doces & Brigadeiros', 'https://images.unsplash.com/photo-1587244141931-59e692b2e35c?w=800&q=80', true),
('Trufa de Morango (unidade)', 'Morango fresco envolto em brigadeiro branco e chocolate ao leite crocante.', 6.50, 'Doces & Brigadeiros', 'https://images.unsplash.com/photo-1548907040-4d42bfc75288?w=800&q=80', true);
