INSERT INTO categories (id, name, type, color) VALUES
  (gen_random_uuid(), 'Alimentação', 'despesa', '#ef4444'),
  (gen_random_uuid(), 'Transporte', 'despesa', '#f97316'),
  (gen_random_uuid(), 'Moradia', 'despesa', '#eab308'),
  (gen_random_uuid(), 'Lazer', 'despesa', '#22c55e'),
  (gen_random_uuid(), 'Saúde', 'despesa', '#3b82f6'),
  (gen_random_uuid(), 'Educação', 'despesa', '#6366f1'),
  (gen_random_uuid(), 'Salário', 'receita', '#10b981'),
  (gen_random_uuid(), 'Freelance', 'receita', '#8b5cf6'),
  (gen_random_uuid(), 'Outros', 'despesa', '#6b7280');
