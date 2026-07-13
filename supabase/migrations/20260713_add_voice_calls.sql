-- Criar tabela de chamadas de voz
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_voice_calls_ride_id ON voice_calls(ride_id);
CREATE INDEX idx_voice_calls_caller_id ON voice_calls(caller_id);
CREATE INDEX idx_voice_calls_recipient_id ON voice_calls(recipient_id);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Política: Utilizadores podem ver suas próprias chamadas
CREATE POLICY "Users can view their own voice calls"
  ON voice_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = recipient_id);

-- Política: Utilizadores podem inserir suas próprias chamadas
CREATE POLICY "Users can insert their own voice calls"
  ON voice_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_voice_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_calls_updated_at_trigger
BEFORE UPDATE ON voice_calls
FOR EACH ROW
EXECUTE FUNCTION update_voice_calls_updated_at();
