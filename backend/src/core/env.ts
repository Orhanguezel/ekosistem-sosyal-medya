import 'dotenv/config';

const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toInt(process.env.PORT, 8089),

  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'ekosistem_sosyal',
  },

  JWT_SECRET: process.env.JWT_SECRET || 'ekosistem-sosyal-medya-dev-secret',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3035',

  // Ekosistem API kaynakları (Artık social_projects tablosundan dinamik olarak yönetiliyor)

  // Facebook
  FB_APP_ID: process.env.FB_APP_ID || '',
  FB_APP_SECRET: process.env.FB_APP_SECRET || '',
  FB_PAGE_ID: process.env.FB_PAGE_ID || '',
  FB_PAGE_ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN || '',

  // Instagram
  IG_ACCOUNT_ID: process.env.IG_ACCOUNT_ID || '',
  IG_ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN || '',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7044964180',

  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
  LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || '',

  // X OAuth
  X_CLIENT_ID: process.env.X_CLIENT_ID || '',
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET || '',
  X_REDIRECT_URI: process.env.X_REDIRECT_URI || '',

  // AI
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  TIMEZONE: process.env.TIMEZONE || 'Europe/Istanbul',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Storage
  STORAGE_DRIVER: (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase() as 'local' | 'cloudinary',
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',

  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:8089',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3035',

  /** Google Cloud service account JSON (Search Console / Ads okuma — tek satir veya dosya yolu) */
  GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',

  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID || '',
  GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
  GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  GOOGLE_ADS_API_VERSION: process.env.GOOGLE_ADS_API_VERSION || 'v22',

  DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN || '',
  DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD || '',

  /** Instagram test postu icin varsayilan gorsel URL (tenant ayarlaninca kullanilir) */
  IG_TEST_IMAGE_URL: process.env.IG_TEST_IMAGE_URL || '',
} as const;

export type AppEnv = typeof env;
