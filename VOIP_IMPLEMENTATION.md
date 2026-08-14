# 📞 Implementação de Chamadas de Voz (VoIP) no TaxiLego

Implementei um sistema de chamadas de voz completo e seguro para permitir a comunicação entre passageiros e motoristas sem a necessidade de partilhar números de telefone pessoais.

---

## 🛠️ O que foi feito

### 1. Estabilização do WebRTC
*   **PeerJS Integration**: Utilizei a biblioteca PeerJS para estabelecer ligações áudio diretas (P2P) entre os dispositivos, garantindo baixa latência e alta qualidade.
*   **Identidade Determinística**: Implementei um sistema de IDs de Peer baseados no ID do Supabase, garantindo que o motorista e o passageiro se encontram sempre na rede.

### 2. Fluxo de Chamada Profissional
*   **Interface de Chamada**: Criei um ecrã de chamada em ecrã total (estilo nativo) com:
    *   Identificação do interlocutor.
    *   Temporizador de duração.
    *   Controlos de Mudo (Mic Off) e Terminar Chamada.
    *   Feedback visual de "A chamar...", "A tocar..." e "Em chamada".
*   **Toque e Vibração**: Adicionei feedback sonoro e tátil para chamadas recebidas.

### 3. Integração em Todo o App
*   **Ecrã de Corrida Ativa**: O botão de chamada está agora disponível tanto para o passageiro como para o motorista durante a viagem.
*   **Integração no Chat**: Adicionei o botão de chamada diretamente no cabeçalho do chat, facilitando a transição de texto para voz.
*   **Correção de Bugs**: Resolvi um erro crítico onde a identidade do motorista não era reconhecida corretamente pelo passageiro ao tentar ligar.

### 4. Notificações e Retenção
*   **Push Notifications**: Integrei o sistema de notificações push para "acordar" o dispositivo do destinatário quando recebe uma chamada.
*   **Enrolment para Motoristas**: Adicionei o prompt de ativação de notificações no painel do motorista, garantindo que eles nunca perdem uma chamada de um passageiro.

---

## 📊 Monitorização e Segurança
*   **Histórico de Chamadas**: As chamadas são agora registadas na base de dados (`voice_calls`), permitindo auditoria em caso de incidentes.
*   **Privacidade Total**: Todo o áudio é transmitido via internet (VoIP). O número de telefone real nunca é exposto.

---

## 🚀 Próximos Passos
Para testar, basta iniciar uma corrida e clicar no ícone do telefone no ecrã de acompanhamento ou dentro do chat. Certifique-se de dar permissão ao microfone quando solicitado pelo navegador.
