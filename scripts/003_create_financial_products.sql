-- =============================================
-- Tabla de Cuentas Bancarias
-- =============================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card')),
  account_number TEXT,
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank accounts"
  ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank accounts"
  ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank accounts"
  ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank accounts"
  ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Tabla de Creditos / Prestamos
-- =============================================
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('personal', 'mortgage', 'vehicle', 'credit_card', 'other')),
  original_amount DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  monthly_payment DECIMAL(15, 2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
  currency TEXT NOT NULL DEFAULT 'COP',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON public.credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credits"
  ON public.credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits"
  ON public.credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credits"
  ON public.credits FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Tabla de CDTs (Certificados de Deposito a Termino)
-- =============================================
CREATE TABLE IF NOT EXISTS public.cdts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  initial_amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  term_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  expected_return DECIMAL(15, 2) NOT NULL,
  auto_renewal BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'renewed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cdts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cdts"
  ON public.cdts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cdts"
  ON public.cdts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cdts"
  ON public.cdts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cdts"
  ON public.cdts FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Indices para mejor rendimiento
-- =============================================
CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS credits_user_id_idx ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS credits_end_date_idx ON public.credits(end_date);
CREATE INDEX IF NOT EXISTS cdts_user_id_idx ON public.cdts(user_id);
CREATE INDEX IF NOT EXISTS cdts_maturity_date_idx ON public.cdts(maturity_date);
