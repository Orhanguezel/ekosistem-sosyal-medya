// Post tipleri
export type PostType =
  | "haber"
  | "etkilesim"
  | "ilan"
  | "nostalji"
  | "tanitim"
  | "kampanya";

export type Platform = "facebook" | "instagram" | "both";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "posted"
  | "failed"
  | "cancelled";

export type SourceType = "manual" | "news" | "ai" | "template";

export type TimeSlot = "morning" | "afternoon" | "evening";

export type CalendarStatus =
  | "planned"
  | "content_ready"
  | "scheduled"
  | "published"
  | "skipped";

// API Response tipleri
export interface SocialPost {
  id: number;
  uuid: string;
  postType: PostType;
  title: string | null;
  caption: string;
  hashtags: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  platform: Platform;
  scheduledAt: string | null;
  postedAt: string | null;
  status: PostStatus;
  sourceType: SourceType;
  createdAt: string;
}

export interface ContentTemplate {
  id: number;
  uuid: string;
  name: string;
  postType: PostType;
  platform: Platform;
  captionTemplate: string;
  hashtags: string | null;
  variables: string[];
  isActive: number;
  usageCount: number;
}

export interface CalendarEntry {
  id: number;
  uuid: string;
  date: string;
  timeSlot: TimeSlot;
  postType: PostType;
  platform: Platform;
  status: CalendarStatus;
  postId: number | null;
  templateId: number | null;
  notes: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostAnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
}
