import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Copy, Loader2, RefreshCw, Wand2, MessageSquare, FileText } from "lucide-react";
import { copilotSuggest, copilotSummarize, copilotFollowUp } from "@/lib/copilot";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AIOutput = ({ text, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 rounded-lg bg-secondary/50 border border-border">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Débora Copilot pensando com GPT-5.2...</span>
      </div>
    );
  }
  if (!text) return null;
  return (
    <div className="relative rounded-lg border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] p-4 pr-10">
      <div className="text-sm whitespace-pre-wrap leading-relaxed" data-testid="copilot-output">{text}</div>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={() => { navigator.clipboard.writeText(text); toast.success("Copiado"); }}
        data-testid="copilot-copy"
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

const CopilotDialog = ({ deal, clientName, propertyTitle, trigger, defaultTab = "suggest" }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  // Summary
  const [conversation, setConversation] = useState(
    `Olá, tudo bem? Estou interessado no imóvel ${propertyTitle || "..."}. Gostaria de agendar uma visita para o final de semana. Meu orçamento vai até R$ 800 mil, financiando 70%. Trabalho no Itaim, então preciso de fácil acesso. Poderia me passar mais detalhes sobre condomínio, IPTU e se aceita cachorro? Aguardo retorno.`
  );

  // Follow-up
  const [channel, setChannel] = useState("whatsapp");
  const [tone, setTone] = useState("cordial");

  const run = async (which) => {
    setLoading(true);
    setOutput("");
    try {
      let text = "";
      if (which === "suggest") {
        text = await copilotSuggest({
          title: deal?.title || `Negócio - ${clientName}`,
          client_name: clientName,
          property_title: propertyTitle,
          value: deal?.value || 0,
          stage: deal?.stage || "Contato",
          days_in_stage: deal?.daysInStage || 0,
          temperature: deal?.temperature || "morno",
          probability: deal?.probability || 30,
        });
      } else if (which === "summarize") {
        if (!conversation.trim()) return toast.error("Cole a conversa para resumir");
        text = await copilotSummarize(clientName || "Cliente", conversation);
      } else if (which === "followup") {
        text = await copilotFollowUp({
          client_name: clientName || "Cliente",
          context: `Negócio ${deal?.title || ""} · Imóvel ${propertyTitle || ""} · Etapa ${deal?.stage || ""} · há ${deal?.daysInStage || 0}d.`,
          channel,
          tone,
        });
      }
      setOutput(text);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Falha ao chamar a Débora Copilot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setOutput(""); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            Débora Copilot
            <Badge variant="outline" className="ml-1 font-mono text-[10px]">GPT-5.2</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); setOutput(""); }}>
          <TabsList className="w-full">
            <TabsTrigger value="suggest" className="flex-1" data-testid="tab-suggest"><Wand2 className="w-3.5 h-3.5 mr-1.5" />Próxima ação</TabsTrigger>
            <TabsTrigger value="summarize" className="flex-1" data-testid="tab-summarize"><FileText className="w-3.5 h-3.5 mr-1.5" />Resumo</TabsTrigger>
            <TabsTrigger value="followup" className="flex-1" data-testid="tab-followup"><MessageSquare className="w-3.5 h-3.5 mr-1.5" />Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="suggest" className="mt-4 space-y-3">
            <div className="text-xs text-muted-foreground">
              A Copilot analisa a etapa, o valor e o tempo do negócio para sugerir a próxima ação prioritária.
            </div>
            <div className="rounded-md border border-border p-3 text-xs bg-secondary/40 space-y-0.5">
              <div><span className="text-muted-foreground">Negócio:</span> <span className="font-medium">{deal?.title || "—"}</span></div>
              <div><span className="text-muted-foreground">Cliente:</span> {clientName || "—"} · <span className="text-muted-foreground">Etapa:</span> {deal?.stage || "—"} · há {deal?.daysInStage || 0}d</div>
              <div><span className="text-muted-foreground">Temperatura:</span> <span className={cn("capitalize", deal?.temperature === "quente" && "text-destructive")}>{deal?.temperature || "morno"}</span></div>
            </div>
            <Button onClick={() => run("suggest")} disabled={loading} className="w-full" data-testid="btn-run-suggest">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Gerar sugestão
            </Button>
            <AIOutput text={output} loading={loading} />
          </TabsContent>

          <TabsContent value="summarize" className="mt-4 space-y-3">
            <div className="text-xs text-muted-foreground">Cole a conversa (WhatsApp, e-mail ou anotações) para gerar um resumo executivo.</div>
            <Textarea rows={6} value={conversation} onChange={(e) => setConversation(e.target.value)} placeholder="Cole aqui o histórico de conversa..." data-testid="copilot-conversation" />
            <Button onClick={() => run("summarize")} disabled={loading} className="w-full" data-testid="btn-run-summarize">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Resumir conversa
            </Button>
            <AIOutput text={output} loading={loading} />
          </TabsContent>

          <TabsContent value="followup" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Canal</div>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger data-testid="copilot-channel"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tom</div>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="copilot-tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cordial">Cordial</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => run("followup")} disabled={loading} className="w-full" data-testid="btn-run-followup">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Gerar mensagem
            </Button>
            <AIOutput text={output} loading={loading} />
            {output && (
              <Button variant="outline" size="sm" onClick={() => run("followup")} className="w-full">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Gerar outra versão
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CopilotDialog;
