-- Create categories table for user-defined categories with icons
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  icon TEXT NOT NULL DEFAULT 'Circle',
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Default expense categories
  INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
    (NEW.id, 'Alimentación', 'expense', 'Utensils', '#ef4444', true),
    (NEW.id, 'Transporte', 'expense', 'Car', '#f97316', true),
    (NEW.id, 'Vivienda', 'expense', 'Home', '#eab308', true),
    (NEW.id, 'Entretenimiento', 'expense', 'Gamepad2', '#22c55e', true),
    (NEW.id, 'Salud', 'expense', 'Heart', '#ec4899', true),
    (NEW.id, 'Educación', 'expense', 'GraduationCap', '#8b5cf6', true),
    (NEW.id, 'Ropa', 'expense', 'Shirt', '#06b6d4', true),
    (NEW.id, 'Servicios', 'expense', 'Zap', '#6366f1', true),
    (NEW.id, 'Otros', 'expense', 'MoreHorizontal', '#64748b', true);
  
  -- Default income categories
  INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
    (NEW.id, 'Salario', 'income', 'Briefcase', '#22c55e', true),
    (NEW.id, 'Freelance', 'income', 'Laptop', '#3b82f6', true),
    (NEW.id, 'Inversiones', 'income', 'TrendingUp', '#8b5cf6', true),
    (NEW.id, 'Ventas', 'income', 'ShoppingBag', '#f97316', true),
    (NEW.id, 'Regalos', 'income', 'Gift', '#ec4899', true),
    (NEW.id, 'Reembolsos', 'income', 'RotateCcw', '#06b6d4', true),
    (NEW.id, 'Otros', 'income', 'MoreHorizontal', '#64748b', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- Create default categories for existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT DISTINCT user_id FROM categories)
  LOOP
    -- Default expense categories
    INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
      (user_record.id, 'Alimentación', 'expense', 'Utensils', '#ef4444', true),
      (user_record.id, 'Transporte', 'expense', 'Car', '#f97316', true),
      (user_record.id, 'Vivienda', 'expense', 'Home', '#eab308', true),
      (user_record.id, 'Entretenimiento', 'expense', 'Gamepad2', '#22c55e', true),
      (user_record.id, 'Salud', 'expense', 'Heart', '#ec4899', true),
      (user_record.id, 'Educación', 'expense', 'GraduationCap', '#8b5cf6', true),
      (user_record.id, 'Ropa', 'expense', 'Shirt', '#06b6d4', true),
      (user_record.id, 'Servicios', 'expense', 'Zap', '#6366f1', true),
      (user_record.id, 'Otros', 'expense', 'MoreHorizontal', '#64748b', true),
      (user_record.id, 'Salario', 'income', 'Briefcase', '#22c55e', true),
      (user_record.id, 'Freelance', 'income', 'Laptop', '#3b82f6', true),
      (user_record.id, 'Inversiones', 'income', 'TrendingUp', '#8b5cf6', true),
      (user_record.id, 'Ventas', 'income', 'ShoppingBag', '#f97316', true),
      (user_record.id, 'Regalos', 'income', 'Gift', '#ec4899', true),
      (user_record.id, 'Reembolsos', 'income', 'RotateCcw', '#06b6d4', true),
      (user_record.id, 'Otros ingresos', 'income', 'MoreHorizontal', '#64748b', true);
  END LOOP;
END $$;
