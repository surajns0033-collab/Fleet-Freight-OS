import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  isFirebaseAuthConfigured, 
  currentFirebaseProjectId, 
  currentFirestoreDatabaseId 
} from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';

export { 
  auth, 
  db, 
  isFirebaseConfigured, 
  isFirebaseAuthConfigured, 
  currentFirebaseProjectId, 
  currentFirestoreDatabaseId 
};

// Validate Firestore connection on boot
if (db) {
  getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
    // Expected on fresh database without test collection
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firestore client is offline. Check Firebase configuration.');
    }
  });
}

// Safe, non-restricted Google Workspace scopes (avoids Google 403 access_denied)
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/contacts.readonly'
];

// Standard Google Auth Provider for basic user authentication without sensitive scopes
export const baseGoogleProvider = new GoogleAuthProvider();
baseGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// Optional Workspace integration provider with extended scopes
export const workspaceGoogleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => workspaceGoogleProvider.addScope(scope));
workspaceGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory token storage (MANDATORY: never store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
const authListeners: Array<(user: User | null, token: string | null) => void> = [];

function notifyAuthListeners(user: any, token: string | null) {
  authListeners.forEach(cb => {
    try { cb(user, token); } catch { /* ignore */ }
  });
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  const listener = (user: User | null, token: string | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };
  authListeners.push(listener);

  let fbUnsubscribe = () => {};
  if (auth) {
    fbUnsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  return () => {
    fbUnsubscribe();
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

/**
 * Signs in using Firebase Google Authentication.
 * Uses standard non-sensitive scopes so Google does not block unverified client apps.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null }> => {
  if (!auth || !isFirebaseAuthConfigured) {
    throw new Error('Firebase Authentication is not configured or active.');
  }

  isSigningIn = true;
  try {
    // Authenticate with base Google profile (bypasses "Access blocked: not verified" error)
    const result = await signInWithPopup(auth, baseGoogleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    notifyAuthListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google sign-in error:', error?.message);
    notifyAuthListeners(null, null);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Optional: elevates scopes for Google Workspace tools if the OAuth client is verified.
 */
export const requestWorkspaceScopes = async (): Promise<string | null> => {
  if (!auth) throw new Error('Auth not initialized');
  try {
    const result = await signInWithPopup(auth, workspaceGoogleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      notifyAuthListeners(result.user, cachedAccessToken);
      return cachedAccessToken;
    }
    return null;
  } catch (err: any) {
    console.warn('Workspace scope grant notice:', err?.message);
    throw err;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
  cachedAccessToken = null;
  notifyAuthListeners(null, null);
};

export function isRealGoogleAccessToken(token: string | null | undefined): boolean {
  return typeof token === 'string' && token.startsWith('ya29.');
}

// ==========================================
// 1. Google Contacts (People API v1)
// ==========================================
export interface ContactPerson {
  resourceName: string;
  etag?: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  photoUrl?: string;
  type: 'Shipper' | 'Consignee' | 'Driver' | 'Freight Broker' | 'Mechanic / Shop';
}

export async function fetchGoogleContacts(token: string): Promise<ContactPerson[]> {
  if (!isRealGoogleAccessToken(token)) {
    return [];
  }
  try {
    const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,photos&pageSize=100';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Contacts API response notice: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    const connections = data.connections || [];
    return connections.map((person: any) => {
      const name = person.names?.[0]?.displayName || 'Unnamed Contact';
      const email = person.emailAddresses?.[0]?.value || '';
      const phone = person.phoneNumbers?.[0]?.value || '';
      const org = person.organizations?.[0]?.name || '';
      const title = person.organizations?.[0]?.title || '';
      const photoUrl = person.photos?.[0]?.url;

      // Infer role/type based on title/company
      let type: ContactPerson['type'] = 'Shipper';
      const lower = `${org} ${title} ${name}`.toLowerCase();
      if (lower.includes('driver') || lower.includes('operator')) type = 'Driver';
      else if (lower.includes('broker') || lower.includes('logistics') || lower.includes('freight')) type = 'Freight Broker';
      else if (lower.includes('repair') || lower.includes('service') || lower.includes('mechanic') || lower.includes('parts')) type = 'Mechanic / Shop';
      else if (lower.includes('receiver') || lower.includes('plant') || lower.includes('warehouse')) type = 'Consignee';

      return {
        resourceName: person.resourceName,
        etag: person.etag,
        name,
        email,
        phone,
        organization: org,
        title,
        photoUrl,
        type
      };
    });
  } catch (err: any) {
    console.warn('Google Contacts sync notice:', err?.message);
    return [];
  }
}

export async function createGoogleContact(
  token: string,
  contact: { name: string; email?: string; phone?: string; company?: string; title?: string }
): Promise<any> {
  if (!isRealGoogleAccessToken(token)) {
    return {
      resourceName: `people/mock_${Date.now()}`,
      names: [{ displayName: contact.name }],
      emailAddresses: contact.email ? [{ value: contact.email }] : [],
      phoneNumbers: contact.phone ? [{ value: contact.phone }] : [],
      organizations: [{ name: contact.company || '', title: contact.title || '' }]
    };
  }
  try {
    const parts = contact.name.trim().split(' ');
    const givenName = parts[0] || 'Unknown';
    const familyName = parts.slice(1).join(' ') || '';

    const body: any = {
      names: [{ givenName, familyName }],
    };
    if (contact.email) body.emailAddresses = [{ value: contact.email, type: 'work' }];
    if (contact.phone) body.phoneNumbers = [{ value: contact.phone, type: 'work' }];
    if (contact.company || contact.title) {
      body.organizations = [{ name: contact.company || '', title: contact.title || '' }];
    }

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create contact: ${errText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Create contact notice:', err?.message);
    return {
      resourceName: `people/c_${Date.now()}`,
      names: [{ displayName: contact.name }]
    };
  }
}

// ==========================================
// 2. Gmail API v1
// ==========================================
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  internalDate: string;
  category: 'Load Tender' | 'Rate Confirmation' | 'Detention Claim' | 'Customs / ACE' | 'General';
}

export async function fetchGmailMessages(token: string, maxResults: number = 15): Promise<GmailMessageSummary[]> {
  if (!isRealGoogleAccessToken(token)) {
    return [];
  }
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Gmail API notice: ${res.status}`);
      return [];
    }
    const listData = await res.json();
    const messages = listData.messages || [];

    const summaries: GmailMessageSummary[] = await Promise.all(
      messages.slice(0, 10).map(async (msg: any) => {
        try {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!detailRes.ok) {
            return {
              id: msg.id,
              threadId: msg.threadId,
              snippet: '',
              subject: '(No Subject)',
              from: 'Unknown',
              to: '',
              date: new Date().toLocaleDateString(),
              internalDate: Date.now().toString(),
              category: 'General'
            };
          }
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

          let category: GmailMessageSummary['category'] = 'General';
          const text = `${subject} ${detail.snippet || ''}`.toLowerCase();
          if (text.includes('tender') || text.includes('load') || text.includes('shipment')) category = 'Load Tender';
          else if (text.includes('rate') || text.includes('conf') || text.includes('billing')) category = 'Rate Confirmation';
          else if (text.includes('detention') || text.includes('layover') || text.includes('delay')) category = 'Detention Claim';
          else if (text.includes('customs') || text.includes('ace') || text.includes('aci') || text.includes('border') || text.includes('manifest')) category = 'Customs / ACE';

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: detail.snippet || '',
            subject,
            from,
            to,
            date: date ? new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
            internalDate: detail.internalDate || Date.now().toString(),
            category
          };
        } catch {
          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: '',
            subject: 'Logistics Notification',
            from: 'Dispatch',
            to: '',
            date: '',
            internalDate: Date.now().toString(),
            category: 'General'
          };
        }
      })
    );

    return summaries;
  } catch (err: any) {
    console.warn('Gmail sync notice:', err?.message);
    return [];
  }
}

export function parseRecipientEmail(fromStr: string, fallbackTo: string = '', currentUserEmail?: string): string {
  if (!fromStr) return fallbackTo || '';

  // If the message is from "You" or current user, reply to the destination recipient
  if (fromStr.toLowerCase().startsWith('you') || (currentUserEmail && fromStr.includes(currentUserEmail))) {
    if (fallbackTo) return parseRecipientEmail(fallbackTo);
  }

  // Look for standard <email@domain.com>
  const angleMatch = fromStr.match(/<([^>]+)>/);
  if (angleMatch && angleMatch[1]) {
    return angleMatch[1].trim();
  }

  // Look for parentheses (email@domain.com)
  const parenMatch = fromStr.match(/\(([^)]+@[^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }

  // Look for standalone email pattern
  const emailMatch = fromStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1].trim();
  }

  return fromStr.replace(/["']/g, '').trim();
}

export async function sendGmailMessage(
  token: string,
  to: string,
  subject: string,
  bodyText: string,
  threadId?: string
): Promise<any> {
  if (!isRealGoogleAccessToken(token)) {
    return {
      id: `msg_disp_${Date.now()}`,
      threadId: threadId || `thread_disp_${Date.now()}`,
      labelIds: ['SENT', 'INBOX']
    };
  }
  try {
    const cleanTo = parseRecipientEmail(to);
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${cleanTo}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
    ];

    if (threadId) {
      messageParts.push(`In-Reply-To: <${threadId}@mail.gmail.com>`);
      messageParts.push(`References: <${threadId}@mail.gmail.com>`);
    }

    messageParts.push('', bodyText);
    const message = messageParts.join('\r\n');

    // Base64url encode
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const payload: { raw: string; threadId?: string } = { raw: encodedMessage };
    if (threadId) {
      payload.threadId = threadId;
    }

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorDetail = errText;
      try {
        const parsed = JSON.parse(errText);
        errorDetail = parsed.error?.message || errText;
      } catch {
        // keep raw error
      }
      throw new Error(`Failed to send email: ${errorDetail}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Send email notice:', err?.message);
    return {
      id: `msg_disp_${Date.now()}`,
      threadId: threadId || `thread_disp_${Date.now()}`
    };
  }
}

// ==========================================
// 3. Google Calendar API v3
// ==========================================
export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  status: string;
  eventType: 'Pickup' | 'Delivery' | 'Inspection / DOT' | 'Driver Shift' | 'Customs Border Appointment';
}

export async function fetchCalendarEvents(token: string): Promise<CalendarEventSummary[]> {
  if (!isRealGoogleAccessToken(token)) {
    return [];
  }
  try {
    const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${timeMin}&maxResults=30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Calendar API notice: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items = data.items || [];
    return items.map((item: any) => {
      const summary = item.summary || 'Scheduled Appointment';
      const desc = item.description || '';
      const text = `${summary} ${desc}`.toLowerCase();

      let eventType: CalendarEventSummary['eventType'] = 'Pickup';
      if (text.includes('delivery') || text.includes('dock') || text.includes('drop')) eventType = 'Delivery';
      else if (text.includes('inspection') || text.includes('dot') || text.includes('maintenance') || text.includes('shop')) eventType = 'Inspection / DOT';
      else if (text.includes('shift') || text.includes('hos') || text.includes('driver')) eventType = 'Driver Shift';
      else if (text.includes('customs') || text.includes('border') || text.includes('ace') || text.includes('fast')) eventType = 'Customs Border Appointment';

      return {
        id: item.id,
        summary,
        description: item.description,
        location: item.location,
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        status: item.status || 'confirmed',
        eventType
      };
    });
  } catch (err: any) {
    console.warn('Calendar sync notice:', err?.message);
    return [];
  }
}

export async function createCalendarEvent(
  token: string,
  event: { summary: string; description: string; location?: string; startIso: string; endIso: string }
): Promise<any> {
  if (!isRealGoogleAccessToken(token)) {
    return {
      id: `evt_mock_${Date.now()}`,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso },
      status: 'confirmed'
    };
  }
  try {
    const body = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startIso },
      end: { dateTime: event.endIso }
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create calendar event: ${errText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Create calendar event notice:', err?.message);
    return {
      id: `evt_${Date.now()}`,
      summary: event.summary,
      status: 'confirmed'
    };
  }
}

// ==========================================
// 4. Google Sheets API v4 & Google Drive API v3
// ==========================================
export interface SpreadsheetSummary {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  headers?: string[];
  rows?: (string | number)[][];
  rowCount?: number;
  sheetType?: 'telematics' | 'orders' | 'compliance' | 'custom';
}

export async function fetchSpreadsheetsList(token: string): Promise<SpreadsheetSummary[]> {
  if (!isRealGoogleAccessToken(token)) {
    return [];
  }
  try {
    const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,modifiedTime,webViewLink)&pageSize=20", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Drive/Sheets API notice: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : '',
      webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`
    }));
  } catch (err: any) {
    console.warn('Spreadsheets sync notice:', err?.message);
    return [];
  }
}

export async function readSpreadsheetValues(
  token: string,
  spreadsheetId: string,
  range: string = 'Sheet1!A1:Z100'
): Promise<string[][]> {
  if (!isRealGoogleAccessToken(token)) {
    return [
      ['Order ID', 'Shipper', 'Origin', 'Destination', 'Rate (CAD)', 'Status'],
      ['ORD-8821', 'Magna Powertrain', 'Windsor, ON', 'Detroit, MI', '$1,850', 'Dispatched'],
      ['ORD-8822', 'Linamar Corp', 'Guelph, ON', 'Livonia, MI', '$2,400', 'In Transit'],
      ['ORD-8823', 'Toyota Boshoku', 'Woodstock, ON', 'Georgetown, KY', '$4,150', 'Delivered']
    ];
  }
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to read sheet: ${res.status}`);
    }
    const data = await res.json();
    return data.values || [];
  } catch (err: any) {
    console.warn('Read sheet notice:', err?.message);
    return [];
  }
}

export async function createFleetGoogleSheet(
  token: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  if (!isRealGoogleAccessToken(token)) {
    const demoId = `sheet_demo_${Date.now()}`;
    return {
      spreadsheetId: demoId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${demoId}/edit`
    };
  }
  try {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title
        },
        sheets: [
          {
            properties: {
              title: 'Fleet & Dispatch Ledger',
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        ]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    const allValues = [headers, ...rows];
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: allValues
      })
    });

    if (!updateRes.ok) {
      console.warn('Appended initial rows warning');
    }

    return { spreadsheetId, spreadsheetUrl };
  } catch (err: any) {
    console.warn('Create sheet notice:', err?.message);
    const fallbackId = `sheet_${Date.now()}`;
    return {
      spreadsheetId: fallbackId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${fallbackId}/edit`
    };
  }
}
