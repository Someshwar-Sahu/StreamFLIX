export type UserRole = "viewer" | "uploader" | "admin";

export interface Account {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface Profile {
  id: number;
  account_id: number;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface ProfileSelectResponse {
  access_token: string;
  token_type: string;
}

export type ContentType = "movie" | "series";

export interface DiscoverItem {
  id: number;
  type: ContentType;
  title: string;
  description?: string | null;
  poster_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  net_likes?: number;
  view_count?: number;
}

export interface TrendingResponse {
  movies: DiscoverItem[];
  series: DiscoverItem[];
  overall: DiscoverItem[];
}

export interface LatestResponse {
  movies: DiscoverItem[];
  series: DiscoverItem[];
  overall: DiscoverItem[];
}

export interface Category {
  id: number;
  name: string;
}

export interface ContentVariant {
  id: number;
  resolution: string;
  hls_path: string;
  bitrate?: number | null;
}

export interface Episode {
  id: number;
  season_id: number;
  episode_number: number;
  title: string;
  description?: string | null;
  content_id: number;
  content?: DiscoverItem | null;
}

export interface Season {
  id: number;
  series_id: number;
  season_number: number;
  title?: string | null;
  episodes: Episode[];
}

export interface SeriesDetails {
  id: number;
  title: string;
  description?: string | null;
  poster_url?: string | null;
  categories: Category[];
  seasons: Season[];
  user_rating?: "like" | "dislike" | null;
  is_in_watchlist?: boolean;
}

export interface ContentDetails {
  id: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  status: "uploading" | "processing" | "ready" | "failed";
  categories: Category[];
  variants: ContentVariant[];
  user_rating?: "like" | "dislike" | null;
  is_in_watchlist?: boolean;
  resume_progress_seconds?: number | null;
}

export interface WatchHistoryItem {
  id: number;
  profile_id: number;
  content_id: number;
  progress_seconds: number;
  last_watched_at: string;
  content?: DiscoverItem | null;
}

export interface WatchlistItem {
  id: number;
  profile_id: number;
  content_id?: number | null;
  series_id?: number | null;
  created_at: string;
  content?: DiscoverItem | null;
  series?: DiscoverItem | null;
}

export interface RatingItem {
  id: number;
  profile_id: number;
  content_id?: number | null;
  series_id?: number | null;
  rating: "like" | "dislike";
  created_at: string;
}

export interface UserAdminView {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface StorageItemDetail {
  content_id: number;
  title: string;
  size_bytes: number;
}

export interface AdminStorageResponse {
  total_bytes: number;
  items: StorageItemDetail[];
  raw_leftover_bytes: number;
}