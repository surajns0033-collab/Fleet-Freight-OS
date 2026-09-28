export interface BreadcrumbPoint {
  index: number;
  timestamp: string;
  timeOffsetMins: number;
  lat: number;
  lng: number;
  speedMph: number;
  headingDeg: number;
  odometerMiles: number;
  fuelBurnRateGalHr: number;
  engineRpm: number;
  coolantTempF: number;
  locationName: string;
  landmarkType?: 'Departure' | 'Highway' | 'Border Crossing' | 'Rest Stop' | 'Arrival';
  eventNote?: string;
}

export interface HistoricalTripReplay {
  tripId: string;
  orderId: string;
  unitId: string;
  driverId: string;
  driverName: string;
  truckModel: string;
  origin: string;
  destination: string;
  totalDistanceMiles: number;
  durationHours: string;
  completedAgo: string;
  avgSpeedMph: number;
  avgMpg: number;
  breadcrumbs: BreadcrumbPoint[];
}

export const HISTORICAL_TRIPS_LAST_24H: HistoricalTripReplay[] = [
  {
    tripId: 'TRP-8812',
    orderId: 'ORD-2026-9039',
    unitId: 'TRK-112',
    driverId: 'DRV-809',
    driverName: 'Jaspreet Singh',
    truckModel: 'Kenworth T680 Next Gen (2025)',
    origin: 'London Logistics Hub, ON',
    destination: 'Cleveland Auto Parts Consignee, OH',
    totalDistanceMiles: 235,
    durationHours: '5h 45m',
    completedAgo: '6 hours ago',
    avgSpeedMph: 60.1,
    avgMpg: 7.39,
    breadcrumbs: [
      {
        index: 0,
        timestamp: '08:00 EDT',
        timeOffsetMins: 0,
        lat: 42.9849,
        lng: -81.2453,
        speedMph: 0,
        headingDeg: 180,
        odometerMiles: 93865,
        fuelBurnRateGalHr: 0.8,
        engineRpm: 650,
        coolantTempF: 168,
        locationName: 'London Depot Gate 3',
        landmarkType: 'Departure',
        eventNote: 'Pre-trip safety inspection signed; Departure scan completed.'
      },
      {
        index: 1,
        timestamp: '08:25 EDT',
        timeOffsetMins: 25,
        lat: 42.8250,
        lng: -81.5600,
        speedMph: 63.4,
        headingDeg: 235,
        odometerMiles: 93888,
        fuelBurnRateGalHr: 7.2,
        engineRpm: 1320,
        coolantTempF: 185,
        locationName: 'Hwy 401 Westbound near Melbourne',
        landmarkType: 'Highway',
        eventNote: 'Cruising nominal speed; Detroit DD15 torque optimal.'
      },
      {
        index: 2,
        timestamp: '08:55 EDT',
        timeOffsetMins: 55,
        lat: 42.4048,
        lng: -82.1910,
        speedMph: 64.8,
        headingDeg: 242,
        odometerMiles: 93920,
        fuelBurnRateGalHr: 7.4,
        engineRpm: 1350,
        coolantTempF: 188,
        locationName: 'Hwy 401 Corridor — Chatham-Kent',
        landmarkType: 'Highway',
        eventNote: 'Clear conditions; Tire pressure monitor all normal.'
      },
      {
        index: 3,
        timestamp: '09:30 EDT',
        timeOffsetMins: 90,
        lat: 42.3149,
        lng: -82.9550,
        speedMph: 45.0,
        headingDeg: 270,
        odometerMiles: 93958,
        fuelBurnRateGalHr: 4.8,
        engineRpm: 1100,
        coolantTempF: 190,
        locationName: 'Windsor E.C. Row Expressway Connector',
        landmarkType: 'Highway',
        eventNote: 'Approaching international border queuing lane.'
      },
      {
        index: 4,
        timestamp: '09:50 EDT',
        timeOffsetMins: 110,
        lat: 42.3117,
        lng: -83.0745,
        speedMph: 6.5,
        headingDeg: 300,
        odometerMiles: 93972,
        fuelBurnRateGalHr: 1.4,
        engineRpm: 750,
        coolantTempF: 194,
        locationName: 'Ambassador Bridge Commercial Plaza (Windsor/Detroit)',
        landmarkType: 'Border Crossing',
        eventNote: 'CBP Primary Booth #6: PAPS barcode scanned & approved in 12 min.'
      },
      {
        index: 5,
        timestamp: '10:15 EDT',
        timeOffsetMins: 135,
        lat: 42.2700,
        lng: -83.1800,
        speedMph: 58.0,
        headingDeg: 200,
        odometerMiles: 93985,
        fuelBurnRateGalHr: 6.9,
        engineRpm: 1300,
        coolantTempF: 189,
        locationName: 'I-75 South Fisher Freeway, Detroit MI',
        landmarkType: 'Highway',
        eventNote: 'Entered Michigan jurisdiction; I-75 south clear flow.'
      },
      {
        index: 6,
        timestamp: '10:50 EDT',
        timeOffsetMins: 170,
        lat: 41.9164,
        lng: -83.3977,
        speedMph: 64.2,
        headingDeg: 185,
        odometerMiles: 94022,
        fuelBurnRateGalHr: 7.3,
        engineRpm: 1340,
        coolantTempF: 191,
        locationName: 'Monroe, MI Interstate Corridor',
        landmarkType: 'Highway',
        eventNote: 'WIM Weigh-in-motion bypass authorized by PrePass.'
      },
      {
        index: 7,
        timestamp: '11:20 EDT',
        timeOffsetMins: 200,
        lat: 41.6528,
        lng: -83.5379,
        speedMph: 52.0,
        headingDeg: 140,
        odometerMiles: 94056,
        fuelBurnRateGalHr: 5.6,
        engineRpm: 1220,
        coolantTempF: 190,
        locationName: 'Toledo, OH I-80/I-90 Ohio Turnpike Interchange',
        landmarkType: 'Highway',
        eventNote: 'Transitioned onto Ohio Turnpike Eastbound.'
      },
      {
        index: 8,
        timestamp: '12:00 EDT',
        timeOffsetMins: 240,
        lat: 41.3550,
        lng: -82.6850,
        speedMph: 0,
        headingDeg: 90,
        odometerMiles: 94098,
        fuelBurnRateGalHr: 0.6,
        engineRpm: 600,
        coolantTempF: 175,
        locationName: 'Commodore Perry Service Plaza (Milepost 100)',
        landmarkType: 'Rest Stop',
        eventNote: 'FMCSA Mandatory 30-Minute Rest Break taken. Driver logged Off-Duty.'
      },
      {
        index: 9,
        timestamp: '12:35 EDT',
        timeOffsetMins: 275,
        lat: 41.3685,
        lng: -82.1076,
        speedMph: 62.5,
        headingDeg: 80,
        odometerMiles: 94132,
        fuelBurnRateGalHr: 7.1,
        engineRpm: 1330,
        coolantTempF: 188,
        locationName: 'Lorain / Elyria Turnpike Corridor',
        landmarkType: 'Highway',
        eventNote: 'Back on-duty driving; ETA confirmed with consignee.'
      },
      {
        index: 10,
        timestamp: '13:15 EDT',
        timeOffsetMins: 315,
        lat: 41.4420,
        lng: -81.7450,
        speedMph: 38.0,
        headingDeg: 75,
        odometerMiles: 94165,
        fuelBurnRateGalHr: 4.2,
        engineRpm: 1150,
        coolantTempF: 192,
        locationName: 'Cleveland Metro I-90 West 25th St Exit',
        landmarkType: 'Highway',
        eventNote: 'City street navigation to manufacturing facility.'
      },
      {
        index: 11,
        timestamp: '13:45 EDT',
        timeOffsetMins: 345,
        lat: 41.4993,
        lng: -81.6944,
        speedMph: 0,
        headingDeg: 45,
        odometerMiles: 94180,
        fuelBurnRateGalHr: 0.0,
        engineRpm: 0,
        coolantTempF: 155,
        locationName: 'Cleveland Automotive Freight Terminal (Dock 12)',
        landmarkType: 'Arrival',
        eventNote: 'Trip completed on schedule; Electronic PoD captured with signature.'
      }
    ]
  },
  {
    tripId: 'TRP-8810',
    orderId: 'ORD-2026-9041',
    unitId: 'TRK-104',
    driverId: 'DRV-742',
    driverName: 'Wayne MacLeod',
    truckModel: 'Freightliner Cascadia 126 (2024)',
    origin: 'Central Waterloo HQ Hub, ON',
    destination: 'Detroit Logistics Center, MI',
    totalDistanceMiles: 198,
    durationHours: '4h 15m',
    completedAgo: '14 hours ago',
    avgSpeedMph: 59.2,
    avgMpg: 7.04,
    breadcrumbs: [
      {
        index: 0,
        timestamp: '06:15 EDT',
        timeOffsetMins: 0,
        lat: 43.4643,
        lng: -80.5204,
        speedMph: 0,
        headingDeg: 210,
        odometerMiles: 182302,
        fuelBurnRateGalHr: 0.8,
        engineRpm: 650,
        coolantTempF: 160,
        locationName: 'Waterloo Terminal Yard Staging Bay',
        landmarkType: 'Departure',
        eventNote: 'High-priority automotive stamping freight loaded.'
      },
      {
        index: 1,
        timestamp: '06:40 EDT',
        timeOffsetMins: 25,
        lat: 43.3750,
        lng: -80.6500,
        speedMph: 58.5,
        headingDeg: 220,
        odometerMiles: 182325,
        fuelBurnRateGalHr: 7.0,
        engineRpm: 1290,
        coolantTempF: 182,
        locationName: 'Hwy 8 connector to Highway 401',
        landmarkType: 'Highway',
        eventNote: 'Engine telemetry nominal.'
      },
      {
        index: 2,
        timestamp: '07:20 EDT',
        timeOffsetMins: 65,
        lat: 43.0800,
        lng: -81.0500,
        speedMph: 64.0,
        headingDeg: 240,
        odometerMiles: 182368,
        fuelBurnRateGalHr: 7.6,
        engineRpm: 1350,
        coolantTempF: 187,
        locationName: 'Highway 401 — Ingersoll Bypass',
        landmarkType: 'Highway',
        eventNote: 'Smooth transit across Oxford County.'
      },
      {
        index: 3,
        timestamp: '08:05 EDT',
        timeOffsetMins: 110,
        lat: 42.6800,
        lng: -81.8200,
        speedMph: 63.2,
        headingDeg: 245,
        odometerMiles: 182415,
        fuelBurnRateGalHr: 7.3,
        engineRpm: 1330,
        coolantTempF: 189,
        locationName: 'Hwy 401 — Dutton / West Elgin',
        landmarkType: 'Highway',
        eventNote: 'Corridor speed verified with telematics.'
      },
      {
        index: 4,
        timestamp: '09:00 EDT',
        timeOffsetMins: 165,
        lat: 42.3150,
        lng: -82.6800,
        speedMph: 61.0,
        headingDeg: 260,
        odometerMiles: 182465,
        fuelBurnRateGalHr: 6.8,
        engineRpm: 1280,
        coolantTempF: 190,
        locationName: 'Tilbury Commercial Inspection Post',
        landmarkType: 'Highway',
        eventNote: 'PrePass Green Light Bypass granted.'
      },
      {
        index: 5,
        timestamp: '09:45 EDT',
        timeOffsetMins: 210,
        lat: 42.3117,
        lng: -83.0745,
        speedMph: 12.0,
        headingDeg: 310,
        odometerMiles: 182490,
        fuelBurnRateGalHr: 2.1,
        engineRpm: 850,
        coolantTempF: 195,
        locationName: 'Ambassador Bridge Dedicated FAST Lane',
        landmarkType: 'Border Crossing',
        eventNote: 'Customs cleared in 18 minutes; FAST card authorized.'
      },
      {
        index: 6,
        timestamp: '10:30 EDT',
        timeOffsetMins: 255,
        lat: 42.3314,
        lng: -83.0458,
        speedMph: 0,
        headingDeg: 0,
        odometerMiles: 182500,
        fuelBurnRateGalHr: 0.0,
        engineRpm: 0,
        coolantTempF: 160,
        locationName: 'Detroit Downtown Logistics Facility',
        landmarkType: 'Arrival',
        eventNote: 'Consignee received 18 pallets; Zero seal discrepancies.'
      }
    ]
  },
  {
    tripId: 'TRP-8809',
    orderId: 'ORD-2026-9040',
    unitId: 'TRK-128',
    driverId: 'DRV-615',
    driverName: 'Dave Kowalski',
    truckModel: 'Volvo VNL 860 High Roof (2023)',
    origin: 'Cambridge Logistics Hub, ON',
    destination: 'Toronto Vaughan Cross-Dock, ON',
    totalDistanceMiles: 68,
    durationHours: '1h 35m',
    completedAgo: '21 hours ago',
    avgSpeedMph: 54.8,
    avgMpg: 6.85,
    breadcrumbs: [
      {
        index: 0,
        timestamp: '14:00 EDT',
        timeOffsetMins: 0,
        lat: 43.3616,
        lng: -80.3144,
        speedMph: 0,
        headingDeg: 60,
        odometerMiles: 278432,
        fuelBurnRateGalHr: 0.9,
        engineRpm: 600,
        coolantTempF: 172,
        locationName: 'Cambridge Terminal Yard',
        landmarkType: 'Departure',
        eventNote: 'Departed with cross-dock consolidated LTL freight.'
      },
      {
        index: 1,
        timestamp: '14:25 EDT',
        timeOffsetMins: 25,
        lat: 43.4900,
        lng: -80.0500,
        speedMph: 62.0,
        headingDeg: 70,
        odometerMiles: 278455,
        fuelBurnRateGalHr: 7.8,
        engineRpm: 1350,
        coolantTempF: 198,
        locationName: 'Highway 401 East — Milton Hill',
        landmarkType: 'Highway',
        eventNote: 'Steep grade pull; DD15 cooling fan engaged.'
      },
      {
        index: 2,
        timestamp: '14:55 EDT',
        timeOffsetMins: 55,
        lat: 43.6400,
        lng: -79.7200,
        speedMph: 48.0,
        headingDeg: 65,
        odometerMiles: 278480,
        fuelBurnRateGalHr: 5.5,
        engineRpm: 1180,
        coolantTempF: 202,
        locationName: 'Hwy 401 / Hwy 427 Mississauga Junction',
        landmarkType: 'Highway',
        eventNote: 'Moderate GTA traffic density.'
      },
      {
        index: 3,
        timestamp: '15:35 EDT',
        timeOffsetMins: 95,
        lat: 43.7950,
        lng: -79.5250,
        speedMph: 0,
        headingDeg: 0,
        odometerMiles: 278500,
        fuelBurnRateGalHr: 0.0,
        engineRpm: 0,
        coolantTempF: 180,
        locationName: 'Vaughan Logistics Cross-Dock Terminal',
        landmarkType: 'Arrival',
        eventNote: 'Dock turnaround completed in 35 mins.'
      }
    ]
  }
];
