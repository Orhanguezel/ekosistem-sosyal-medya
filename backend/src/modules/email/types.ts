export type EmailConn = {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass?: string;
};

export type TenantEmailSettings = {
  smtp?: EmailConn;
  imap?: EmailConn;
  fromEmail?: string;
  fromName?: string;
};
