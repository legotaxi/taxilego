import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Award,
  Camera,
  Phone,
  CreditCard,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

interface FormData {
  fullName: string;
  phoneNumber: string;
  profession: string;
  biNumber: string;
  licenseNumber: string;
}

interface FormErrors {
  [key: string]: string;
}

type DocField = "bilheteId" | "cartaCondacao" | "registoCriminal" | "fotoPerfil";

interface FieldProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  icon: any;
  type?: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Defined OUTSIDE the main component so it is NOT recreated on every render.
// (Recreating it caused the input to remount and lose focus after each keystroke.)
function Field({ label, name, value, placeholder, icon: Icon, type = "text", error, disabled = false, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </div>
      )}
    </label>
  );
}

const DOC_TO_COLUMN: Record<DocField, "bi_url" | "license_url" | "criminal_record_url" | "photo_url"> = {
  bilheteId: "bi_url",
  cartaCondacao: "license_url",
  registoCriminal: "criminal_record_url",
  fotoPerfil: "photo_url",
};

export function DriverRegistrationForm() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    profession: "",
    biNumber: "",
    licenseNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Partial<Record<DocField, File>>>({});
  const [isNewDriver, setIsNewDriver] = useState(false);

  // Load user profile data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            fullName: profile.full_name || "",
            phoneNumber: profile.phone || "",
          }));
          
          // Check if this is a new driver from signup
          const newDriverId = sessionStorage.getItem("newDriverId");
          if (newDriverId === user.id) {
            setIsNewDriver(true);
            sessionStorage.removeItem("newDriverId");
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do utilizador:", err);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: DocField) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Ficheiro muito grande. Máximo 5MB.");
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) return toast.error("Formato não suportado. Use PDF, JPG ou PNG.");
    setFiles((prev) => ({ ...prev, [field]: file }));
    toast.success(`${field === "fotoPerfil" ? "Foto" : "Documento"} selecionado!`);
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: FormErrors = {};
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Nome completo obrigatório";
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Telefone obrigatório";
      else if (!/^\+?\d{9,15}$/.test(formData.phoneNumber.replace(/\s/g, "")))
        newErrors.phoneNumber = "Número de telefone inválido";
      if (!formData.profession.trim()) newErrors.profession = "Profissão obrigatória";
      if (!formData.biNumber.trim()) newErrors.biNumber = "Número do BI obrigatório";
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "Carta de condução obrigatória";
    } else if (stepNum === 2) {
      if (!files.bilheteId) newErrors.bilheteId = "BI obrigatório";
      if (!files.cartaCondacao) newErrors.cartaCondacao = "Carta de Condução obrigatória";
    } else if (stepNum === 3) {
      if (!files.registoCriminal) newErrors.registoCriminal = "Registo criminal obrigatório";
      if (!files.fotoPerfil) newErrors.fotoPerfil = "Foto de perfil obrigatória";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      // If new driver and on step 1, skip to step 2 (data already filled)
      if (isNewDriver && step === 1) {
        setStep(2);
        setIsNewDriver(false);
      } else {
        setStep((step + 1) as 1 | 2 | 3);
      }
    }
  };
  const handlePrevStep = () => setStep((step - 1) as 1 | 2 | 3);

  const uploadDoc = async (userId: string, field: DocField, file: File) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("driver-docs")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(`Falha ao enviar ${field}: ${error.message}`);
    return path;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    if (!user) {
      toast.error("Precisa de iniciar sessão para enviar a candidatura.");
      try {
        sessionStorage.setItem("pendingDriverApp", JSON.stringify(formData));
      } catch {}
      navigate({ to: "/login" });
      return;
    }

    setLoading(true);
    try {
      // 1) Upsert profile
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: formData.fullName,
        phone: formData.phoneNumber,
      });
      if (profErr) throw profErr;

      // 2) Upload all 4 documents
      const entries = Object.entries(files) as Array<[DocField, File]>;
      const uploaded: Record<string, string> = {};
      for (const [field, file] of entries) {
        const path = await uploadDoc(user.id, field, file);
        uploaded[DOC_TO_COLUMN[field]] = path;
      }

      // 3) Upsert driver application with document paths
      const { error: drvErr } = await supabase.from("drivers").upsert({
        id: user.id,
        bi_number: formData.biNumber,
        license_number: formData.licenseNumber,
        status: "pending",
        ...uploaded,
      });
      if (drvErr) throw drvErr;

      toast.success("Candidatura enviada! Aguarde aprovação do admin.");
      setFormData({
        fullName: "",
        phoneNumber: "",
        profession: "",
        biNumber: "",
        licenseNumber: "",
      });
      setFiles({});
      setStep(1);
      // Send the driver to the panel, where DriverStatusGuard will display
      // the "Candidatura em Análise" screen until the admin approves.
      navigate({ to: "/painel-motorista" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full max-w-2xl mx-auto">
      {!authLoading && !user && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>
            Precisa de <button onClick={() => navigate({ to: "/login" })} className="font-bold underline">iniciar sessão</button> antes de enviar a candidatura.
          </div>
        </div>
      )}

      {isNewDriver && (
        <div className="mb-6 flex items-start gap-2 rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>
            Os seus dados foram pré-preenchidos. Agora envie os seus documentos para aprovação.
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display font-bold transition ${
              step >= num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > num ? <Check className="h-5 w-5" /> : num}
            </div>
            <div className="mt-2 text-xs font-medium text-muted-foreground">
              {num === 1 ? "Dados" : num === 2 ? "Documentos" : "Confirmação"}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <h2 className="font-display text-2xl font-bold">Informações Pessoais</h2>
          <Field label="Nome Completo" name="fullName" value={formData.fullName} placeholder="João Manuel Silva" icon={User} error={errors.fullName} disabled={isNewDriver} onChange={handleInputChange} />
          <Field label="Número de Telefone" name="phoneNumber" type="tel" value={formData.phoneNumber} placeholder="923 456 789" icon={Phone} error={errors.phoneNumber} disabled={isNewDriver} onChange={handleInputChange} />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profissão</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-foreground transition-all">
              <Award className="h-4 w-4 text-muted-foreground" />
              <select name="profession" value={formData.profession} onChange={handleInputChange} className="flex-1 bg-transparent text-base outline-none">
                <option value="">Selecione a profissão</option>
                <option value="motorista">Motorista Profissional</option>
                <option value="autonomo">Autónomo</option>
                <option value="desempregado">Desempregado</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            {errors.profession && (
              <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> {errors.profession}
              </div>
            )}
          </label>
          <Field label="Número do BI" name="biNumber" value={formData.biNumber} placeholder="000000000LA000" icon={IdCard} error={errors.biNumber} onChange={handleInputChange} />
          <Field label="Nº da Carta de Condução" name="licenseNumber" value={formData.licenseNumber} placeholder="LA-123456" icon={CreditCard} error={errors.licenseNumber} onChange={handleInputChange} />
          <button onClick={handleNextStep} className="w-full rounded-2xl bg-foreground py-4 font-display font-bold text-background transition hover:opacity-90 active:scale-[0.98]">
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <h2 className="font-display text-2xl font-bold">Documentos Obrigatórios</h2>
          <p className="text-sm text-muted-foreground">Carregue PDF, JPG ou PNG (máx. 5MB)</p>

          {([
            { id: "bi-upload", field: "bilheteId" as DocField, label: "Bilhete de Identidade (BI)" },
            { id: "carta-upload", field: "cartaCondacao" as DocField, label: "Carta de Condução" },
          ]).map((doc) => (
            <div key={doc.field}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{doc.label}</span>
                <div className="mt-2 relative">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, doc.field)} className="hidden" id={doc.id} />
                  <label htmlFor={doc.id} className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                    files[doc.field] ? "border-success bg-success/5" : "border-border bg-card hover:border-foreground"
                  }`}>
                    {files[doc.field] ? (
                      <><Check className="h-5 w-5 text-success" /><span className="font-medium text-success truncate max-w-[200px]">{files[doc.field]?.name}</span></>
                    ) : (
                      <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">Clique para carregar</span></>
                    )}
                  </label>
                </div>
                {errors[doc.field] && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors[doc.field]}
                  </div>
                )}
              </label>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={handlePrevStep} className="flex-1 rounded-2xl border-2 border-border bg-card py-4 font-display font-bold transition hover:bg-muted active:scale-[0.98]">Voltar</button>
            <button onClick={handleNextStep} className="flex-1 rounded-2xl bg-foreground py-4 font-display font-bold text-background transition hover:opacity-90 active:scale-[0.98]">Continuar</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <h2 className="font-display text-2xl font-bold">Registo Criminal & Foto</h2>

          {([
            { id: "registo-upload", field: "registoCriminal" as DocField, label: "Registo Criminal", icon: Shield },
            { id: "foto-upload", field: "fotoPerfil" as DocField, label: "Foto de Perfil", icon: Camera },
          ]).map((doc) => (
            <div key={doc.field}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{doc.label}</span>
                <div className="mt-2 relative">
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, doc.field)} className="hidden" id={doc.id} />
                  <label htmlFor={doc.id} className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                    files[doc.field] ? "border-success bg-success/5" : "border-border bg-card hover:border-foreground"
                  }`}>
                    {files[doc.field] ? (
                      <><Check className="h-5 w-5 text-success" /><span className="font-medium text-success truncate max-w-[200px]">{files[doc.field]?.name}</span></>
                    ) : (
                      <><doc.icon className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">Clique para carregar</span></>
                    )}
                  </label>
                </div>
                {errors[doc.field] && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors[doc.field]}
                  </div>
                )}
              </label>
            </div>
          ))}

          <div className="rounded-2xl bg-muted p-4">
            <h3 className="font-display font-bold mb-3">Resumo da Candidatura</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nome:</span><span className="font-medium">{formData.fullName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span><span className="font-medium">{formData.phoneNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">BI:</span><span className="font-medium">{formData.biNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Carta:</span><span className="font-medium">{formData.licenseNumber}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handlePrevStep} className="flex-1 rounded-2xl border-2 border-border bg-card py-4 font-display font-bold transition hover:bg-muted active:scale-[0.98]">Voltar</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>) : (<><Check className="h-4 w-4" />Enviar Candidatura</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
