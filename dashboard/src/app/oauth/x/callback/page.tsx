"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { platforms } from "@/lib/api";
import { clearXPkce, getXPkce } from "@/lib/oauth-pkce";

function XCallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Baglaniyor...");

  useEffect(() => {
    const code = sp.get("code");
    const state = sp.get("state");
    const err = sp.get("error");
    const errDesc = sp.get("error_description");

    if (err) {
      setMsg(errDesc || err);
      clearXPkce();
      return;
    }
    if (!code || !state) {
      setMsg("OAuth yaniti eksik (code veya state).");
      return;
    }

    const pkce = getXPkce();
    if (!pkce?.codeVerifier) {
      setMsg("PKCE oturumu bulunamadi. Ayarlardan tekrar X ile baglanmayi deneyin.");
      return;
    }
    if (pkce.tenantKey !== state) {
      setMsg("OAuth state uyusmuyor. Tekrar deneyin.");
      clearXPkce();
      return;
    }

    const tenantKey = state;
    const redirectUri = `${window.location.origin}/oauth/x/callback`;

    let cancelled = false;
    platforms
      .xOAuthComplete({ tenantKey, code, codeVerifier: pkce.codeVerifier, redirectUri })
      .then(() => {
        if (cancelled) return;
        clearXPkce();
        setMsg("X baglandi. Yonlendiriliyorsunuz...");
        router.replace("/settings?oauth=x_ok");
      })
      .catch((e) => {
        if (cancelled) return;
        setMsg((e as Error).message);
        clearXPkce();
      });

    return () => {
      cancelled = true;
    };
  }, [sp, router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <p className="text-gray-700">{msg}</p>
    </div>
  );
}

export default function XOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <p className="text-gray-500">Yukleniyor...</p>
        </div>
      }
    >
      <XCallbackInner />
    </Suspense>
  );
}
