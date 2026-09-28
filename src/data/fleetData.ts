import { Order, Equipment, Driver, TripRecord, FreightItem, BackhaulOpportunity, OperationalAlert, OperatorProfile } from '../types';

export const INITIAL_ORDERS: Order[] = [
  {
    order_id: 'ORD-2026-9041',
    shipper_name: 'Toyota Boshoku Ontario',
    origin_city: 'Woodstock',
    origin_state_prov: 'ON',
    dest_city: 'Detroit',
    dest_state_prov: 'MI',
    distance_miles: 168,
    weight_lbs: 38400,
    pallets: 26,
    equipment_required: 'Dry Van 53ft',
    rate_cad: 1450.00,
    pickup_window: '2026-09-12 06:00 EDT',
    delivery_window: '2026-09-12 12:30 EDT',
    status: 'In-Transit',
    assigned_truck_id: 'TRK-104',
    assigned_driver_id: 'DRV-742',
    notes: 'Tier-1 JIT Automotive parts. Hard dock delivery at Jefferson Ave Plant.',
    history: [
      {
        id: 'hist-9041-1',
        timestamp: '2026-09-12 06:15 EDT',
        event_type: 'Order Created',
        description: 'Electronic EDI-204 load tender received and booked at $1,450 CAD.',
        actor: 'EDI Gateway'
      },
      {
        id: 'hist-9041-2',
        timestamp: '2026-09-12 06:30 EDT',
        event_type: 'Dispatched',
        description: 'Assigned to Tractor TRK-104 & Driver Marcus Tremblay.',
        actor: 'Dispatcher Sarah Vance'
      },
      {
        id: 'hist-9041-3',
        timestamp: '2026-09-12 12:15 EDT',
        event_type: 'Dock Arrival',
        description: 'In-Cab geofence triggered at Jefferson Ave Plant receiving dock door 14.',
        actor: 'Driver In-Cab Tablet'
      }
    ]
  },
  {
    order_id: 'ORD-2026-9042',
    shipper_name: 'Maple Leaf Foods Logistics',
    origin_city: 'Hamilton',
    origin_state_prov: 'ON',
    dest_city: 'Chicago',
    dest_state_prov: 'IL',
    distance_miles: 495,
    weight_lbs: 41200,
    pallets: 24,
    equipment_required: 'Reefer (-18C)',
    rate_cad: 3850.00,
    pickup_window: '2026-09-12 08:30 EDT',
    delivery_window: '2026-09-12 21:00 CDT',
    status: 'Tendered',
    notes: 'Deep freeze frozen bacon & prepared meats. Continuous reefer run required.'
  },
  {
    order_id: 'ORD-2026-9043',
    shipper_name: 'Cascades Containerboard',
    origin_city: 'Mississauga',
    origin_state_prov: 'ON',
    dest_city: 'Allentown',
    dest_state_prov: 'PA',
    distance_miles: 412,
    weight_lbs: 42800,
    pallets: 28,
    equipment_required: 'Dry Van 53ft',
    rate_cad: 2980.00,
    pickup_window: '2026-09-12 11:00 EDT',
    delivery_window: '2026-09-13 07:00 EDT',
    status: 'In-Transit',
    assigned_truck_id: 'TRK-145',
    assigned_driver_id: 'DRV-931',
    notes: 'Packaging paperboard rolls. Tandem axle gross max 34,000 lbs.'
  },
  {
    order_id: 'ORD-2026-9044',
    shipper_name: 'Schneider Foods Cold Storage',
    origin_city: 'Kitchener',
    origin_state_prov: 'ON',
    dest_city: 'Montreal',
    dest_state_prov: 'QC',
    distance_miles: 405,
    weight_lbs: 39500,
    pallets: 22,
    equipment_required: 'Reefer (+4C)',
    rate_cad: 2750.00,
    pickup_window: '2026-09-12 14:00 EDT',
    delivery_window: '2026-09-13 04:00 EDT',
    status: 'Dispatched',
    assigned_truck_id: 'TRK-109',
    assigned_driver_id: 'DRV-554',
    notes: 'Chilled deli cuts. Pre-cool trailer to +2°C before loading.'
  },
  {
    order_id: 'ORD-2026-9045',
    shipper_name: 'Linamar Powertrain Parts',
    origin_city: 'Guelph',
    origin_state_prov: 'ON',
    dest_city: 'Columbus',
    dest_state_prov: 'OH',
    distance_miles: 388,
    weight_lbs: 36200,
    pallets: 20,
    equipment_required: 'Dry Van 53ft',
    rate_cad: 2620.00,
    pickup_window: '2026-09-12 16:30 EDT',
    delivery_window: '2026-09-13 09:00 EDT',
    status: 'Tendered',
    notes: 'Engine blocks & crankshaft assemblies. Strapping required.'
  },
  {
    order_id: 'ORD-2026-9046',
    shipper_name: 'St. Jacobs Farmers Aggregate',
    origin_city: 'Waterloo',
    origin_state_prov: 'ON',
    dest_city: 'Buffalo',
    dest_state_prov: 'NY',
    distance_miles: 142,
    weight_lbs: 34000,
    pallets: 18,
    equipment_required: 'Reefer (+2C)',
    rate_cad: 1200.00,
    pickup_window: '2026-09-12 19:00 EDT',
    delivery_window: '2026-09-13 01:00 EDT',
    status: 'Tendered',
    notes: 'Fresh produce & orchard apples. Keep continuous fan mode on.'
  },
  {
    order_id: 'ORD-2026-9047',
    shipper_name: 'Magna International Closures',
    origin_city: 'Newmarket',
    origin_state_prov: 'ON',
    dest_city: 'Fort Wayne',
    dest_state_prov: 'IN',
    distance_miles: 340,
    weight_lbs: 37100,
    pallets: 22,
    equipment_required: 'Dry Van 53ft',
    rate_cad: 2450.00,
    pickup_window: '2026-09-13 07:00 EDT',
    delivery_window: '2026-09-13 16:00 EDT',
    status: 'Tendered',
    notes: 'Automotive latch modules. Requires FAST approved driver for expedited border.'
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    unit_id: 'TRK-104',
    make_model: 'Freightliner Cascadia 126',
    year: 2024,
    engine_spec: 'Detroit DD15 (505 HP)',
    gross_vehicle_weight_rating_lbs: 80000,
    current_odometer: 184200,
    next_service_due_miles: 190000,
    status: 'In-Transit',
    location: 'I-94 W near Ann Arbor, MI',
    telematics: {
      engineRpm: 1420,
      speedMph: 62.4,
      oilPressurePsi: 44.2,
      coolantTempF: 194,
      batteryVolts: 14.2,
      defLevelPct: 82,
      fuelLevelPct: 68,
      fuelBurnRateGalHr: 8.4,
      ambientTempC: 19.5,
      faultCodes: []
    }
  },
  {
    unit_id: 'TRK-112',
    make_model: 'Kenworth T680 Next Gen',
    year: 2025,
    engine_spec: 'PACCAR MX-13 (455 HP)',
    gross_vehicle_weight_rating_lbs: 80000,
    current_odometer: 94100,
    next_service_due_miles: 100000,
    status: 'Online',
    location: 'Fleet Yard (Waterloo, ON)',
    telematics: {
      engineRpm: 650,
      speedMph: 0,
      oilPressurePsi: 38.0,
      coolantTempF: 165,
      batteryVolts: 13.9,
      defLevelPct: 94,
      fuelLevelPct: 92,
      fuelBurnRateGalHr: 0.7,
      ambientTempC: 18.0,
      faultCodes: []
    }
  },
  {
    unit_id: 'TRK-128',
    make_model: 'Volvo VNL 860 High Roof',
    year: 2023,
    engine_spec: 'Volvo D13 Turbo Compound',
    gross_vehicle_weight_rating_lbs: 80000,
    current_odometer: 278500,
    next_service_due_miles: 280000,
    status: 'Diagnostic Alert',
    location: 'Cambridge Terminal Yard, ON',
    telematics: {
      engineRpm: 600,
      speedMph: 0,
      oilPressurePsi: 34.5,
      coolantTempF: 208,
      batteryVolts: 12.8,
      defLevelPct: 24,
      fuelLevelPct: 41,
      fuelBurnRateGalHr: 1.1,
      ambientTempC: 21.0,
      faultCodes: [
        {
          spn: 4334,
          fmi: 18,
          description: 'AFT 1 DEF Dosing Unit Pressure — Low Absolute Pressure',
          severity: 'Critical',
          occurrenceCount: 4,
          recommendedAction: 'Inspect DEF dosing line filter for crystallization and check pump module pressure sensor.'
        }
      ]
    }
  },
  {
    unit_id: 'TRK-145',
    make_model: 'Freightliner Cascadia 126',
    year: 2024,
    engine_spec: 'Detroit DD15 (505 HP)',
    gross_vehicle_weight_rating_lbs: 80000,
    current_odometer: 148900,
    next_service_due_miles: 160000,
    status: 'In-Transit',
    location: 'I-81 S near Scranton, PA',
    telematics: {
      engineRpm: 1380,
      speedMph: 64.1,
      oilPressurePsi: 45.0,
      coolantTempF: 196,
      batteryVolts: 14.1,
      defLevelPct: 76,
      fuelLevelPct: 54,
      fuelBurnRateGalHr: 8.9,
      ambientTempC: 22.0,
      faultCodes: []
    }
  },
  {
    unit_id: 'TRK-109',
    make_model: 'Peterbilt 579 UltraLoft',
    year: 2023,
    engine_spec: 'Cummins X15 Performance (500 HP)',
    gross_vehicle_weight_rating_lbs: 80000,
    current_odometer: 212400,
    next_service_due_miles: 220000,
    status: 'Online',
    location: 'Kitchener Yard, ON',
    telematics: {
      engineRpm: 700,
      speedMph: 0,
      oilPressurePsi: 41.2,
      coolantTempF: 172,
      batteryVolts: 13.8,
      defLevelPct: 88,
      fuelLevelPct: 85,
      fuelBurnRateGalHr: 0.8,
      ambientTempC: 19.0,
      faultCodes: []
    }
  },
  {
    unit_id: 'TRL-504',
    make_model: 'Utility 3000R Reefer 53ft',
    year: 2024,
    engine_spec: 'Thermo King Precedent S-600',
    gross_vehicle_weight_rating_lbs: 65000,
    current_odometer: 142000,
    next_service_due_miles: 150000,
    status: 'Online',
    location: 'Hamilton Dock (Paired with TRK-112)',
    telematics: {
      engineRpm: 1200,
      speedMph: 0,
      oilPressurePsi: 40.0,
      coolantTempF: 180,
      batteryVolts: 13.7,
      defLevelPct: 90,
      fuelLevelPct: 75,
      fuelBurnRateGalHr: 1.2,
      ambientTempC: 20.0,
      faultCodes: []
    }
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    driver_id: 'DRV-742',
    name: 'Wayne MacLeod',
    phone: '(519) 555-0194',
    home_terminal: 'Waterloo, ON',
    current_location: 'Detroit, MI',
    drive_time_remaining_hours: 6.75,
    shift_time_remaining_hours: 8.50,
    cycle_time_remaining_hours: 34.0,
    fast_card_approved: true,
    hazmat_endorsement: true,
    duty_status: 'Driving',
    current_truck_id: 'TRK-104',
    active_order_id: 'ORD-2026-9041',
    performance: {
      totalTripsCompleted: 142,
      onTimeDeliveries: 139,
      lateDeliveries: 3,
      onTimeRatePct: 97.9,
      hosCleanStreakDays: 120,
      hosViolationsCount: 0,
      hosWarningsCount: 0,
      restBreakAdherencePct: 99.4,
      averageDeliveryVarianceMins: -8.2,
      hosScore: 99,
      deliveryAccuracyScore: 97,
      compositeSafetyScore: 98,
      ratingTier: 'Elite Fleet Master',
      recentAuditLogs: [
        { tripId: 'TRP-8810', date: '2026-09-12', destination: 'Detroit, MI', status: 'On-Time', varianceMins: -15, hosStatus: 'Clean', notes: 'Arrived 15m before dock window. FMCSA log clean.' },
        { tripId: 'TRP-8794', date: '2026-09-10', destination: 'Cleveland, OH', status: 'On-Time', varianceMins: -8, hosStatus: 'Clean', notes: 'Pre-trip 30m inspection recorded properly.' },
        { tripId: 'TRP-8780', date: '2026-09-08', destination: 'Chicago, IL', status: 'On-Time', varianceMins: -5, hosStatus: 'Clean', notes: 'Mandatory 30m rest break taken at 7.5h drive mark.' },
        { tripId: 'TRP-8762', date: '2026-09-05', destination: 'Indianapolis, IN', status: 'Early', varianceMins: -22, hosStatus: 'Clean', notes: 'Smooth customs crossing via Blue Water Bridge.' },
        { tripId: 'TRP-8749', date: '2026-09-02', destination: 'Columbus, OH', status: 'On-Time', varianceMins: 0, hosStatus: 'Clean', notes: 'Right on schedule. Zero log infractions.' }
      ]
    }
  },
  {
    driver_id: 'DRV-809',
    name: 'Jaspreet Singh',
    phone: '(905) 555-0142',
    home_terminal: 'Mississauga, ON',
    current_location: 'Waterloo Yard, ON',
    drive_time_remaining_hours: 9.20,
    shift_time_remaining_hours: 11.00,
    cycle_time_remaining_hours: 52.5,
    fast_card_approved: true,
    hazmat_endorsement: false,
    duty_status: 'On-Duty',
    current_truck_id: 'TRK-112',
    performance: {
      totalTripsCompleted: 98,
      onTimeDeliveries: 93,
      lateDeliveries: 5,
      onTimeRatePct: 94.9,
      hosCleanStreakDays: 65,
      hosViolationsCount: 0,
      hosWarningsCount: 1,
      restBreakAdherencePct: 97.0,
      averageDeliveryVarianceMins: 3.1,
      hosScore: 94,
      deliveryAccuracyScore: 93,
      compositeSafetyScore: 94,
      ratingTier: 'Elite Fleet Master',
      recentAuditLogs: [
        { tripId: 'TRP-8812', date: '2026-09-11', destination: 'Cleveland, OH', status: 'On-Time', varianceMins: 4, hosStatus: 'Clean', notes: 'Completed within scheduled dock window.' },
        { tripId: 'TRP-8799', date: '2026-09-09', destination: 'Buffalo, NY', status: 'On-Time', varianceMins: -6, hosStatus: 'Clean', notes: 'Peace Bridge FAST lane utilized.' },
        { tripId: 'TRP-8778', date: '2026-09-06', destination: 'London, ON', status: 'Delayed', varianceMins: 18, hosStatus: 'Warning', notes: 'Highway 401 construction delay; approached 11h driving threshold.' },
        { tripId: 'TRP-8755', date: '2026-09-03', destination: 'Windsor, ON', status: 'On-Time', varianceMins: -3, hosStatus: 'Clean', notes: 'Sleeper berth split rest verified.' },
        { tripId: 'TRP-8738', date: '2026-08-30', destination: 'Detroit, MI', status: 'On-Time', varianceMins: 2, hosStatus: 'Clean', notes: 'Timely shipper sign-off.' }
      ]
    }
  },
  {
    driver_id: 'DRV-615',
    name: 'Dave Kowalski',
    phone: '(519) 555-0188',
    home_terminal: 'Cambridge, ON',
    current_location: 'Cambridge Terminal, ON',
    drive_time_remaining_hours: 0.75,
    shift_time_remaining_hours: 1.25,
    cycle_time_remaining_hours: 8.0,
    fast_card_approved: false,
    hazmat_endorsement: false,
    duty_status: 'On-Duty',
    current_truck_id: 'TRK-128',
    performance: {
      totalTripsCompleted: 86,
      onTimeDeliveries: 71,
      lateDeliveries: 15,
      onTimeRatePct: 82.5,
      hosCleanStreakDays: 14,
      hosViolationsCount: 1,
      hosWarningsCount: 3,
      restBreakAdherencePct: 88.2,
      averageDeliveryVarianceMins: 28.4,
      hosScore: 72,
      deliveryAccuracyScore: 74,
      compositeSafetyScore: 73,
      ratingTier: 'Satisfactory',
      recentAuditLogs: [
        { tripId: 'TRP-8802', date: '2026-09-11', destination: 'Cambridge, ON', status: 'Delayed', varianceMins: 35, hosStatus: 'Warning', notes: 'Drive clock dipped to 0.4h remaining before reaching terminal.' },
        { tripId: 'TRP-8785', date: '2026-09-07', destination: 'Brampton, ON', status: 'Delayed', varianceMins: 42, hosStatus: 'Violation', notes: 'Exceeded 14-hour shift window by 18 minutes due to consignee detention.' },
        { tripId: 'TRP-8771', date: '2026-09-04', destination: 'Kitchener, ON', status: 'On-Time', varianceMins: 8, hosStatus: 'Clean', notes: 'Local short-haul run nominal.' },
        { tripId: 'TRP-8750', date: '2026-08-31', destination: 'Woodstock, ON', status: 'On-Time', varianceMins: 12, hosStatus: 'Warning', notes: 'Rest break logged 15m past recommended 8-hour window.' },
        { tripId: 'TRP-8732', date: '2026-08-27', destination: 'Guelph, ON', status: 'Delayed', varianceMins: 25, hosStatus: 'Clean', notes: 'Shipper loading bottleneck.' }
      ]
    }
  },
  {
    driver_id: 'DRV-931',
    name: 'Marc Beaulieu',
    phone: '(519) 555-0211',
    home_terminal: 'Windsor, ON',
    current_location: 'Scranton, PA',
    drive_time_remaining_hours: 8.00,
    shift_time_remaining_hours: 9.75,
    cycle_time_remaining_hours: 41.5,
    fast_card_approved: true,
    hazmat_endorsement: true,
    duty_status: 'Driving',
    current_truck_id: 'TRK-145',
    active_order_id: 'ORD-2026-9043',
    performance: {
      totalTripsCompleted: 115,
      onTimeDeliveries: 108,
      lateDeliveries: 7,
      onTimeRatePct: 93.9,
      hosCleanStreakDays: 82,
      hosViolationsCount: 0,
      hosWarningsCount: 0,
      restBreakAdherencePct: 98.2,
      averageDeliveryVarianceMins: -2.5,
      hosScore: 97,
      deliveryAccuracyScore: 93,
      compositeSafetyScore: 95,
      ratingTier: 'Elite Fleet Master',
      recentAuditLogs: [
        { tripId: 'TRP-8811', date: '2026-09-12', destination: 'Allentown, PA', status: 'On-Time', varianceMins: -10, hosStatus: 'Clean', notes: 'In-transit on I-81. Ahead of schedule.' },
        { tripId: 'TRP-8791', date: '2026-09-09', destination: 'Syracuse, NY', status: 'On-Time', varianceMins: -4, hosStatus: 'Clean', notes: 'Clean ELD duty log.' },
        { tripId: 'TRP-8774', date: '2026-09-06', destination: 'Harrisburg, PA', status: 'On-Time', varianceMins: 2, hosStatus: 'Clean', notes: 'Cross-border manifest accepted without inspection.' },
        { tripId: 'TRP-8758', date: '2026-09-02', destination: 'Albany, NY', status: 'On-Time', varianceMins: -8, hosStatus: 'Clean', notes: 'Tandem axle weight verified on CAT Scale.' },
        { tripId: 'TRP-8741', date: '2026-08-29', destination: 'Scranton, PA', status: 'Delayed', varianceMins: 15, hosStatus: 'Clean', notes: 'Severe weather in Poconos.' }
      ]
    }
  },
  {
    driver_id: 'DRV-554',
    name: 'Ryan Miller',
    phone: '(519) 555-0377',
    home_terminal: 'Kitchener, ON',
    current_location: 'Kitchener, ON',
    drive_time_remaining_hours: 10.50,
    shift_time_remaining_hours: 13.00,
    cycle_time_remaining_hours: 61.0,
    fast_card_approved: true,
    hazmat_endorsement: true,
    duty_status: 'On-Duty',
    current_truck_id: 'TRK-109',
    active_order_id: 'ORD-2026-9044',
    performance: {
      totalTripsCompleted: 104,
      onTimeDeliveries: 95,
      lateDeliveries: 9,
      onTimeRatePct: 91.3,
      hosCleanStreakDays: 45,
      hosViolationsCount: 0,
      hosWarningsCount: 2,
      restBreakAdherencePct: 94.5,
      averageDeliveryVarianceMins: 6.2,
      hosScore: 89,
      deliveryAccuracyScore: 88,
      compositeSafetyScore: 89,
      ratingTier: 'Compliant Pro',
      recentAuditLogs: [
        { tripId: 'TRP-8805', date: '2026-09-11', destination: 'Montreal, QC', status: 'On-Time', varianceMins: 5, hosStatus: 'Clean', notes: 'Highway 401 East corridor run.' },
        { tripId: 'TRP-8790', date: '2026-09-08', destination: 'Cornwall, ON', status: 'On-Time', varianceMins: -2, hosStatus: 'Clean', notes: 'Temperature recorder calibrated.' },
        { tripId: 'TRP-8769', date: '2026-09-04', destination: 'Kingston, ON', status: 'Delayed', varianceMins: 20, hosStatus: 'Warning', notes: 'Approached 8h break window before truck stop.' },
        { tripId: 'TRP-8752', date: '2026-08-31', destination: 'Ottawa, ON', status: 'On-Time', varianceMins: -4, hosStatus: 'Clean', notes: 'Reefer microclimate sustained at +4C.' },
        { tripId: 'TRP-8736', date: '2026-08-28', destination: 'Belleville, ON', status: 'Delayed', varianceMins: 14, hosStatus: 'Clean', notes: 'Consignee dock delay.' }
      ]
    }
  }
];

