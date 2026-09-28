<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>Fleet & Freight OS</h1>
  <p>Commercial Fleet Management, Corridor Route Optimization, Telematics &amp; Autonomous Logistics Operating System</p>
  <p>Built with Google AI Studio</p>
</div>

## Overview

**Fleet & Freight OS** is a modern commercial fleet and logistics operations management platform designed for long-haul carriers, cross-border freight operators, and enterprise dispatchers.

### Key Capabilities
- **Fleet Tracking & Corridor Map:** Interactive real-time vehicle positioning along high-density commercial corridors.
- **Autonomous Fleet Operations Agent:** Multi-step autonomous dispatch, load matching, and exception resolution.
- **HOS & ELD Compliance:** Driver Hours of Service regulatory monitors, duty status clocks, and violation prevention alerts.
- **CAN-bus Telematics Diagnostics:** Engine temperature, tire pressure, DEF levels, fuel economy curves, and DTC fault codes.
- **Cold Chain & Reefer Monitoring:** Multi-zone temperature sensors, setpoint deviation tracking, and perishable cargo safeguards.
- **Proof of Delivery (PoD) Scanner:** Bill of Lading OCR document extraction, discrepancy identification, and archive management.
- **EDI Integration Hub:** EDI 204 (Load Tender) and EDI 214 (Shipment Status) integration.
- **Google Workspace Integration:** Synchronize dispatches to Google Sheets, notify shippers via Gmail, and manage carrier contacts.
- **Multimodal AI Copilot & Live Voice:** Driver cab voice assistant, audio trip debrief transcription, and predictive lane delay forecasts.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Setup
```bash
# Clone the repository
git clone https://github.com/surajns0033-collab/Fleet-Freight-OS.git
cd Fleet-Freight-OS

# Install dependencies
npm install

# Start the full-stack server
npm run dev
```

### Environment Configuration
Copy `.env.example` to `.env` and configure your API keys:
- `GEMINI_API_KEY`: Google Gemini API key for predictive analytics, multimodal copilot, and live voice assistant.
