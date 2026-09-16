declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GOOGLE_SERVICE_ACCOUNT_JSON?: string;
    GOOGLE_SCHEDULE_SHEET_ID?: string;
    GOOGLE_SCHEDULE_SHEET_GID?: string;
  }
}