export const INITIAL_TRIPS: TripRecord[] = [
  {
    trip_id: 'TRP-8810',
    order_id: 'ORD-2026-9041',
    truck_id: 'TRK-104',
    driver_id: 'DRV-742',
    origin: 'Woodstock, ON',
    destination: 'Detroit, MI',
    loaded_miles: 168,
    deadhead_miles: 32,
    fuel_burned_gallons: 28.4,
    avg_mpg: 7.04,
    idle_hours: 0.8,
    avg_speed_mph: 59.2,
    customs_delay_mins: 42,
    status: 'Active',
    departure_time: '2026-09-12 06:15 EDT',
    estimated_arrival: '2026-09-12 11:45 EDT'
  },
  {
    trip_id: 'TRP-8811',
    order_id: 'ORD-2026-9043',
    truck_id: 'TRK-145',
    driver_id: 'DRV-931',
    origin: 'Mississauga, ON',
    destination: 'Allentown, PA',
    loaded_miles: 412,
    deadhead_miles: 25,
    fuel_burned_gallons: 61.5,
    avg_mpg: 7.10,
    idle_hours: 1.1,
    avg_speed_mph: 61.5,
    customs_delay_mins: 18,
    status: 'Active',
    departure_time: '2026-09-12 11:30 EDT',
    estimated_arrival: '2026-09-13 01:15 EDT'
  },
  {
    trip_id: 'TRP-8812',
    order_id: 'ORD-2026-9039',
    truck_id: 'TRK-112',
    driver_id: 'DRV-809',
    origin: 'London, ON',
    destination: 'Cleveland, OH',
    loaded_miles: 235,
    deadhead_miles: 18,
    fuel_burned_gallons: 34.2,
    avg_mpg: 7.39,
    idle_hours: 0.5,
    avg_speed_mph: 60.1,
    customs_delay_mins: 22,
    status: 'Completed',
    departure_time: '2026-09-11 08:00 EDT',
    estimated_arrival: '2026-09-11 14:30 EDT'
  }
];

