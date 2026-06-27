import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PlanTier = "free" | "light" | "pro" | "full" | "vitalicio";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plano atual do usuário; default "free" */
  currentTier?: PlanTier;
  /** Nome do recurso bloqueado, ex: "Banco de PDFs" */
  featureName?: string;
  title?: string;
  description?: string;
};

const UPGRADES: { tier: PlanTier; label: string; variant: "default" | "outline"; glow?: boolean }[] = [
  { tier: "light", label: "Ver Plano Light — R$ 19,90", variant: "outline" },
  { tier: "pro", label: "Ver Plano Pro — R$ 29,90", variant: "default", glow: true },
  { tier: "full", label: "Ver Plano Full — R$ 44,90", variant: "outline" },
  { tier: "vitalicio", label: "Ver Vitalício — R$ 499", variant: "outline" },
];

const ORDER: PlanTier[] = ["free", "light", "pro", "full", "vitalicio"];

export function UpgradeDialog({
  open,
  onOpenChange,
  currentTier = "free",
  featureName,
  title,
  description,
}: Props) {
  const currentIdx = ORDER.indexOf(currentTier);
  const opcoes = UPGRADES.filter((u) => ORDER.indexOf(u.tier) > currentIdx);
  const isPaid = currentIdx > 0;

  const finalTitle =
    title ?? (isPaid ? "Faça upgrade para liberar" : "Escolha um plano para começar!");
  const finalDesc =
    description ??
    (featureName
      ? `${featureName} faz parte do conteúdo premium.${isPaid ? " Faça upgrade para um plano superior para acessar." : ""}`
      : `Este recurso faz parte do conteúdo premium.${isPaid ? " Faça upgrade para um plano superior para acessar." : ""}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-glass border-primary/30 sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 grid h-14 w-14 place-content-center rounded-full bg-primary/10 ring-2 ring-primary/40">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{finalTitle}</DialogTitle>
          <DialogDescription className="text-center">{finalDesc}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-2">
          {opcoes.map((u) => (
            <Link key={u.tier} to="/planos">
              <Button className={`w-full ${u.glow ? "glow-blue" : ""}`} variant={u.variant}>
                {u.label}
              </Button>
            </Link>
          ))}
          {opcoes.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Você já tem o plano máximo. Aproveite!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
