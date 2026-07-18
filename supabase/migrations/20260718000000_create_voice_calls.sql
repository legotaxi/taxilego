-- Criar tabela para histórico de chamadas de voz
CREATE TABLE IF NOT EXISTS public.voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('completed', 'missed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own voice calls"
    ON public.voice_calls
    FOR SELECT
    USING (auth.uid() = caller_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own voice calls"
    ON public.voice_calls
    FOR INSERT
    WITH CHECK (auth.uid() = caller_id);
