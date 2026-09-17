import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import ModulePlaceholder from "@/components/shared/ModulePlaceholder";
import {
  MessageSquare, MessagesSquare, Instagram, Bot, Megaphone, Zap, Sparkles, Globe,
} from "lucide-react";

const configs = {
  inbox: { title: "Atendimento", desc: "Central unificada de conversas multi-canal (WhatsApp, e-mail, chat), com atribuição por corretor, tags e histórico.", icon: MessageSquare },
  whatsapp: { title: "WhatsApp Business", desc: "Envio de mensagens, templates, atendimento em massa e integração oficial via API do WhatsApp Business.", icon: MessagesSquare },
  instagram: { title: "Instagram", desc: "Integração com DMs, comentários e agendamento de publicações — captação de leads direto do feed.", icon: Instagram },
  chatbot: { title: "Chatbot", desc: "Fluxos automatizados de qualificação, agendamento de visita e resposta 24/7 com IA.", icon: Bot },
  marketing: { title: "Marketing", desc: "Campanhas segmentadas, e-mail marketing, landing pages, integração com Meta Ads e Google Ads.", icon: Megaphone },
  automations: { title: "Automações", desc: "Fluxos gatilho→ação: follow-up automático, atribuição de leads, alertas de negócios parados, disparo por eventos.", icon: Zap },
  ai: { title: "IA · Débora Copilot", desc: "Sugestões de próximos passos, movimentações automáticas no CRM, resumos de conversas e follow-ups gerados por IA.", icon: Sparkles },
  sites: { title: "Sites e Portais", desc: "Sites próprios com sincronização automática do inventário, SEO, formulários que viram leads na conta.", icon: Globe },
};

const Placeholder = ({ moduleKey }) => {
  const c = configs[moduleKey];
  return (
    <div className="space-y-6">
      <PageHeader title={c.title} subtitle="Módulo em preparação para próximas versões" />
      <ModulePlaceholder title={c.title} description={c.desc} icon={c.icon} testId={`placeholder-${moduleKey}`} />
    </div>
  );
};

export default Placeholder;
