"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { marketing } from "@/lib/api";

type Props = {
  tenantKey: string;
};

export function GoogleAdsManagementPanel({ tenantKey }: Props) {
  const [audit, setAudit] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [changeSets, setChangeSets] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const pmaxCampaigns = useMemo(
    () => (audit?.campaigns ?? []).filter((c: any) => c.channelType === "PERFORMANCE_MAX"),
    [audit]
  );

  async function loadAudit() {
    if (!tenantKey) return;
    setBusy("audit");
    try {
      const data = await marketing.googleAdsAudit(tenantKey);
      setAudit(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadRecommendations() {
    if (!tenantKey) return;
    setBusy("recommendations");
    try {
      const data = await marketing.googleAdsRecommendations(tenantKey);
      setRecommendations(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadChangeSets() {
    if (!tenantKey) return;
    try {
      const data = await marketing.googleAdsChangeSets(tenantKey);
      setChangeSets(data.items ?? []);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function createVistaSeedsPlan() {
    setBusy("plan");
    try {
      await marketing.createVistaSeedsPlan(tenantKey);
      await loadChangeSets();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function validateChangeSet(uuid: string) {
    setBusy(`validate:${uuid}`);
    try {
      await marketing.validateGoogleAdsChangeSet(uuid);
      await loadChangeSets();
    } catch (err) {
      alert((err as Error).message);
      await loadChangeSets();
    } finally {
      setBusy(null);
    }
  }

  async function applyChangeSet(uuid: string) {
    const ok = window.confirm("Onaylanan Google Ads değişikliği canlı hesaba uygulanacak.");
    if (!ok) return;
    setBusy(`apply:${uuid}`);
    try {
      await marketing.applyGoogleAdsChangeSet(uuid);
      await loadChangeSets();
      await loadAudit();
    } catch (err) {
      alert((err as Error).message);
      await loadChangeSets();
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    loadChangeSets();
  }, [tenantKey]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Google Ads Yönetimi</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audit · Öneri · Change-set</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton onClick={loadAudit} active={busy === "audit"} icon={<Gauge size={16} />} label="Audit" />
            <ActionButton
              onClick={loadRecommendations}
              active={busy === "recommendations"}
              icon={<Sparkles size={16} />}
              label="Öneriler"
            />
            <ActionButton
              onClick={createVistaSeedsPlan}
              active={busy === "plan"}
              icon={<FilePlus2 size={16} />}
              label="VistaSeeds Taslağı"
              primary
            />
          </div>
        </div>

        <div className="p-8 space-y-8">
          {audit?.error && <InlineError text={audit.error} />}
          {audit?.configured === false && <InlineError text={audit.message} />}

          {pmaxCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {pmaxCampaigns.map((campaign: any) => (
                <CampaignAuditCard key={campaign.resourceName ?? campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Gauge size={30} />} text="Performance Max audit verisi yok" />
          )}

          {recommendations?.error && <InlineError text={recommendations.error} />}
          {(recommendations?.recommendations ?? []).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Google Önerileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.recommendations.slice(0, 8).map((r: any) => (
                  <div key={r.resourceName} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{r.type}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-1">{r.campaign || r.resourceName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Değişiklik Taslakları</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validate · Apply</p>
            </div>
          </div>
          <button
            onClick={loadChangeSets}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            aria-label="Yenile"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 space-y-4">
          {changeSets.length > 0 ? (
            changeSets.map((item) => (
              <ChangeSetRow
                key={item.uuid}
                item={item}
                busy={busy}
                onValidate={() => validateChangeSet(item.uuid)}
                onApply={() => applyChangeSet(item.uuid)}
              />
            ))
          ) : (
            <EmptyState icon={<ClipboardList size={30} />} text="Kayıtlı taslak yok" />
          )}
        </div>
      </section>
    </div>
  );
}

function CampaignAuditCard({ campaign }: { campaign: any }) {
  const issues = campaign.audit?.issues ?? [];
  const recs = campaign.audit?.recommendations ?? [];
  const budget = campaign.budget?.amountMicros ? Number(campaign.budget.amountMicros) / 1_000_000 : null;

  return (
    <div className="border border-slate-100 bg-slate-50 rounded-[24px] p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 truncate">{campaign.name}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">#{campaign.id} · {campaign.status}</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
          PMax
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniMetric label="Tıklama" value={campaign.metrics?.clicks ?? 0} />
        <MiniMetric label="Gösterim" value={campaign.metrics?.impressions ?? 0} />
        <MiniMetric label="Bütçe" value={budget ? `₺${budget.toFixed(0)}` : "-"} />
      </div>

      <div className="space-y-3">
        {(campaign.assetGroups ?? []).map((group: any) => (
          <div key={group.resourceName} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{group.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{group.adStrength || "Ad strength yok"}</p>
              </div>
              <ShieldCheck size={18} className={issues.length ? "text-amber-500" : "text-emerald-500"} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <AssetCount label="Başlık" value={group.counts?.HEADLINE ?? 0} />
              <AssetCount label="Uzun" value={group.counts?.LONG_HEADLINE ?? 0} />
              <AssetCount label="Açıklama" value={group.counts?.DESCRIPTION ?? 0} />
              <AssetCount label="Görsel" value={(group.counts?.MARKETING_IMAGE ?? 0) + (group.counts?.SQUARE_MARKETING_IMAGE ?? 0)} />
            </div>
          </div>
        ))}
      </div>

      {(issues.length > 0 || recs.length > 0) && (
        <div className="space-y-2">
          {[...issues, ...recs].slice(0, 5).map((text, index) => (
            <div key={`${text}-${index}`} className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
              <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeSetRow(props: {
  item: any;
  busy: string | null;
  onValidate: () => void;
  onApply: () => void;
}) {
  const { item, busy, onValidate, onApply } = props;
  const payload = item.payload ?? {};
  const texts = payload.textAssets ?? {};
  const validating = busy === `validate:${item.uuid}`;
  const applying = busy === `apply:${item.uuid}`;

  return (
    <div className="border border-slate-100 bg-slate-50 rounded-[24px] p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={item.status} />
            <span className="text-[10px] font-bold text-slate-400">{item.source}</span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">{item.campaignName || item.campaignId || item.uuid}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onValidate}
            disabled={validating || applying || item.status === "applied"}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs disabled:opacity-50"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Validate
          </button>
          <button
            onClick={onApply}
            disabled={validating || applying || item.status !== "validated"}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs disabled:opacity-50"
          >
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PreviewList title="Başlıklar" rows={texts.headlines ?? []} />
        <PreviewList title="Uzun Başlıklar" rows={texts.longHeadlines ?? []} />
        <PreviewList title="Açıklamalar" rows={texts.descriptions ?? []} />
      </div>

      {(payload.imageChecklist ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            <ImageIcon size={13} /> Görsel Checklist
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {payload.imageChecklist.map((row: string) => (
              <div key={row} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{row}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton(props: {
  onClick: () => void;
  active: boolean;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.active}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-xs disabled:opacity-60 ${
        props.primary
          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10 hover:bg-amber-600"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
      }`}
    >
      {props.active ? <Loader2 size={16} className="animate-spin" /> : props.icon}
      {props.label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3">
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-sm font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function AssetCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function PreviewList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-h-[120px]">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map((row) => (
          <p key={row} className="text-[11px] font-semibold text-slate-700 leading-snug">
            {row}
          </p>
        ))}
        {rows.length > 5 && <p className="text-[10px] text-slate-400 font-bold">+{rows.length - 5}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    validated: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    validation_failed: "bg-rose-50 text-rose-700 border border-rose-100",
    applied: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    failed: "bg-rose-50 text-rose-700 border border-rose-100",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

function InlineError({ text }: { text: string }) {
  return (
    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
      <AlertCircle size={16} />
      {text}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
      {icon}
      <p className="text-xs font-bold mt-2">{text}</p>
    </div>
  );
}
