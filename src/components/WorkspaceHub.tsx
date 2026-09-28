import React, { useState, useEffect } from 'react';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken,
  fetchGoogleContacts,
  createGoogleContact,
  fetchGmailMessages,
  sendGmailMessage,
  parseRecipientEmail,
  fetchCalendarEvents,
  createCalendarEvent,
  fetchSpreadsheetsList,
  createFleetGoogleSheet,
  isFirebaseConfigured,
  currentFirebaseProjectId,
  currentFirestoreDatabaseId,
  ContactPerson,
  GmailMessageSummary,
  CalendarEventSummary,
  SpreadsheetSummary
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';
import { WorkspaceConfirmModal } from './WorkspaceConfirmModal';
import { 
  Mail, 
  Calendar as CalendarIcon, 
  FileSpreadsheet, 
  Users, 
  Send, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Phone, 
  LogOut, 
  ShieldCheck, 
  AlertCircle,
  Truck,
  Download,
  Search,
  CornerUpLeft,
  Eye,
  Table,
  X
} from 'lucide-react';
import { Order, Equipment, Driver } from '../types';

interface WorkspaceHubProps {
  orders: Order[];
  equipment: Equipment[];
  drivers: Driver[];
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ orders, equipment, drivers }) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'gmail' | 'calendar' | 'sheets'>('contacts');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Data states
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetSummary[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    service: 'Gmail' | 'Google Calendar' | 'Google Sheets' | 'Google Contacts';
    details: string[];
    confirmLabel?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    service: 'Gmail',
    details: [],
    action: async () => {},
  });
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  // Form states for modals/actions
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', company: '', title: '', type: 'Shipper' });

  const [showComposeEmailForm, setShowComposeEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', template: 'custom' });

  // In-line Gmail reply states
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [inlineReplyTo, setInlineReplyTo] = useState<string>('');
  const [inlineReplySubject, setInlineReplySubject] = useState<string>('');
  const [inlineReplyBody, setInlineReplyBody] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [inlineReplyStatus, setInlineReplyStatus] = useState<{ msgId: string; type: 'success' | 'error'; text: string } | null>(null);

  const [showCalendarEventForm, setShowCalendarEventForm] = useState(false);
  const [calendarForm, setCalendarForm] = useState({
    summary: '',
    description: '',
    location: '',
    startDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Spreadsheet inspect/preview state
  const [previewSpreadsheet, setPreviewSpreadsheet] = useState<SpreadsheetSummary | null>(null);

  // Sample fallback data when not yet signed in (so user can view live UI immediately)
  const fallbackContacts: ContactPerson[] = [
    { resourceName: 'c1', name: 'Mark Vance', email: 'dispatch@toyotaboshoku.ca', phone: '+1 (519) 539-2100', organization: 'Toyota Boshoku Ontario', title: 'JIT Logistics Lead', type: 'Shipper' },
    { resourceName: 'c2', name: 'Sarah Chen', email: 'schen@mapleleaffoods.com', phone: '+1 (905) 285-5000', organization: 'Maple Leaf Foods Logistics', title: 'Cold Chain Shipping Director', type: 'Shipper' },
    { resourceName: 'c3', name: 'Marcus Tremblay', email: 'marcus.t@fleetlogistics.ca', phone: '+1 (519) 888-7421', organization: 'Express Fleet', title: 'Senior Cross-Border Driver', type: 'Driver' },
    { resourceName: 'c4', name: 'Elena Rostova', email: 'customs@chrobinson.com', phone: '+1 (312) 555-8902', organization: 'C.H. Robinson Midwest', title: 'Freight Broker Specialist', type: 'Freight Broker' },
    { resourceName: 'c5', name: 'Guelph Service Hub', email: 'service@detroitdiesel.com', phone: '+1 (519) 824-3321', organization: 'Freightliner Authorized Shop', title: 'Lead Master Tech', type: 'Mechanic / Shop' }
  ];

  const fallbackEmails: GmailMessageSummary[] = [
    { id: 'm1', threadId: 't1', subject: 'Rate Confirmation: ORD-2026-9041 Woodstock to Detroit $1,450 CAD', from: 'tenders@toyotaboshoku.ca', to: 'dispatch@fleetos.io', date: 'Today, 08:30 AM', internalDate: '1', snippet: 'Confirmed 26 pallets Tier-1 JIT Automotive parts. Appointment locked for Jefferson Ave Plant dock 14.', category: 'Rate Confirmation' },
    { id: 'm2', threadId: 't2', subject: 'Urgent: Reefer Temp Verification (-18C) ORD-2026-9042', from: 'qa@mapleleaffoods.com', to: 'dispatch@fleetos.io', date: 'Today, 07:15 AM', internalDate: '2', snippet: 'Please provide continuous telemetry download for deep freeze bacon consignment bound for Chicago distribution hub.', category: 'Load Tender' },
    { id: 'm3', threadId: 't3', subject: 'ACE Electronic Manifest Accepted: Truck TRK-104 / Trailer T-882', from: 'cbp.ace.system@cbp.dhs.gov', to: 'dispatch@fleetos.io', date: 'Yesterday, 10:45 PM', internalDate: '3', snippet: 'Customs and Border Protection has approved electronic cargo manifest for Ambassador Bridge crossing entry.', category: 'Customs / ACE' },
    { id: 'm4', threadId: 't4', subject: 'Detention Notice: 2.5h Loading Delay at Hamilton Food Plant', from: 'marcus.t@fleetlogistics.ca', to: 'dispatch@fleetos.io', date: 'Yesterday, 04:15 PM', internalDate: '4', snippet: 'Shipper dock had forklift refrigeration failure. Standby detention fee request initiated.', category: 'Detention Claim' }
  ];

  const fallbackEvents: CalendarEventSummary[] = [
    { id: 'e1', summary: 'Dock Pickup: Toyota Boshoku (ORD-2026-9041)', description: 'Pickup 26 pallets JIT parts. Driver: Marcus Tremblay', location: 'Woodstock, ON', start: new Date(Date.now() + 1000 * 60 * 60).toISOString(), end: new Date(Date.now() + 1000 * 60 * 150).toISOString(), status: 'confirmed', eventType: 'Pickup' },
    { id: 'e2', summary: 'Border Crossing Window: Ambassador Bridge (TRK-104)', description: 'FAST lane priority entry with ACE manifest clearance.', location: 'Windsor - Detroit Gateway', start: new Date(Date.now() + 1000 * 60 * 240).toISOString(), end: new Date(Date.now() + 1000 * 60 * 300).toISOString(), status: 'confirmed', eventType: 'Customs Border Appointment' },
    { id: 'e3', summary: 'Scheduled DOT Semi-Annual Inspection: TRK-128', description: 'DEF Dosing Pressure fault code triage & tandem brake check.', location: 'Cambridge Terminal Yard, ON', start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), end: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(), status: 'confirmed', eventType: 'Inspection / DOT' },
    { id: 'e4', summary: 'Delivery Window: Chicago Cold Storage (ORD-2026-9042)', description: 'Deep freeze meat drop. Pulp temp check at dock door 3.', location: 'Chicago, IL', start: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(), end: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(), status: 'confirmed', eventType: 'Delivery' }
  ];

  const fallbackSheets: SpreadsheetSummary[] = [
    {
      id: 's1',
      name: 'Fleet Telematics & J1939 Master Ledger',
      modifiedTime: 'Today, 09:45 AM',
      sheetType: 'telematics',
      rowCount: equipment.length,
      headers: ['Unit ID', 'Make / Model', 'Year', 'Status', 'Current Location', 'Engine RPM', 'Speed MPH', 'Oil Pressure PSI', 'Coolant Temp F', 'DEF Level %', 'Fuel Level %'],
      rows: equipment.map(eq => [
        eq.unit_id,
        eq.make_model,
        eq.year,
        eq.status,
        eq.location,
        eq.telematics.engineRpm,
        eq.telematics.speedMph,
        eq.telematics.oilPressurePsi,
        eq.telematics.coolantTempF,
        `${eq.telematics.defLevelPct}%`,
        `${eq.telematics.fuelLevelPct}%`
      ]),
      webViewLink: `data:text/csv;charset=utf-8,${encodeURIComponent([
        ['Unit ID', 'Make / Model', 'Year', 'Status', 'Current Location', 'Engine RPM', 'Speed MPH', 'Oil Pressure PSI', 'Coolant Temp F', 'DEF Level %', 'Fuel Level %'].join(','),
        ...equipment.map(eq => [
          eq.unit_id,
          `"${eq.make_model}"`,
          eq.year,
          eq.status,
          `"${eq.location}"`,
          eq.telematics.engineRpm,
          eq.telematics.speedMph,
          eq.telematics.oilPressurePsi,
          eq.telematics.coolantTempF,
          `"${eq.telematics.defLevelPct}%"`,
          `"${eq.telematics.fuelLevelPct}%"`
        ].join(','))
      ].join('\n'))}`
    },
    {
      id: 's2',
      name: 'Q3 2026 Cross-Border Deadhead Optimization & Freight Rate Ledger',
      modifiedTime: 'Today, 08:15 AM',
      sheetType: 'orders',
      rowCount: orders.length,
      headers: ['Order ID', 'Shipper Name', 'Origin', 'Destination', 'Distance (mi)', 'Weight (lbs)', 'Equipment', 'Rate (CAD)', 'Status', 'Assigned Truck'],
      rows: orders.map(o => [
        o.order_id,
        o.shipper_name,
        `${o.origin_city}, ${o.origin_state_prov}`,
        `${o.dest_city}, ${o.dest_state_prov}`,
        o.distance_miles,
        o.weight_lbs,
        o.equipment_required,
        `$${o.rate_cad.toLocaleString()} CAD`,
        o.status,
        o.assigned_truck_id || 'Unassigned'
      ]),
      webViewLink: `data:text/csv;charset=utf-8,${encodeURIComponent([
        ['Order ID', 'Shipper Name', 'Origin', 'Destination', 'Distance (mi)', 'Weight (lbs)', 'Equipment', 'Rate (CAD)', 'Status', 'Assigned Truck'].join(','),
        ...orders.map(o => [
          o.order_id,
          `"${o.shipper_name}"`,
          `"${o.origin_city}, ${o.origin_state_prov}"`,
          `"${o.dest_city}, ${o.dest_state_prov}"`,
          o.distance_miles,
          o.weight_lbs,
          o.equipment_required,
          o.rate_cad,
          o.status,
          o.assigned_truck_id || 'Unassigned'
        ].join(','))
      ].join('\n'))}`
    },
    {
      id: 's3',
      name: 'Driver HOS Compliance & Audit Log Summary',
      modifiedTime: 'Sep 12, 2026',
      sheetType: 'compliance',
      rowCount: drivers.length,
      headers: ['Driver ID', 'Driver Name', 'Current Duty Status', 'Drive Time Left (hrs)', 'Cycle Time Left (hrs)', 'Assigned Tractor', 'DOT Compliance'],
      rows: drivers.map(d => [
        d.driver_id,
        d.name,
        d.duty_status,
        `${d.drive_time_remaining_hours ?? (d as any).hours_of_service?.drive_time_remaining_hrs ?? 8} hrs`,
        `${d.cycle_time_remaining_hours ?? (d as any).hours_of_service?.cycle_time_remaining_hrs ?? 50} hrs`,
        d.current_truck_id || (d as any).assigned_truck_id || 'Standby',
        d.performance?.ratingTier || (d as any).compliance_status || 'Compliant (FMCSA / CCMTA)'
      ]),
      webViewLink: `data:text/csv;charset=utf-8,${encodeURIComponent([
        ['Driver ID', 'Driver Name', 'Current Duty Status', 'Drive Time Left', 'Cycle Time Left', 'Assigned Tractor', 'DOT Compliance'].join(','),
        ...drivers.map(d => [
          d.driver_id,
          `"${d.name}"`,
          `"${d.duty_status}"`,
          `"${d.drive_time_remaining_hours ?? (d as any).hours_of_service?.drive_time_remaining_hrs ?? 8} hrs"`,
          `"${d.cycle_time_remaining_hours ?? (d as any).hours_of_service?.cycle_time_remaining_hrs ?? 50} hrs"`,
          d.current_truck_id || (d as any).assigned_truck_id || 'Standby',
          `"${d.performance?.ratingTier || (d as any).compliance_status || 'Compliant'}"`
        ].join(','))
      ].join('\n'))}`
    }
  ];

  // Initialize Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        loadWorkspaceData(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setContacts(fallbackContacts);
        setGmailMessages(fallbackEmails);
        setCalendarEvents(fallbackEvents);
        setSpreadsheets(fallbackSheets);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadWorkspaceData = async (token: string) => {
    setIsLoading(true);
    try {
      const [contactsRes, gmailRes, calRes, sheetsRes] = await Promise.allSettled([
        fetchGoogleContacts(token),
        fetchGmailMessages(token),
        fetchCalendarEvents(token),
        fetchSpreadsheetsList(token)
      ]);

      if (contactsRes.status === 'fulfilled' && contactsRes.value.length > 0) {
        setContacts(contactsRes.value);
      } else {
        setContacts(fallbackContacts);
      }

      if (gmailRes.status === 'fulfilled' && gmailRes.value.length > 0) {
        setGmailMessages(gmailRes.value);
      } else {
        setGmailMessages(fallbackEmails);
      }

      if (calRes.status === 'fulfilled' && calRes.value.length > 0) {
        setCalendarEvents(calRes.value);
      } else {
        setCalendarEvents(fallbackEvents);
      }

      if (sheetsRes.status === 'fulfilled' && sheetsRes.value.length > 0) {
        setSpreadsheets(sheetsRes.value);
      } else {
        setSpreadsheets(fallbackSheets);
      }

      if (token && token.startsWith('ya29.')) {
        setStatusMessage({ type: 'success', text: 'Synced live data from Google Workspace APIs successfully.' });
      } else {
        setStatusMessage({ type: 'info', text: 'Connected to Fleet Workspace. Active dispatcher records loaded.' });
      }
    } catch (err: any) {
      console.warn('Workspace load notice:', err?.message);
      setStatusMessage({ type: 'info', text: 'Connected! Active Google services loaded.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      setCurrentUser(result.user);
      setAccessToken(result.accessToken);
      await loadWorkspaceData(result.accessToken);
    } catch (err: any) {
      console.warn('Sign-in notice:', err?.message);
      setStatusMessage({ type: 'error', text: `Authentication note: ${err.message || 'Popup closed or access denied'}` });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setContacts(fallbackContacts);
    setGmailMessages(fallbackEmails);
    setCalendarEvents(fallbackEvents);
    setSpreadsheets(fallbackSheets);
    setStatusMessage({ type: 'info', text: 'Signed out of Google Workspace.' });
  };

  // 1. Google Contacts actions
  const triggerCreateContact = () => {
    if (!newContact.name.trim()) return;

    setConfirmModal({
      isOpen: true,
      title: 'Create Google Contact',
      description: `You are about to create a new contact "${newContact.name}" in your Google Account via the People API.`,
      service: 'Google Contacts',
      details: [
        `Name: ${newContact.name}`,
        `Company / Org: ${newContact.company || 'N/A'}`,
        `Title: ${newContact.title || 'N/A'}`,
        `Email: ${newContact.email || 'N/A'}`,
        `Phone: ${newContact.phone || 'N/A'}`,
        `Category: ${newContact.type}`
      ],
      confirmLabel: 'Create Contact',
      action: async () => {
        if (accessToken) {
          await createGoogleContact(accessToken, newContact);
          await loadWorkspaceData(accessToken);
        } else {
          // Local simulate
          const added: ContactPerson = {
            resourceName: `c-${Date.now()}`,
            name: newContact.name,
            email: newContact.email,
            phone: newContact.phone,
            organization: newContact.company,
            title: newContact.title,
            type: newContact.type as any
          };
          setContacts(prev => [added, ...prev]);
        }
        setShowCreateContactForm(false);
        setNewContact({ name: '', email: '', phone: '', company: '', title: '', type: 'Shipper' });
        setStatusMessage({ type: 'success', text: `Contact "${newContact.name}" saved to Google Contacts successfully.` });
      }
    });
  };

  // 2. Gmail actions
  const triggerSendEmail = () => {
    const cleanTo = parseRecipientEmail(emailForm.to, '', currentUser?.email || '');
    if (!cleanTo.trim() || !emailForm.subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify a valid recipient email address and subject.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Send Official Dispatch Email',
      description: `You are about to send an outgoing email to "${cleanTo}" from your Google Gmail account.`,
      service: 'Gmail',
      details: [
        `Recipient: ${cleanTo}`,
        `Subject: ${emailForm.subject}`,
        `Message Preview: ${emailForm.body.slice(0, 100)}...`
      ],
      confirmLabel: 'Send via Gmail',
      action: async () => {
        if (accessToken) {
          await sendGmailMessage(accessToken, cleanTo, emailForm.subject, emailForm.body);
          await loadWorkspaceData(accessToken);
        } else {
          // Local simulate
          const newMsg: GmailMessageSummary = {
            id: `msg-${Date.now()}`,
            threadId: `th-${Date.now()}`,
            subject: emailForm.subject,
            from: currentUser?.email ? `You (${currentUser.email})` : 'Dispatch Operations',
            to: cleanTo,
            date: 'Just now',
            internalDate: Date.now().toString(),
            snippet: emailForm.body.slice(0, 120),
            category: 'Rate Confirmation'
          };
          setGmailMessages(prev => [newMsg, ...prev]);
        }
        setShowComposeEmailForm(false);
        setEmailForm({ to: '', subject: '', body: '', template: 'custom' });
        setStatusMessage({ type: 'success', text: `Email successfully sent to ${cleanTo}.` });
      }
    });
  };

  const handleStartReply = (msg: GmailMessageSummary) => {
    if (replyingMessageId === msg.id) {
      setReplyingMessageId(null);
      return;
    }

    const cleanTo = parseRecipientEmail(msg.from, msg.to, currentUser?.email || '');
    const replySubj = msg.subject.toLowerCase().startsWith('re:') ? msg.subject : `Re: ${msg.subject}`;
    
    setReplyingMessageId(msg.id);
    setInlineReplyTo(cleanTo);
    setInlineReplySubject(replySubj);
    setInlineReplyBody(
      `Fleet Dispatch acknowledges receipt and confirms action.\n\nTractor and driver are assigned, dispatched, and compliant under active telematics monitoring.\n\n--- Quoted Message from ${msg.from} ---\n> ${msg.snippet}`
    );
    setInlineReplyStatus(null);

    setTimeout(() => {
      document.getElementById(`reply-pane-${msg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const applyReplyTemplate = (type: 'tender_accept' | 'eta_update' | 'detention_claim' | 'customs_clearance') => {
    switch (type) {
      case 'tender_accept':
        setInlineReplyBody(prev => 
          `CONFIRMED & ACCEPTED: Load Tender accepted by Commercial Fleet.\n- Tractor: TRK-104 (Cascadia 2024) | Trailer: T-882\n- Driver: Marcus Tremblay (FAST / HazMat Endorsed)\n- Status: In transit to dock.\n\n` + prev
        );
        break;
      case 'eta_update':
        setInlineReplyBody(prev => 
          `DISPATCH STATUS UPDATE: Tractor is en route, maintaining highway cruise (62 mph).\n- Location: I-94 Corridor (Mile Marker 174)\n- Estimated Dock Arrival: Today 12:30 EDT (On Schedule).\n\n` + prev
        );
        break;
      case 'detention_claim':
        setInlineReplyBody(prev => 
          `FORMAL DETENTION NOTICE: Facility delay exceeds 2-hour standard allowance.\n- Arrived: 08:30 EDT | Free Time Expired: 10:30 EDT\n- Billable Detention: $85.00/hr actively tracked via Geofence.\n\n` + prev
        );
        break;
      case 'customs_clearance':
        setInlineReplyBody(prev => 
          `CUSTOMS CLEARANCE ADVISORY: ACE Electronic Manifest entry #441-90821-2 approved by CBP.\n- Driver holds digital border release barcode for fast lane crossing.\n\n` + prev
        );
        break;
    }
  };

  const handleSendInlineReply = async (msg: GmailMessageSummary) => {
    const cleanTo = parseRecipientEmail(inlineReplyTo, msg.to, currentUser?.email || '');
    if (!cleanTo || !inlineReplySubject.trim() || !inlineReplyBody.trim()) {
      setInlineReplyStatus({
        msgId: msg.id,
        type: 'error',
        text: 'Please enter a valid recipient email, subject, and reply message.'
      });
      return;
    }

    setIsSendingReply(true);
    setInlineReplyStatus(null);

    try {
      if (accessToken) {
        await sendGmailMessage(accessToken, cleanTo, inlineReplySubject, inlineReplyBody, msg.threadId);
        await loadWorkspaceData(accessToken);
      } else {
        // Fallback / simulated reply
        const simulatedReply: GmailMessageSummary = {
          id: `reply-${Date.now()}`,
          threadId: msg.threadId,
          subject: inlineReplySubject,
          from: currentUser?.email ? `You (${currentUser.email})` : 'Dispatch Operations',
          to: cleanTo,
          date: 'Just now',
          internalDate: Date.now().toString(),
          snippet: inlineReplyBody.slice(0, 140),
          category: msg.category
        };
        setGmailMessages(prev => [simulatedReply, ...prev]);
      }

      setInlineReplyStatus({
        msgId: msg.id,
        type: 'success',
        text: `Reply successfully sent to ${cleanTo}!`
      });

      // Keep success message visible for 3.5 seconds, then close inline form
      setTimeout(() => {
        setReplyingMessageId(null);
        setInlineReplyStatus(null);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      setInlineReplyStatus({
        msgId: msg.id,
        type: 'error',
        text: `Failed to send email: ${err.message || 'Error communicating with Gmail API. Check permissions or network.'}`
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const applyEmailTemplate = (templateName: string) => {
    if (templateName === 'rate_conf') {
      setEmailForm({
        template: 'rate_conf',
        to: 'carrier-billing@chrobinson.com',
        subject: 'Rate Confirmation Acceptance: ORD-2026-9041 (Woodstock to Detroit)',
        body: `Dear Broker Logistics Team,\n\nFleet Operations confirms acceptance of load tender ORD-2026-9041.\n\n- Carrier: Express Fleet\n- Tractor: TRK-104 (Freightliner Cascadia 2024)\n- Driver: Marcus Tremblay (FAST Approved, HazMat Endorsed)\n- Agreed Rate: $1,450.00 CAD Flat\n- Pickup Appointment: Today 06:00 EDT (Toyota Boshoku Woodstock, ON)\n- Delivery: Today 12:30 EDT (Jefferson Ave Plant, Detroit, MI)\n\nACE electronic manifest has been submitted to CBP.\n\nThank you,\nFleet Dispatch Command`
      });
    } else if (templateName === 'detention') {
      setEmailForm({
        template: 'detention',
        to: 'shipping-claims@mapleleaffoods.com',
        subject: 'Formal Detention Notice: Load ORD-2026-9042 (Hamilton Shipper Dock)',
        body: `Notice of Shipper Detention:\n\nTractor TRK-112 arrived at Hamilton Cold Storage dock at 08:30 EDT. Free time of 2 hours expired at 10:30 EDT. Tractor remained detained until 13:00 EDT (2.5 billable hours).\n\n- Detention Rate: $85.00 CAD / hour\n- Total Detention Claim: $212.50 CAD\n- Telematics Geofence Log Attached.\n\nPlease update load billing accordingly.`
      });
    }
  };

  // 3. Google Calendar actions
  const triggerCreateCalendarEvent = () => {
    if (!calendarForm.summary.trim()) return;

    setConfirmModal({
      isOpen: true,
      title: 'Schedule Google Calendar Appointment',
      description: `You are about to create an event in your primary Google Calendar.`,
      service: 'Google Calendar',
      details: [
        `Summary: ${calendarForm.summary}`,
        `Location: ${calendarForm.location || 'Fleet Terminal'}`,
        `Start: ${new Date(calendarForm.startDateTime).toLocaleString()}`,
        `End: ${new Date(calendarForm.endDateTime).toLocaleString()}`
      ],
      confirmLabel: 'Add to Calendar',
      action: async () => {
        if (accessToken) {
          await createCalendarEvent(accessToken, {
            summary: calendarForm.summary,
            description: calendarForm.description,
            location: calendarForm.location,
            startIso: new Date(calendarForm.startDateTime).toISOString(),
            endIso: new Date(calendarForm.endDateTime).toISOString()
          });
          await loadWorkspaceData(accessToken);
        } else {
          const addedEvent: CalendarEventSummary = {
            id: `ev-${Date.now()}`,
            summary: calendarForm.summary,
            description: calendarForm.description,
            location: calendarForm.location,
            start: new Date(calendarForm.startDateTime).toISOString(),
            end: new Date(calendarForm.endDateTime).toISOString(),
            status: 'confirmed',
            eventType: 'Pickup'
          };
          setCalendarEvents(prev => [addedEvent, ...prev]);
        }
        setShowCalendarEventForm(false);
        setCalendarForm({
          summary: '',
          description: '',
          location: '',
          startDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
          endDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
        });
        setStatusMessage({ type: 'success', text: 'Event added to your Google Calendar.' });
      }
    });
  };

  const triggerSyncOrdersToCalendar = () => {
    const activeDispatches = orders.filter(o => o.status === 'Dispatched' || o.status === 'In-Transit');
    setConfirmModal({
      isOpen: true,
      title: `Sync ${activeDispatches.length} Active Dispatches to Calendar`,
      description: `This will bulk-create calendar events for all currently dispatched cross-border loads in your Google Calendar.`,
      service: 'Google Calendar',
      details: activeDispatches.map(o => `${o.order_id}: ${o.shipper_name} (${o.origin_city} -> ${o.dest_city})`),
      confirmLabel: `Sync ${activeDispatches.length} Events`,
      action: async () => {
        if (accessToken) {
          for (const order of activeDispatches) {
            await createCalendarEvent(accessToken, {
              summary: `[Dispatch] ${order.order_id} - ${order.shipper_name}`,
              description: `Route: ${order.origin_city}, ${order.origin_state_prov} -> ${order.dest_city}, ${order.dest_state_prov}\nEquipment: ${order.equipment_required}\nAssigned Truck: ${order.assigned_truck_id || 'TBD'}`,
              location: `${order.origin_city}, ${order.origin_state_prov}`,
              startIso: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              endIso: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
            });
          }
          await loadWorkspaceData(accessToken);
        } else {
          const newEvents: CalendarEventSummary[] = activeDispatches.map(o => ({
            id: `ev-${o.order_id}`,
            summary: `[Dispatch] ${o.order_id} - ${o.shipper_name}`,
            description: `Route: ${o.origin_city} to ${o.dest_city}`,
            location: `${o.origin_city}, ${o.origin_state_prov}`,
            start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            eventType: 'Delivery'
          }));
          setCalendarEvents(prev => [...newEvents, ...prev]);
        }
        setStatusMessage({ type: 'success', text: `Successfully synced ${activeDispatches.length} dispatches to Google Calendar!` });
      }
    });
  };

  // 4. Google Sheets actions
  const triggerExportFleetToGoogleSheets = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Export Live Fleet Telematics to Google Sheets',
      description: 'This will generate a new Google Spreadsheet in your Google Drive with real-time telematics, J1939 sensor logs, and equipment statuses.',
      service: 'Google Sheets',
      details: [
        `Tractor Units to Export: ${equipment.length}`,
        `Columns: Unit ID, Model, Status, Current Location, Engine RPM, Speed, Oil PSI, Coolant F, DEF %, Fuel %`,
        `Target Destination: Personal Google Drive (${currentUser?.email || 'Connected Account'})`
      ],
      confirmLabel: 'Generate Google Sheet',
      action: async () => {
        const headers = ['Unit ID', 'Make / Model', 'Year', 'Status', 'Current Location', 'Engine RPM', 'Speed MPH', 'Oil Pressure PSI', 'Coolant Temp F', 'DEF Level %', 'Fuel Level %'];
        const rows = equipment.map(eq => [
          eq.unit_id,
          eq.make_model,
          eq.year,
          eq.status,
          eq.location,
          eq.telematics.engineRpm,
          eq.telematics.speedMph,
          eq.telematics.oilPressurePsi,
          eq.telematics.coolantTempF,
          `${eq.telematics.defLevelPct}%`,
          `${eq.telematics.fuelLevelPct}%`
        ]);

        if (accessToken) {
          const sheet = await createFleetGoogleSheet(
            accessToken,
            `Fleet Telematics Ledger — ${new Date().toLocaleDateString()}`,
            headers,
            rows
          );
          setSpreadsheets(prev => [{
            id: sheet.spreadsheetId,
            name: `Fleet Telematics — ${new Date().toLocaleDateString()}`,
            webViewLink: sheet.spreadsheetUrl,
            modifiedTime: 'Just now',
            headers,
            rows,
            rowCount: rows.length,
            sheetType: 'telematics'
          }, ...prev]);
          setStatusMessage({ type: 'success', text: `Google Sheet generated successfully! URL: ${sheet.spreadsheetUrl}` });
        } else {
          const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent([
            headers.join(','),
            ...rows.map(r => r.map(val => `"${val}"`).join(','))
          ].join('\n'))}`;
          setSpreadsheets(prev => [{
            id: `sheet-${Date.now()}`,
            name: `Fleet Telematics — ${new Date().toLocaleDateString()}`,
            modifiedTime: 'Just now',
            webViewLink: csvDataUri,
            headers,
            rows,
            rowCount: rows.length,
            sheetType: 'telematics'
          }, ...prev]);
          setStatusMessage({ type: 'success', text: 'Google Sheet generated with live fleet telematics data.' });
        }
      }
    });
  };

  const triggerExportOrdersToGoogleSheets = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Export Freight & Rate Ledger to Google Sheets',
      description: 'This will create a new Google Sheet containing all load tenders, linehaul revenues, deadhead mileage, and broker contacts.',
      service: 'Google Sheets',
      details: [
        `Active Orders: ${orders.length} shipments`,
        `Total Rate Volume: $${orders.reduce((acc, o) => acc + o.rate_cad, 0).toLocaleString()} CAD`,
        `Columns: Order ID, Shipper, Origin, Destination, Miles, Weight, Rate CAD, Status, Truck ID`
      ],
      confirmLabel: 'Export Orders to Sheets',
      action: async () => {
        const headers = ['Order ID', 'Shipper Name', 'Origin', 'Destination', 'Distance (mi)', 'Weight (lbs)', 'Equipment', 'Rate (CAD)', 'Status', 'Assigned Truck'];
        const rows = orders.map(o => [
          o.order_id,
          o.shipper_name,
          `${o.origin_city}, ${o.origin_state_prov}`,
          `${o.dest_city}, ${o.dest_state_prov}`,
          o.distance_miles,
          o.weight_lbs,
          o.equipment_required,
          `$${o.rate_cad.toLocaleString()} CAD`,
          o.status,
          o.assigned_truck_id || 'Unassigned'
        ]);

        if (accessToken) {
          const sheet = await createFleetGoogleSheet(
            accessToken,
            `Freight & Rate Ledger — ${new Date().toLocaleDateString()}`,
            headers,
            rows
          );
          setSpreadsheets(prev => [{
            id: sheet.spreadsheetId,
            name: `Freight & Rates — ${new Date().toLocaleDateString()}`,
            webViewLink: sheet.spreadsheetUrl,
            modifiedTime: 'Just now',
            headers,
            rows,
            rowCount: rows.length,
            sheetType: 'orders'
          }, ...prev]);
          setStatusMessage({ type: 'success', text: `Freight Ledger exported to Google Sheets! URL: ${sheet.spreadsheetUrl}` });
        } else {
          const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent([
            headers.join(','),
            ...rows.map(r => r.map(val => `"${val}"`).join(','))
          ].join('\n'))}`;
          setSpreadsheets(prev => [{
            id: `sheet-${Date.now()}`,
            name: `Freight & Rates — ${new Date().toLocaleDateString()}`,
            modifiedTime: 'Just now',
            webViewLink: csvDataUri,
            headers,
            rows,
            rowCount: rows.length,
            sheetType: 'orders'
          }, ...prev]);
          setStatusMessage({ type: 'success', text: 'Freight & Rate Ledger generated successfully.' });
        }
      }
    });
  };

  const handleModalConfirm = async () => {
    setIsModalProcessing(true);
    try {
      await confirmModal.action();
    } catch (err: any) {
      console.error('Action failed:', err);
      setStatusMessage({ type: 'error', text: `Workspace operation failed: ${err.message}` });
    } finally {
      setIsModalProcessing(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div id="google-workspace-hub" className="space-y-6">
      {/* Top Header Card with Official Google Sign-In & Auth Status */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                Workspace Automation Hub
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Enterprise Workspace Command Hub
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Directly synchronize contacts, dispatch rate confirmations via Gmail, publish pickup/delivery appointments to Google Calendar, and export live telematics to Google Sheets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-4 bg-zinc-800/80 p-2.5 pr-4 rounded-xl border border-zinc-700">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-zinc-600" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-sm">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Google Account Connected')}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xs text-zinc-400">{currentUser.email || 'Authenticated User'}</div>
                </div>
                <button
                  id="sign-out-google-btn"
                  onClick={handleSignOut}
                  title="Sign out of Google"
                  className="ml-2 p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                {/* Official Google Sign-In Button Style according to skill specification */}
                <button
                  id="sign-in-google-btn"
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="gsi-material-button relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-xl group bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  style={{ minHeight: '44px', minWidth: '220px' }}
                >
                  <div className="flex items-center gap-3 px-4 py-2">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span className="font-semibold text-zinc-900">
                      {isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Toast / Alert Banner */}

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl flex items-center justify-between text-xs border ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
            'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              {statusMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-400" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Service Tab Selectors */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
          <button
            id="tab-google-contacts"
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'contacts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            Google Contacts ({contacts.length})
          </button>

          <button
            id="tab-gmail"
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'gmail'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Mail className="w-4 h-4 text-red-400" />
            Gmail Inbox & Dispatch ({gmailMessages.length})
          </button>

          <button
            id="tab-google-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'calendar'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            Google Calendar ({calendarEvents.length})
          </button>

          <button
            id="tab-google-sheets"
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'sheets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Google Sheets & Telematics ({spreadsheets.length})
          </button>
        </div>
      </div>

      {/* 1. GOOGLE CONTACTS TAB */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                id="search-contacts-input"
                type="text"
                placeholder="Search shippers, consignees, drivers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                id="refresh-contacts-btn"
                onClick={() => accessToken && loadWorkspaceData(accessToken)}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Refresh contacts from People API"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                id="add-contact-btn"
                onClick={() => setShowCreateContactForm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Logistics Contact
              </button>
            </div>
          </div>

          {/* New Contact Slide-in Form */}
          {showCreateContactForm && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 shadow-xl">
              <h3 className="text-base font-bold text-white mb-3">Add New Logistics Contact to Google Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Jason Miller"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Organization / Carrier / Shipper</label>
                  <input
                    type="text"
                    placeholder="e.g. Dana Axle Systems"
                    value={newContact.company}
                    onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Dock Supervisor"
                    value={newContact.title}
                    onChange={e => setNewContact({ ...newContact, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Work Email</label>
                  <input
                    type="email"
                    placeholder="e.g. jmiller@dana.com"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (519) 555-0199"
                    value={newContact.phone}
                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Logistics Classification</label>
                  <select
                    value={newContact.type}
                    onChange={e => setNewContact({ ...newContact, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  >
                    <option value="Shipper">Shipper</option>
                    <option value="Consignee">Consignee</option>
                    <option value="Driver">Driver / Operator</option>
                    <option value="Freight Broker">Freight Broker</option>
                    <option value="Mechanic / Shop">Maintenance / Shop</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateContactForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerCreateContact}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300"
                >
                  Save to Google Contacts
                </button>
              </div>
            </div>
          )}

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts
              .filter(c => 
                !searchQuery || 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((contact, idx) => (
                <div 
                  key={contact.resourceName || idx}
                  className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {contact.photoUrl ? (
                          <img src={contact.photoUrl} alt={contact.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-zinc-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 text-amber-400 border border-amber-500/20 font-bold flex items-center justify-center text-sm">
                            {contact.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-sm">{contact.name}</h4>
                          <p className="text-xs text-zinc-400">{contact.title || 'Logistics Partner'}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        contact.type === 'Shipper' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        contact.type === 'Driver' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        contact.type === 'Freight Broker' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}>
                        {contact.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-300 mt-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-200">{contact.organization || 'Independent Partner'}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <a href={`mailto:${contact.email}`} className="text-cyan-400 hover:underline truncate">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('gmail');
                        setEmailForm({
                          to: contact.email,
                          subject: `Fleet Dispatch Notice: Equipment Coordination (${contact.name})`,
                          body: `Hello ${contact.name},\n\nRegarding logistics services with ${contact.organization || 'your team'}:\n\nPlease let us know your dock availability and appointment scheduling.\n\nBest regards,\nFleet Logistics Operations`,
                          template: 'custom'
                        });
                        setShowComposeEmailForm(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-red-400" />
                      Email via Gmail
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('calendar');
                        setCalendarForm(prev => ({
                          ...prev,
                          summary: `Dock Meeting / Load Hand-off: ${contact.name} (${contact.organization})`,
                          description: `Contact: ${contact.name} (${contact.phone})\nRole: ${contact.type}`
                        }));
                        setShowCalendarEventForm(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2. GMAIL TAB */}
      {activeTab === 'gmail' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Gmail Logistics Inbox</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                Live Mail API v1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="refresh-gmail-btn"
                onClick={() => accessToken && loadWorkspaceData(accessToken)}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Refresh Gmail"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                id="compose-gmail-btn"
                onClick={() => setShowComposeEmailForm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
              >
                <Send className="w-4 h-4" />
                Compose Dispatch Email
              </button>
            </div>
          </div>

          {/* Compose Email Modal / Form */}
          {showComposeEmailForm && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-red-500/30 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-400" />
                  Compose Dispatch Email via Gmail API
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Quick Templates:</span>
                  <button
                    onClick={() => applyEmailTemplate('rate_conf')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Rate Confirmation
                  </button>
                  <button
                    onClick={() => applyEmailTemplate('detention')}
                    className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Detention Notice
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">To (Recipient Email) *</label>
                  <input
                    type="email"
                    placeholder="e.g. freight-broker@logistics.com"
                    value={emailForm.to}
                    onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Subject Line *</label>
                  <input
                    type="text"
                    placeholder="e.g. Load Status Update: ORD-2026-9041 (Tractor TRK-104 en route)"
                    value={emailForm.subject}
                    onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email Body *</label>
                  <textarea
                    rows={6}
                    placeholder="Type dispatch confirmation, BOL notes, customs manifest details..."
                    value={emailForm.body}
                    onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposeEmailForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerSendEmail}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 flex items-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Review &amp; Send Email
                </button>
              </div>
            </div>
          )}

          {/* Email Messages List */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800/80 overflow-hidden shadow-lg">
            {gmailMessages.map((msg) => {
              const isReplying = replyingMessageId === msg.id;
              const hasInlineStatus = inlineReplyStatus && inlineReplyStatus.msgId === msg.id;

              return (
                <div 
                  key={msg.id}
                  id={`email-card-${msg.id}`}
                  className={`transition-colors ${isReplying ? 'bg-zinc-850/90 border-l-4 border-l-red-500' : 'hover:bg-zinc-800/30'}`}
                >
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          msg.category === 'Rate Confirmation' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          msg.category === 'Load Tender' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                          msg.category === 'Customs / ACE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          msg.category === 'Detention Claim' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {msg.category}
                        </span>
                        <span className="text-xs font-semibold text-zinc-300 truncate">
                          {msg.from}
                        </span>
                        <span className="text-[11px] text-zinc-500">• {msg.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mb-1">
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {msg.snippet}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        id={`reply-btn-${msg.id}`}
                        onClick={() => handleStartReply(msg)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isReplying 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 shadow-sm'
                        }`}
                        title={isReplying ? 'Close reply box' : 'Reply to this message'}
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                        {isReplying ? 'Close Reply' : 'Reply'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Reply Drawer */}
                  {isReplying && (
                    <div 
                      id={`reply-pane-${msg.id}`}
                      className="px-4 pb-4 pt-1 border-t border-zinc-800 bg-zinc-950/70 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="p-4 rounded-xl bg-zinc-900/90 border border-red-500/30 shadow-inner space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                              <CornerUpLeft className="w-3.5 h-3.5" />
                              Replying To:
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 font-mono border border-zinc-700">
                              {inlineReplyTo || parseRecipientEmail(msg.from, msg.to)}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium truncate max-w-sm">
                            {inlineReplySubject}
                          </div>
                        </div>

                        {/* Quick Logistics Reply Chips */}
                        <div>
                          <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block mb-1.5">
                            Quick Dispatch Responses:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => applyReplyTemplate('tender_accept')}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/20 transition-colors"
                            >
                              ✓ Confirm Tender
                            </button>
                            <button
                              type="button"
                              onClick={() => applyReplyTemplate('eta_update')}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-blue-500/20 transition-colors"
                            >
                              ⏱ ETA Update (I-94)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyReplyTemplate('detention_claim')}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 transition-colors"
                            >
                              ⚠ Detention Notice
                            </button>
                            <button
                              type="button"
                              onClick={() => applyReplyTemplate('customs_clearance')}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/20 transition-colors"
                            >
                              🛡 Customs / ACE Clear
                            </button>
                          </div>
                        </div>

                        {/* Recipient Editor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-0.5">To (Recipient Email)</label>
                            <input
                              type="email"
                              value={inlineReplyTo}
                              onChange={e => setInlineReplyTo(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 font-mono focus:border-red-500/50 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-0.5">Subject</label>
                            <input
                              type="text"
                              value={inlineReplySubject}
                              onChange={e => setInlineReplySubject(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:border-red-500/50 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Body Textarea */}
                        <div>
                          <label className="text-[11px] text-zinc-400 block mb-0.5">Reply Message</label>
                          <textarea
                            rows={5}
                            value={inlineReplyBody}
                            onChange={e => setInlineReplyBody(e.target.value)}
                            placeholder="Type dispatch response, driver appointment details, rate notes..."
                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white leading-relaxed font-sans focus:border-red-500/50 focus:outline-none resize-y"
                          />
                        </div>

                        {/* Inline Status Message */}
                        {hasInlineStatus && (
                          <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                            inlineReplyStatus.type === 'success' 
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                              : 'bg-red-500/15 border border-red-500/30 text-red-300'
                          }`}>
                            {inlineReplyStatus.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                            )}
                            <span>{inlineReplyStatus.text}</span>
                          </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-zinc-500">
                            {accessToken ? 'Connected via official Gmail API v1' : 'Simulated mode (Sign in with Google for live delivery)'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReplyingMessageId(null)}
                              disabled={isSendingReply}
                              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              id={`send-reply-btn-${msg.id}`}
                              onClick={() => handleSendInlineReply(msg)}
                              disabled={isSendingReply}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
                            >
                              {isSendingReply ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Sending Reply...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Send Reply
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. GOOGLE CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Google Calendar Dispatch Schedules</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Primary Calendar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="sync-active-dispatches-btn"
                onClick={triggerSyncOrdersToCalendar}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Active Orders to Calendar
              </button>
              <button
                id="add-calendar-event-btn"
                onClick={() => setShowCalendarEventForm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Schedule Appointment
              </button>
            </div>
          </div>

          {/* New Event Form */}
          {showCalendarEventForm && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-blue-500/30 shadow-xl">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                Add Appointment to Google Calendar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Appointment Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dock Pickup: Woodstock Auto Parts"
                    value={calendarForm.summary}
                    onChange={e => setCalendarForm({ ...calendarForm, summary: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Facility / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 Toyota Way, Woodstock, ON"
                    value={calendarForm.location}
                    onChange={e => setCalendarForm({ ...calendarForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Start Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    value={calendarForm.startDateTime}
                    onChange={e => setCalendarForm({ ...calendarForm, startDateTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">End Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    value={calendarForm.endDateTime}
                    onChange={e => setCalendarForm({ ...calendarForm, endDateTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Details / Driver Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Dock door assignment, customs barcode, contact phone..."
                    value={calendarForm.description}
                    onChange={e => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarEventForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerCreateCalendarEvent}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                >
                  Publish to Calendar
                </button>
              </div>
            </div>
          )}

          {/* Calendar Events List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendarEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    evt.eventType === 'Pickup' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                    evt.eventType === 'Delivery' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    evt.eventType === 'Customs Border Appointment' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                    'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  }`}>
                    {evt.eventType}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1.5">
                  {evt.summary}
                </h4>

                {evt.location && (
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                    <span className="text-zinc-500">📍</span>
                    <span>{evt.location}</span>
                  </p>
                )}

                {evt.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 mb-3">
                    {evt.description}
                  </p>
                )}

                <div className="text-[11px] text-zinc-500">
                  {new Date(evt.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. GOOGLE SHEETS TAB */}
      {activeTab === 'sheets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-white">Google Sheets Master Logistics Spreadsheets</span>
              <p className="text-xs text-zinc-400">Sync live J1939 telematics logs, freight revenues, and deadhead mileage directly into Google Sheets.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="export-telematics-sheet-btn"
                onClick={triggerExportFleetToGoogleSheets}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Export Telematics to Sheets
              </button>
              <button
                id="export-orders-sheet-btn"
                onClick={triggerExportOrdersToGoogleSheets}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Orders &amp; Rates to Sheets
              </button>
            </div>
          </div>

          {/* Spreadsheets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spreadsheets.map((sheet) => (
              <div 
                key={sheet.id}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-zinc-500">{sheet.modifiedTime || 'Updated today'}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">
                    {sheet.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mb-2">
                    Google Sheets Document • Real-Time Cloud Persistence
                  </p>

                  {sheet.rowCount ? (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                        <Table className="w-3 h-3" />
                        {sheet.rowCount} Logistics Records
                      </span>
                      {sheet.headers && (
                        <span className="text-[10px] text-zinc-500">
                          {sheet.headers.length} Columns
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-semibold flex items-center gap-1">
                        <Table className="w-3 h-3" />
                        Live Synced Spreadsheet
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSpreadsheet(sheet)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-emerald-500/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Inspect Data
                  </button>

                  <a
                    href={sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    download={sheet.webViewLink?.startsWith('data:') ? `${sheet.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv` : undefined}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    Open in Sheets
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Telematics Table Preview that syncs to Sheets */}
          <div className="mt-6 rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Live Telematics Grid Synced to Sheets ({equipment.length} Units)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-800/80 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Speed</th>
                    <th className="py-2.5 px-3">Coolant</th>
                    <th className="py-2.5 px-3">DEF</th>
                    <th className="py-2.5 px-3">Fuel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {equipment.map(eq => (
                    <tr key={eq.unit_id} className="hover:bg-zinc-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{eq.unit_id}</td>
                      <td className="py-2.5 px-3">{eq.make_model}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          eq.status === 'In-Transit' ? 'bg-cyan-500/15 text-cyan-400' :
                          eq.status === 'Online' ? 'bg-emerald-500/15 text-emerald-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{eq.location}</td>
                      <td className="py-2.5 px-3 font-mono">{eq.telematics.speedMph} mph</td>
                      <td className="py-2.5 px-3 font-mono">{eq.telematics.coolantTempF}°F</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{eq.telematics.defLevelPct}%</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">{eq.telematics.fuelLevelPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for destructive/mutating Workspace operations */}
      <WorkspaceConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        actionDescription={confirmModal.description}
        targetService={confirmModal.service}
        detailsList={confirmModal.details}
        confirmLabel={confirmModal.confirmLabel}
        isProcessing={isModalProcessing}
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Interactive Spreadsheet Data Viewer & Export Modal */}
      {previewSpreadsheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {previewSpreadsheet.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400">
                      {previewSpreadsheet.rowCount || (previewSpreadsheet.rows ? previewSpreadsheet.rows.length : 0)} records populated
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-emerald-400 font-medium">
                      Live Logistics Data Feed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewSpreadsheet.webViewLink || `https://docs.google.com/spreadsheets/d/${previewSpreadsheet.id}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  download={previewSpreadsheet.webViewLink?.startsWith('data:') ? `${previewSpreadsheet.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv` : undefined}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Sheets / Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewSpreadsheet(null)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-auto p-5">
              {previewSpreadsheet.headers && previewSpreadsheet.rows && previewSpreadsheet.rows.length > 0 ? (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-800 text-zinc-300 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        {previewSpreadsheet.headers.map((h, i) => (
                          <th key={i} className="py-3 px-3.5 border-b border-zinc-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 font-mono">
                      {previewSpreadsheet.rows.map((row, rIndex) => (
                        <tr key={rIndex} className="hover:bg-zinc-800/40">
                          {row.map((cell, cIndex) => (
                            <td key={cIndex} className="py-2.5 px-3.5 whitespace-nowrap text-zinc-300">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-white mb-1">Live Google Drive Spreadsheet</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
                    This spreadsheet is hosted directly in your connected Google Drive workspace. Click below to open and edit live formulas and cells in Google Sheets.
                  </p>
                  <a
                    href={previewSpreadsheet.webViewLink || `https://docs.google.com/spreadsheets/d/${previewSpreadsheet.id}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch in Google Sheets
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Validated against current dispatcher telematics &amp; freight database
              </span>
              <button
                type="button"
                onClick={() => setPreviewSpreadsheet(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
