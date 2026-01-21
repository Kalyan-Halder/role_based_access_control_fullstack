import { google } from "googleapis";

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is missing in config.env`);
  return v;
}

const CLIENT_ID = mustEnv("CLIENT_ID");
const CLIENT_SECRET = mustEnv("CLIENT_SECRET");
const REDIRECT_URL = mustEnv("REDIRECT_URL");
const REFRESH_TOKEN = mustEnv("REFRESH_TOKEN");
const OAUTH_USER = mustEnv("OAUTH_USER");  

function cleanEmail(input: any) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\r\n]/g, "");  
}

function isValidEmail(email: string) {
  // simple check (not fancy)
  return /^\S+@\S+\.\S+$/.test(email);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function base64url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendOAuthEmail(toRaw: string, subject: string, html: string) {
  const to = cleanEmail(toRaw);
  const from = cleanEmail(OAUTH_USER);

  if (!isValidEmail(to)) throw new Error("Invalid Email Field (To)");
  if (!isValidEmail(from)) throw new Error("Invalid Email Field (From/OAUTH_USER)");

   
  await oAuth2Client.getAccessToken();

  const rawMessage =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `\r\n` +
    html;

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: base64url(rawMessage) },
  });

  return result.data;
}

export async function sendInviteEmail(to: string, inviteUrl: string, role: string, expiresAt: Date) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>You have been invited</h2>
      <p>You were invited as <b>${role}</b>.</p>
      <p>Click this link to register:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p style="color:#666;font-size:12px;">Expires at: ${expiresAt.toISOString()}</p>
    </div>
  `;

  return sendOAuthEmail(to, "Invite to register", html);
}
