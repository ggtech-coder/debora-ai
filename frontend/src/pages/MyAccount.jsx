import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";
import { initials } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const MyAccount = () => {
  const { user, logout } = useAppStore();
  const nav = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Minha Conta" subtitle="Perfil, segurança e sessões" />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4"><AvatarImage src={user?.avatar} /><AvatarFallback>{initials(user?.name)}</AvatarFallback></Avatar>
          <div className="font-heading text-xl font-semibold">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <Button size="sm" variant="outline" className="mt-4">Alterar foto</Button>
        </Card>
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div><Label>Nome</Label><Input defaultValue={user?.name} /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Usuário</Label><Input defaultValue="debora.almeida" /></div>
            <div><Label>E-mail</Label><Input defaultValue={user?.email} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Nova senha</Label><Input type="password" /></div>
            <div><Label>Confirmar senha</Label><Input type="password" /></div>
          </div>
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between"><Label>Autenticação em 2 fatores</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label>Sessões ativas em outros dispositivos</Label><Button size="sm" variant="outline">Encerrar</Button></div>
          </div>
          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="destructive" onClick={() => { logout(); nav("/login"); }} data-testid="account-logout">
              <LogOut className="w-4 h-4 mr-2" />Sair
            </Button>
            <Button>Salvar alterações</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyAccount;