export const INITIAL_FREIGHT: FreightItem[] = [
  {
    freight_sku: 'FRT-CHILL-01',
    commodity: 'Fresh Poultry & Deli Cold Cuts',
    handling_type: 'Chill',
    target_temp_c: 1.5,
    current_temp_c: 2.1,
    max_temp_drift_c: 1.0,
    is_hazmat: false,
    hazmat_class: 'None',
    associated_truck_id: 'TRK-109',
    associated_order_id: 'ORD-2026-9044',
    spoilage_status: 'Optimal',
    estimatedHoursToCritical: 18.5
  },
  {
    freight_sku: 'FRT-FROZEN-04',
    commodity: 'Ice Cream & Frozen Prepared Foods',
    handling_type: 'Deep Freeze',
    target_temp_c: -22.0,
    current_temp_c: -16.2,
    max_temp_drift_c: 2.5,
    is_hazmat: false,
    hazmat_class: 'None',
    associated_truck_id: 'TRL-504',
    associated_order_id: 'ORD-2026-9042',
    spoilage_status: 'Imminent Risk',
    estimatedHoursToCritical: 1.8
  },
  {
    freight_sku: 'FRT-AUTO-19',
    commodity: 'Automotive Lithium Battery Packs',
    handling_type: 'HazMat Spec',
    target_temp_c: 18.0,
    current_temp_c: 19.5,
    max_temp_drift_c: 8.0,
    is_hazmat: true,
    hazmat_class: 'UN 3480 Class 9',
    associated_truck_id: 'TRK-104',
    associated_order_id: 'ORD-2026-9041',
    spoilage_status: 'Optimal',
    estimatedHoursToCritical: 72.0
  }
];

