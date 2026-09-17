export const formatBRL = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatBRLShort = (value) => {
  if (!value) return "R$ 0";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return formatBRL(value);
};

export const formatNumber = (value) =>
  new Intl.NumberFormat("pt-BR").format(value ?? 0);

export const formatPct = (value) => `${(value ?? 0).toFixed(1)}%`;

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const relativeTime = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d atrás`;
  return formatDate(dateStr);
};

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
