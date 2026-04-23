"use client";

import { useEffect, useState } from "react";
import { email } from "@/lib/api";
import { 
  Mail, 
  Send, 
  Shield, 
  Lock, 
  RefreshCw, 
  Save, 
  Inbox, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  User,
  ArrowRight
} from "lucide-react";

type SmtpForm = {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
};

type ImapForm = {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
};

export function SettingsEmailPanel(props: { tenantKey: string }) {
  const { tenantKey } = props;
  const [smtp, setSmtp] = useState<SmtpForm>({
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: "",
  });
  const [imap, setImap] = useState<ImapForm>({
    host: "",
    port: "993",
    secure: true,
    user: "",
    pass: "",
  });
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [hasSmtpPass, setHasSmtpPass] = useState(false);
  const [hasImapPass, setHasImapPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [inbox, setInbox] = useState<any[]>([]);
  const [selUid, setSelUid] = useState<number | null>(null);
  const [msgDetail, setMsgDetail] = useState<any>(null);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!tenantKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    email
      .settings(tenantKey)
      .then((d) => {
        const s = d.settings as any;
        const sm = s.smtp;
        const im = s.imap;
        if (sm) {
          setSmtp({
            host: sm.host || "",
            port: String(sm.port || 587),
            secure: Boolean(sm.secure),
            user: sm.user || "",
            pass: "",
          });
          setHasSmtpPass(Boolean(sm.hasPassword));
        }
        if (im) {
          setImap({
            host: im.host || "",
            port: String(im.port || 993),
            secure: im.secure !== false,
            user: im.user || "",
            pass: "",
          });
          setHasImapPass(Boolean(im.hasPassword));
        }
        setFromEmail((s.fromEmail as string) || "");
        setFromName((s.fromName as string) || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantKey]);

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        tenantKey,
        fromEmail: fromEmail.trim() || null,
        fromName: fromName.trim() || null,
      };
      if (smtp.host.trim()) {
        body.smtp = {
          host: smtp.host.trim(),
          port: Number(smtp.port) || 587,
          secure: smtp.secure,
          user: smtp.user.trim(),
          ...(smtp.pass.trim() ? { pass: smtp.pass.trim() } : {}),
        };
      }
      if (imap.host.trim()) {
        body.imap = {
          host: imap.host.trim(),
          port: Number(imap.port) || 993,
          secure: imap.secure,
          user: imap.user.trim(),
          ...(imap.pass.trim() ? { pass: imap.pass.trim() } : {}),
        };
      }
      await email.updateSettings(body);
      setSmtp((s) => ({ ...s, pass: "" }));
      setImap((s) => ({ ...s, pass: "" }));
      setHasSmtpPass(true);
      setHasImapPass(true);
      alert("E-posta ayarları başarıyla kaydedildi.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runTestSmtp() {
    try {
      const r = await email.testSmtp(tenantKey, testTo.trim() || undefined);
      alert(`Test gönderildi: ${r.sentTo}`);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function loadInbox() {
    try {
      const r = await email.inbox(tenantKey, 25);
      setInbox(r.items || []);
      setSelUid(null);
      setMsgDetail(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function openMessage(uid: number) {
    setSelUid(uid);
    try {
      const m = await email.message(tenantKey, uid);
      setMsgDetail(m);
      setReplyTo(m.from || "");
      setReplySubject(m.subject?.startsWith("Re:") ? m.subject : `Re: ${m.subject || ""}`);
      setReplyText("");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function sendReply() {
    if (!selUid || !replyTo.trim() || !replyText.trim()) return;
    try {
      await email.reply({
        tenantKey,
        to: replyTo.trim(),
        subject: replySubject || "Re:",
        text: replyText,
        inReplyTo: msgDetail?.messageId,
        references: msgDetail?.messageId,
      });
      alert("Yanıt gönderildi");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <p className="text-slate-500 font-bold text-sm">E-posta yapılandırması yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex gap-4">
        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 h-fit">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-indigo-900">E-posta Yapılandırması</h4>
          <p className="text-sm text-indigo-800/70 font-medium">
            SMTP üzerinden gönderim, IMAP üzerinden gelen kutusu okuma ve yanıtlama yapılmaktadır. 
            Gmail veya Outlook kullanıyorsanız "Uygulama Şifresi" kullanmanız önerilir.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Gönderen Adı" value={fromName} onChange={setFromName} icon={<User size={16}/>} />
        <InputField label="Gönderen E-posta (From)" value={fromEmail} onChange={setFromEmail} icon={<Mail size={16}/>} placeholder="örnek@firma.com" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* SMTP Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-1">
              <Send size={18} className="text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">SMTP Ayarları</h3>
           </div>
           <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4">
              <InputField label="Host" value={smtp.host} onChange={(v) => setSmtp(s => ({ ...s, host: v }))} placeholder="smtp.mailtrap.io" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Port" value={smtp.port} onChange={(v) => setSmtp(s => ({ ...s, port: v }))} placeholder="587" />
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Güvenlik</label>
                  <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 cursor-pointer hover:bg-slate-50 transition-all">
                    <input type="checkbox" checked={smtp.secure} onChange={(e) => setSmtp(s => ({ ...s, secure: e.target.checked }))} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/10" />
                    <span className="text-sm font-bold text-slate-700">SSL/TLS</span>
                  </label>
                </div>
              </div>
              <InputField label="Kullanıcı" value={smtp.user} onChange={(v) => setSmtp(s => ({ ...s, user: v }))} />
              <InputField label={`Şifre ${hasSmtpPass ? "(Kayıtlı)" : ""}`} value={smtp.pass} onChange={(v) => setSmtp(s => ({ ...s, pass: v }))} isPassword placeholder={hasSmtpPass ? "••••••••" : "Yeni şifre girin"} />
           </div>
        </div>

        {/* IMAP Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-1">
              <Inbox size={18} className="text-purple-500" />
              <h3 className="text-lg font-bold text-slate-800">IMAP Ayarları</h3>
           </div>
           <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4">
              <InputField label="Host" value={imap.host} onChange={(v) => setImap(s => ({ ...s, host: v }))} placeholder="imap.gmail.com" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Port" value={imap.port} onChange={(v) => setImap(s => ({ ...s, port: v }))} placeholder="993" />
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Güvenlik</label>
                  <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 cursor-pointer hover:bg-slate-50 transition-all">
                    <input type="checkbox" checked={imap.secure} onChange={(e) => setImap(s => ({ ...s, secure: e.target.checked }))} className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500/10" />
                    <span className="text-sm font-bold text-slate-700">SSL/TLS</span>
                  </label>
                </div>
              </div>
              <InputField label="Kullanıcı" value={imap.user} onChange={(v) => setImap(s => ({ ...s, user: v }))} />
              <InputField label={`Şifre ${hasImapPass ? "(Kayıtlı)" : ""}`} value={imap.pass} onChange={(v) => setImap(s => ({ ...s, pass: v }))} isPassword placeholder={hasImapPass ? "••••••••" : "Yeni şifre girin"} />
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
        <button
          onClick={save}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          Değişiklikleri Kaydet
        </button>
        
        <div className="flex-1 w-full relative group">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700"
            placeholder="Test alıcı e-posta adresi"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
        </div>

        <button
          onClick={runTestSmtp}
          className="w-full sm:w-auto px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
        >
          SMTP Test
        </button>
        
        <button 
          onClick={loadInbox} 
          className="w-full sm:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          Gelen Kutusunu Yükle
        </button>
      </div>

      {/* Inbox & Reply UI */}
      {inbox.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* Message List */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
               <Inbox size={16} className="text-slate-400" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mesaj Listesi</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
              {inbox.map((m) => (
                <button
                  key={m.uid}
                  onClick={() => openMessage(m.uid)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-all ${selUid === m.uid ? "bg-indigo-50/50 border-l-4 border-indigo-500" : ""}`}
                >
                  <p className="text-xs text-slate-400 font-bold mb-1 truncate">{m.from}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{m.subject || "(Konu Yok)"}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Content & Reply */}
          <div className="lg:col-span-2 space-y-6">
            {msgDetail ? (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                 <div className="space-y-2 pb-6 border-b border-slate-50">
                    <h3 className="text-xl font-bold text-slate-900">{msgDetail.subject || "(Konu Yok)"}</h3>
                    <p className="text-sm text-slate-500">Kimden: <span className="font-bold text-slate-700">{msgDetail.from}</span></p>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <ArrowRight size={16} className="text-indigo-500" />
                       <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Hızlı Yanıt</h4>
                    </div>
                    <div className="space-y-4">
                       <InputField label="Alıcı" value={replyTo} onChange={setReplyTo} />
                       <InputField label="Konu" value={replySubject} onChange={setReplySubject} />
                       <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 min-h-[150px]"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Yanıtınızı buraya yazın..."
                       />
                       <button
                        onClick={sendReply}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                       >
                        <Send size={18} />
                        Yanıtı Gönder
                       </button>
                    </div>
                 </div>

                 <details className="group">
                    <summary className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-2">
                       <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                       Ham Mesaj Önizleme
                    </summary>
                    <pre className="mt-4 p-4 bg-slate-900 text-slate-300 text-[10px] font-mono rounded-2xl max-h-40 overflow-auto whitespace-pre-wrap shadow-inner">
                      {msgDetail.rawPreview}
                    </pre>
                 </details>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-slate-300 space-y-4">
                 <Inbox size={48} />
                 <p className="font-bold">Görüntülemek için bir mesaj seçin</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, icon, placeholder, isPassword }: { label: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode, placeholder?: string, isPassword?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl ${icon ? 'pl-12' : 'px-6'} py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700`}
          placeholder={placeholder}
          autoComplete={isPassword ? "new-password" : "on"}
        />
      </div>
    </div>
  );
}