export const INITIAL_BACKHAULS: BackhaulOpportunity[] = [
  {
    id: 'BKH-501',
    shipper: 'General Motors Powertrain',
    origin_city: 'Detroit, MI',
    dest_city: 'Cambridge, ON',
    rate_cad: 1650.00,
    distance_miles: 212,
    weight_lbs: 38200,
    pallets: 24,
    equipment: 'Dry Van 53ft',
    deadhead_saved_miles: 185,
    net_profit_gain_cad: 1140.00,
    corridor: 'I-94 E -> Ambassador Bridge -> Highway 401 E'
  },
  {
    id: 'BKH-502',
    shipper: 'Archer Daniels Midland (ADM)',
    origin_city: 'Chicago, IL',
    dest_city: 'London, ON',
    rate_cad: 2850.00,
    distance_miles: 410,
    weight_lbs: 42000,
    pallets: 22,
    equipment: 'Dry Van 53ft',
    deadhead_saved_miles: 390,
    net_profit_gain_cad: 1820.00,
    corridor: 'I-90 E -> I-94 E -> Blue Water Bridge -> Highway 402 E'
  },
  {
    id: 'BKH-503',
    shipper: 'Tyson Foods Midwest Hub',
    origin_city: 'Chicago, IL',
    dest_city: 'Toronto, ON',
    rate_cad: 3950.00,
    distance_miles: 515,
    weight_lbs: 39800,
    pallets: 26,
    equipment: 'Reefer (-18C)',
    deadhead_saved_miles: 480,
    net_profit_gain_cad: 2420.00,
    corridor: 'I-94 E -> Blue Water Bridge -> Highway 402/401 E'
  },
  {
    id: 'BKH-504',
    shipper: 'Kraft Heinz Distribution',
    origin_city: 'Allentown, PA',
    dest_city: 'Mississauga, ON',
    rate_cad: 2650.00,
    distance_miles: 395,
    weight_lbs: 41500,
    pallets: 24,
    equipment: 'Dry Van 53ft',
    deadhead_saved_miles: 380,
    net_profit_gain_cad: 1750.00,
    corridor: 'I-81 N -> Peace Bridge (Buffalo) -> QEW'
  }
];

