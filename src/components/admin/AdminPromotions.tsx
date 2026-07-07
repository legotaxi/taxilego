import { Loader2, Gift, Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([
    {
      id: "PROMO-001",
      code: "WELCOME20",
      description: "20% de desconto para novos utilizadores",
      discount: 20,
      type: "percentage",
      status: "active",
      usageCount: 156,
      expiryDate: "2026-07-15",
    },
    {
      id: "PROMO-002",
      code: "SUMMER50",
      description: "50 Kz de desconto em corridas acima de 500 Kz",
      discount: 50,
      type: "fixed",
      status: "active",
      usageCount: 89,
      expiryDate: "2026-08-31",
    },
    {
      id: "PROMO-003",
      code: "REFERRAL",
      description: "Ganhe 100 Kz por cada amigo referido",
      discount: 100,
      type: "referral",
      status: "inactive",
      usageCount: 234,
      expiryDate: "2026-12-31",
    },
  ]);

  const handleDeletePromotion = (id: string) => {
    setPromotions(promotions.filter((p) => p.id !== id));
    toast.success("Promoção removida");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promoções</h1>
          <p className="text-muted-foreground mt-1">Gestão de cupões e promoções</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          <Plus className="h-5 w-5" />
          Nova Promoção
        </button>
      </div>

      {/* Promotions Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Promoções Ativas</p>
              <p className="text-3xl font-bold mt-2">
                {promotions.filter((p) => p.status === "active").length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Gift className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total de Utilizações</p>
              <p className="text-3xl font-bold mt-2">
                {promotions.reduce((sum, p) => sum + p.usageCount, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Gift className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Economia Estimada</p>
              <p className="text-3xl font-bold mt-2">
                Kz{" "}
                {promotions
                  .reduce((sum, p) => {
                    const discountValue = p.type === "percentage" ? p.discount * 10 : p.discount;
                    return sum + discountValue * p.usageCount;
                  }, 0)
                  .toLocaleString("pt-PT")}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Gift className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Código</th>
                <th className="px-6 py-3 text-left font-semibold">Descrição</th>
                <th className="px-6 py-3 text-left font-semibold">Desconto</th>
                <th className="px-6 py-3 text-left font-semibold">Utilizações</th>
                <th className="px-6 py-3 text-left font-semibold">Validade</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-xs">{promo.code}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{promo.description}</td>
                  <td className="px-6 py-4 font-semibold">
                    {promo.type === "percentage"
                      ? `${promo.discount}%`
                      : promo.type === "fixed"
                        ? `Kz ${promo.discount}`
                        : `Kz ${promo.discount}`}
                  </td>
                  <td className="px-6 py-4">{promo.usageCount}</td>
                  <td className="px-6 py-4 text-xs">{promo.expiryDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        promo.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {promo.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePromotion(promo.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
