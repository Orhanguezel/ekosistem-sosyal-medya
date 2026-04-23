"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { platforms } from "@/lib/api";
import { clearLinkedInTenant, getLinkedInTenant } from "@/lib/oauth-pkce";

function LinkedInCallbackInner() {
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
      clearLinkedInTenant();
      return;
    }
    if (!code || !state) {
      setMsg("OAuth yaniti eksik (code veya state).");
      return;
    }

    const expected = getLinkedInTenant();
    if (expected && expected !== state) {
      setMsg("OAuth state uyusmuyor. Tekrar deneyin.");
      clearLinkedInTenant();
      return;
    }

    const tenantKey = state;
    const redirectUri = `${window.location.origin}/oauth/linkedin/callback`;

    let cancelled = false;
    platforms
      .linkedinOAuthComplete({ tenantKey, code, redirectUri })
      .then(() => {
        if (cancelled) return;
        clearLinkedInTenant();
        setMsg("LinkedIn baglandi. Yonlendiriliyorsunuz...");
        router.replace("/settings?oauth=linkedin_ok");
      })
      .catch((e) => {
        if (cancelled) return;
        setMsg((e as Error).message);
        clearLinkedInTenant();
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

export default function LinkedInOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <p className="text-gray-500">Yukleniyor...</p>
        </div>
      }
    >
      <LinkedInCallbackInner />
    </Suspense>
  );
}