export const INITIAL_ALERTS: OperationalAlert[] = [
  {
    id: 'ALT-101',
    timestamp: '11:42 EDT (Just now)',
    severity: 'critical',
    category: 'COLD_CHAIN',
    title: 'Reefer Microclimate Drift: ORD-2026-9042',
    message: 'TRL-504 Thermo King temperature climbed from -22.0°C to -16.2°C (drift: +5.8°C). Threshold exceeded by 3.3°C. Estimated 1.8 hours before cargo spoilage ($120,000 value).',
    relatedUnitId: 'TRL-504',
    actionRequired: 'Inspect compressor belt & check evaporator coils. Divert to Thermo King Kitchener if unresolved within 20m.'
  },
  {
    id: 'ALT-102',
    timestamp: '11:28 EDT',
    severity: 'critical',
    category: 'TELEMATICS',
    title: 'CAN-Bus SPN 4334 FMI 18 Fault on TRK-128',
    message: 'AFT 1 DEF Dosing Unit Pressure Low Absolute. 4 occurrences logged on Volvo D13 engine. DEF dosing will derate engine speed to 5 mph within 50 miles.',
    relatedUnitId: 'TRK-128',
    actionRequired: 'Ground tractor at Cambridge Yard. Assign Bay 2 mechanic work order before next dispatch.'
  },
  {
    id: 'ALT-103',
    timestamp: '10:55 EDT',
    severity: 'warning',
    category: 'HOS',
    title: 'HOS Drive Clock Threshold: DRV-615 (Dave Kowalski)',
    message: '1.50 hours drive time remaining on 11-hour clock. Shift clock at 2.25 hours. Cannot be legally assigned any leg over 75 highway miles without mandatory 10-hour reset.',
    relatedDriverId: 'DRV-615',
    actionRequired: 'Restrict dispatch matching to local yard shunting or release for scheduled 10-hour sleeper berth.'
  },
  {
    id: 'ALT-104',
    timestamp: '10:15 EDT',
    severity: 'warning',
    category: 'CUSTOMS',
    title: 'Ambassador Bridge Commercial Lanes Congestion',
    message: 'Windsor-Detroit crossing delay spiked to 48 minutes due to primary booth scanner calibration. Blue Water Bridge (Sarnia) running with 12 minute clearance.',
    actionRequired: 'Auto-reroute active Westbound trucks through Highway 402 / Port Huron to save 36 minutes.'
  },
  {
    id: 'ALT-105',
    timestamp: '09:30 EDT',
    severity: 'info',
    category: 'DISPATCH',
    title: 'Automated IFTA Fuel Tax Audit Synchronization',
    message: 'Q3 IFTA mileage across Ontario, Michigan, Ohio, and Pennsylvania successfully verified against J1939 telematics logs. 0 tax credit discrepancies.',
    actionRequired: 'No dispatch intervention required. Telematics audit exported to accounting ledger.'
  },
  {
    id: 'ALT-106',
    timestamp: '08:45 EDT',
    severity: 'info',
    category: 'TELEMATICS',
    title: 'Firmware Over-the-Air Update Completed: TRK-104',
    message: 'Detroit DD15 ECM firmware v4.18 successfully flashed over LTE. Predictive cruise control parameters optimized for rolling terrain on I-80.',
    relatedUnitId: 'TRK-104',
    actionRequired: 'Telemetry stream nominal. Unit certified for corridor assignment.'
  }
];

