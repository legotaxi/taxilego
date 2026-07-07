import { useEffect, useState } from "react";
import { Check, X, Eye, Loader2, AlertCircle, Car, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DriverApplication {
  id: string;
  full_name: string;
  phone: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  bi_number: string;
  license_number: string;
  bi_url: string | null;
  license_url: string | null;
  criminal_record_url: string | null;
  photo_url: string | null;
  created_at: string;
  approved_at: string | null;
  vehicle_id: string | null;
}

type VehicleCategory = "moto" | "normal" | "xl" | "premium" | "shared" | "delivery";

interface VehicleForm {
  brand: string;
  model: string;
  plate: string;
  year: string;
  color: string;
  category: VehicleCategory;
}

const EMPTY_VEHICLE: VehicleForm = {
  brand: "",
  model: "",
  plate: "",
  year: "",
  color: "",
  category: "normal",
};


export function AdminDriverApprovalPanel() {
  const [drivers, setDrivers] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverApplication | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(EMPTY_VEHICLE);
  const [existingVehicleId, setExistingVehicleId] = useState<string | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  // Load vehicle when a driver is selected
  useEffect(() => {
    if (!selectedDriver) {
      setVehicleForm(EMPTY_VEHICLE);
      setExistingVehicleId(null);
      return;
    }
    const loadVehicle = async () => {
      setVehicleLoading(true);
      try {
        const { data } = await supabase
          .from("vehicles")
          .select("id, brand, model, plate, year, color, category")
          .eq("owner_id", selectedDriver.id)
          .maybeSingle();
        if (data) {
          setExistingVehicleId(data.id);
          setVehicleForm({
            brand: data.brand || "",
            model: data.model || "",
            plate: data.plate || "",
            year: data.year ? String(data.year) : "",
            color: data.color || "",
            category: (data.category as VehicleCategory) || "normal",
          });
        } else {
          setExistingVehicleId(null);
          setVehicleForm(EMPTY_VEHICLE);
        }
      } finally {
        setVehicleLoading(false);
      }
    };
    loadVehicle();
  }, [selectedDriver]);

  const saveVehicle = async () => {
    if (!selectedDriver) return;
    if (!vehicleForm.brand.trim() || !vehicleForm.model.trim() || !vehicleForm.plate.trim()) {
      toast.error("Marca, modelo e matrícula são obrigatórios");
      return;
    }
    setVehicleSaving(true);
    try {
      const payload = {
        owner_id: selectedDriver.id,
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        plate: vehicleForm.plate.trim().toUpperCase(),
        year: vehicleForm.year ? parseInt(vehicleForm.year, 10) : null,
        color: vehicleForm.color.trim() || null,
        category: vehicleForm.category,
      };
      let vehicleId = existingVehicleId;
      if (existingVehicleId) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", existingVehicleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("vehicles").insert(payload).select("id").single();
        if (error) throw error;
        vehicleId = data.id;
        setExistingVehicleId(data.id);
      }
      // Link vehicle to driver
      if (vehicleId) {
        await supabase.from("drivers").update({ vehicle_id: vehicleId }).eq("id", selectedDriver.id);
      }
      toast.success("Veículo guardado com sucesso!");
      loadDrivers();
    } catch (err: any) {
      console.error("Erro ao guardar veículo:", err);
      toast.error(err?.message || "Erro ao guardar veículo");
    } finally {
      setVehicleSaving(false);
    }
  };


  const loadDrivers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("drivers")
        .select(`
          id,
          status,
          bi_number,
          license_number,
          bi_url,
          license_url,
          criminal_record_url,
          photo_url,
          created_at,
          approved_at,
          vehicle_id,
          profiles:id(full_name, phone)
        `);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((d: any) => ({
        id: d.id,
        full_name: d.profiles?.full_name || "N/A",
        phone: d.profiles?.phone || "N/A",
        status: d.status,
        bi_number: d.bi_number,
        license_number: d.license_number,
        bi_url: d.bi_url,
        license_url: d.license_url,
        criminal_record_url: d.criminal_record_url,
        photo_url: d.photo_url,
        created_at: d.created_at,
        approved_at: d.approved_at,
        vehicle_id: d.vehicle_id,
      }));


      setDrivers(formatted);
    } catch (err) {
      console.error("Erro ao carregar motoristas:", err);
      toast.error("Erro ao carregar candidaturas");
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (driverId: string) => {
    setApproving(driverId);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", driverId);

      if (error) throw error;

      // Add driver role
      await supabase
        .from("user_roles")
        .upsert({
          user_id: driverId,
          role: "driver",
        });

      toast.success("Motorista aprovado com sucesso!");
      loadDrivers();
      setSelectedDriver(null);
    } catch (err) {
      console.error("Erro ao aprovar:", err);
      toast.error("Erro ao aprovar motorista");
    } finally {
      setApproving(null);
    }
  };

  const rejectDriver = async (driverId: string) => {
    setRejecting(driverId);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ status: "rejected" })
        .eq("id", driverId);

      if (error) throw error;

      toast.success("Candidatura rejeitada");
      loadDrivers();
      setSelectedDriver(null);
    } catch (err) {
      console.error("Erro ao rejeitar:", err);
      toast.error("Erro ao rejeitar candidatura");
    } finally {
      setRejecting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      suspended: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      suspended: "Suspenso",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const DocumentPreview = ({ url, label }: { url: string | null; label: string }) => {
    if (!url) {
      return (
        <div className="rounded-lg bg-muted p-4 text-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">{label} não enviado</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted p-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            <Eye className="h-4 w-4" />
            Ver {label}
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">A carregar candidaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "pending" && "Pendentes"}
            {f === "approved" && "Aprovados"}
            {f === "rejected" && "Rejeitados"}
            {f === "all" && "Todos"}
          </button>
        ))}
      </div>

      {/* Drivers List */}
      {drivers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma candidatura encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-lg border border-border bg-card p-4 hover:border-foreground/50 transition cursor-pointer"
              onClick={() => setSelectedDriver(driver)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display font-bold">{driver.full_name}</h3>
                    {getStatusBadge(driver.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>📱 {driver.phone}</div>
                    <div>🆔 {driver.bi_number}</div>
                    <div>🚗 {driver.license_number}</div>
                    <div>📅 {new Date(driver.created_at).toLocaleDateString("pt-AO")}</div>
                  </div>
                </div>

                {driver.status === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveDriver(driver.id);
                      }}
                      disabled={approving === driver.id}
                      className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-800 hover:bg-green-200 transition disabled:opacity-50"
                    >
                      {approving === driver.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aprovar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectDriver(driver.id);
                      }}
                      disabled={rejecting === driver.id}
                      className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-800 hover:bg-red-200 transition disabled:opacity-50"
                    >
                      {rejecting === driver.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">{selectedDriver.full_name}</h2>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                  <p className="font-medium">{selectedDriver.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedDriver.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">BI</p>
                  <p className="font-medium">{selectedDriver.bi_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Carta de Condução</p>
                  <p className="font-medium">{selectedDriver.license_number}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-display font-bold mb-4">Documentos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DocumentPreview url={selectedDriver.bi_url} label="Bilhete de Identidade" />
                  <DocumentPreview url={selectedDriver.license_url} label="Carta de Condução" />
                  <DocumentPreview url={selectedDriver.criminal_record_url} label="Registo Criminal" />
                  <DocumentPreview url={selectedDriver.photo_url} label="Foto de Perfil" />
                </div>
              </div>

              {/* Vehicle (admin-managed) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Car className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-bold">Veículo do Motorista</h3>
                  {existingVehicleId && (
                    <span className="ml-auto text-xs rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                      Atribuído
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Preencha os dados do veículo da frota Lego que será atribuído a este motorista.
                </p>

                {vehicleLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Marca *</span>
                        <input
                          type="text"
                          value={vehicleForm.brand}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))}
                          placeholder="Toyota"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Modelo *</span>
                        <input
                          type="text"
                          value={vehicleForm.model}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, model: e.target.value }))}
                          placeholder="Corolla"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Matrícula *</span>
                        <input
                          type="text"
                          value={vehicleForm.plate}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, plate: e.target.value.toUpperCase() }))}
                          placeholder="LD-00-00-AA"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase tracking-wider outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Ano</span>
                        <input
                          type="number"
                          value={vehicleForm.year}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, year: e.target.value }))}
                          placeholder="2020"
                          min="1990"
                          max="2030"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Cor</span>
                        <input
                          type="text"
                          value={vehicleForm.color}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, color: e.target.value }))}
                          placeholder="Branco"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-muted-foreground">Categoria *</span>
                        <select
                          value={vehicleForm.category}
                          onChange={(e) => setVehicleForm((p) => ({ ...p, category: e.target.value as VehicleCategory }))}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        >
                          <option value="moto">MotoTáxi</option>
                          <option value="normal">Táxi Normal</option>
                          <option value="xl">Táxi XL</option>
                          <option value="premium">Premium</option>
                          <option value="shared">Partilhada</option>
                          <option value="delivery">Entrega</option>
                        </select>
                      </label>
                    </div>
                    <button
                      onClick={saveVehicle}
                      disabled={vehicleSaving}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-3 font-display font-bold transition hover:opacity-90 disabled:opacity-50"
                    >
                      {vehicleSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {existingVehicleId ? "Atualizar Veículo" : "Atribuir Veículo"}
                    </button>
                  </div>
                )}
              </div>


              {/* Actions */}
              {selectedDriver.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => approveDriver(selectedDriver.id)}
                    disabled={approving === selectedDriver.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-3 font-medium text-green-800 hover:bg-green-200 transition disabled:opacity-50"
                  >
                    {approving === selectedDriver.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Aprovar Candidatura
                  </button>
                  <button
                    onClick={() => rejectDriver(selectedDriver.id)}
                    disabled={rejecting === selectedDriver.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 font-medium text-red-800 hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {rejecting === selectedDriver.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Rejeitar Candidatura
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
