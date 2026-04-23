export type MarketingJsonBacklinks = {
  rows: Array<{ url: string; sourceDomain?: string; title?: string }>;
  updatedAt?: string;
  source?: "manual" | "import";
};

export type MarketingJsonShape = {
  branding?: Record<string, unknown>;
  backlinks?: MarketingJsonBacklinks;
  notes?: string;
  backlinksEnriched?: {
    provider: "dataforseo";
    fetchedAt: string;
    data: unknown;
  };
};