export const INITIAL_OPERATOR_PROFILES: OperatorProfile[] = [
  {
    id: 'OP-01',
    name: 'Corey Barron',
    role: 'Lead Freight Dispatcher',
    title: 'Senior Operations Specialist',
    terminal: 'Waterloo HQ Hub, ON',
    avatarInitials: 'CB'
  },
  {
    id: 'OP-02',
    name: 'Joe Smelko',
    role: 'Fleet General Manager',
    title: 'Executive Director of Fleet Operations',
    terminal: 'Waterloo / Cambridge, ON',
    avatarInitials: 'JS'
  },
  {
    id: 'OP-03',
    name: 'Wayne MacLeod',
    role: 'Senior Highway Driver',
    title: 'Cross-Border Lead Operator',
    terminal: 'Detroit / Waterloo Corridor',
    avatarInitials: 'WM',
    driverId: 'DRV-742',
    truckId: 'TRK-104'
  },
  {
    id: 'OP-04',
    name: 'Sarah Jenkins',
    role: 'Safety & Compliance Officer',
    title: 'FMCSA & MTO Audit Inspector',
    terminal: 'Kitchener-Waterloo, ON',
    avatarInitials: 'SJ'
  },
  {
    id: 'OP-05',
    name: 'Dave Kowalski',
    role: 'Regional Highway Driver',
    title: 'Heavy Haul Class-8 Operator',
    terminal: 'Cambridge Terminal, ON',
    avatarInitials: 'DK',
    driverId: 'DRV-615',
    truckId: 'TRK-128'
  }
];
