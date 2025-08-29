-- Create customer_notes table for interaction history
CREATE TABLE public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_tags table for segmentation
CREATE TABLE public.customer_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_sales_funnel table for pipeline management
CREATE TABLE public.customer_sales_funnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_up_reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL,
  reminder_date DATE NOT NULL,
  message TEXT,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to existing customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS product_interest TEXT;

-- Enable Row Level Security
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sales_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_notes
CREATE POLICY "Store owners can view their customer notes" 
ON public.customer_notes 
FOR SELECT 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can insert customer notes" 
ON public.customer_notes 
FOR INSERT 
WITH CHECK (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can update their customer notes" 
ON public.customer_notes 
FOR UPDATE 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create RLS policies for customer_tags
CREATE POLICY "Store owners can view their customer tags" 
ON public.customer_tags 
FOR SELECT 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can insert customer tags" 
ON public.customer_tags 
FOR INSERT 
WITH CHECK (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can delete their customer tags" 
ON public.customer_tags 
FOR DELETE 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create RLS policies for customer_sales_funnel
CREATE POLICY "Store owners can view their customer sales funnel" 
ON public.customer_sales_funnel 
FOR SELECT 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can insert customer sales funnel" 
ON public.customer_sales_funnel 
FOR INSERT 
WITH CHECK (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can update their customer sales funnel" 
ON public.customer_sales_funnel 
FOR UPDATE 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create RLS policies for follow_up_reminders
CREATE POLICY "Store owners can view their follow up reminders" 
ON public.follow_up_reminders 
FOR SELECT 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can insert follow up reminders" 
ON public.follow_up_reminders 
FOR INSERT 
WITH CHECK (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Store owners can update their follow up reminders" 
ON public.follow_up_reminders 
FOR UPDATE 
USING (store_id IN ( SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create triggers for updating timestamps
CREATE TRIGGER update_customer_notes_updated_at
BEFORE UPDATE ON public.customer_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_sales_funnel_updated_at
BEFORE UPDATE ON public.customer_sales_funnel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();