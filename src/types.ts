export type OrderStatus = 'Tendered' | 'Dispatched' | 'In-Transit' | 'Delivered' | 'Cancelled';
export type EquipmentType = 'Dry Van 53ft' | 'Reefer (-18C)' | 'Reefer (+4C)' | 'Reefer (+2C)' | 'Flatbed';

export interface ProofOfDeliveryDocument {
  id: string;
  order_id: string;
  captured_at: string;
  image_url: string;
  consignee_name: string;
  receiver_name: string;
  dock_number?: string;
  seal_number: string;
  seal_intact: boolean;
  manifest_pallets: number;
  received_pallets: number;
  weight_lbs?: number;
  os_d_status: 'Clean / Accepted' | 'Over / Short' | 'Damaged Exception';
  ocr_confidence_pct: number;
  ocr_extracted_text?: string;
  bol_number: string;
  driver_id: string;
  driver_name: string;
  signature_name?: string;
  notes?: string;
}

export interface OrderHistoryEntry {
  id: string;
  timestamp: string;
  event_type: 'Order Created' | 'Dispatched' | 'Dock Arrival' | 'PoD Captured' | 'OCR Processed' | 'Delivered' | 'Exception';
  description: string;
  actor: string;
  metadata?: {
    bol_number?: string;
    consignee?: string;
    pallets?: number;
    seal_number?: string;
    ocr_confidence?: number;
    has_photo?: boolean;
    dock_number?: string;
  };
}

export interface Order {
  order_id: string;
  shipper_name: string;
  origin_city: string;
  origin_state_prov: string;
  dest_city: string;
  dest_state_prov: string;
  distance_miles: number;
  weight_lbs: number;
  pallets: number;
  equipment_required: EquipmentType;
  rate_cad: number;
  pickup_window: string;
  delivery_window?: string;
  status: OrderStatus;
  assigned_truck_id?: string;
  assigned_driver_id?: string;
  notes?: string;
  pod_document?: ProofOfDeliveryDocument;
  history?: OrderHistoryEntry[];
}

export interface FaultCode {
  spn: number;
  fmi: number;
  description: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  occurrenceCount: number;
  recommendedAction: string;
}

export interface TelematicsData {
  engineRpm: number;
  speedMph: number;
  oilPressurePsi: number;
  coolantTempF: number;
  batteryVolts: number;
  defLevelPct: number;
  fuelLevelPct: number;
  fuelBurnRateGalHr: number;
  ambientTempC: number;
  faultCodes: FaultCode[];
}

export interface Equipment {
  unit_id: string;
  make_model: string;
  year: number;
  engine_spec: string;
  gross_vehicle_weight_rating_lbs: number;
  current_odometer: number;
  next_service_due_miles: number;
  status: 'Online' | 'Idle' | 'In-Transit' | 'Diagnostic Alert' | 'In-Shop';
  telematics: TelematicsData;
  location: string;
}

export type DriverDutyStatus = 'Driving' | 'On-Duty' | 'Sleeper Berth' | 'Off-Duty';

export interface AuditLogEntry {
  tripId: string;
  date: string;
  destination: string;
  status: 'On-Time' | 'Early' | 'Delayed';
  varianceMins: number;
  hosStatus: 'Clean' | 'Warning' | 'Violation';
  notes: string;
}

export interface DriverPerformanceMetrics {
  totalTripsCompleted: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeRatePct: number;
  hosCleanStreakDays: number;
  hosViolationsCount: number;
  hosWarningsCount: number;
  restBreakAdherencePct: number;
  averageDeliveryVarianceMins: number;
  compositeSafetyScore: number;
  hosScore: number;
  deliveryAccuracyScore: number;
  ratingTier: 'Elite Fleet Master' | 'Compliant Pro' | 'Satisfactory' | 'Audit Flagged';
  recentAuditLogs: AuditLogEntry[];
}

export interface Driver {
  driver_id: string;
  name: string;
  phone: string;
  home_terminal: string;
  current_location: string;
  drive_time_remaining_hours: number;  // 11-hour rule
  shift_time_remaining_hours: number;  // 14-hour rule
  cycle_time_remaining_hours: number;  // 70-hour 8-day rule
  fast_card_approved: boolean;
  hazmat_endorsement: boolean;
  duty_status: DriverDutyStatus;
  current_truck_id?: string;
  active_order_id?: string;
  performance?: DriverPerformanceMetrics;
}

export interface TripRecord {
  trip_id: string;
  order_id: string;
  truck_id: string;
  driver_id: string;
  origin: string;
  destination: string;
  loaded_miles: number;
  deadhead_miles: number;
  fuel_burned_gallons: number;
  avg_mpg: number;
  idle_hours: number;
  avg_speed_mph: number;
  customs_delay_mins: number;
  status: 'Active' | 'Completed' | 'En-Route';
  departure_time: string;
  estimated_arrival: string;
}

export interface FreightItem {
  freight_sku: string;
  commodity: string;
  handling_type: 'Chill' | 'Deep Freeze' | 'HazMat Spec' | 'Standard Dry';
  target_temp_c: number;
  current_temp_c: number;
  max_temp_drift_c: number;
  is_hazmat: boolean;
  hazmat_class: string;
  associated_truck_id: string;
  associated_order_id: string;
  spoilage_status: 'Optimal' | 'Caution' | 'Imminent Risk';
  estimatedHoursToCritical: number;
}

export interface BackhaulOpportunity {
  id: string;
  shipper: string;
  origin_city: string;
  dest_city: string;
  rate_cad: number;
  distance_miles: number;
  weight_lbs: number;
  pallets: number;
  equipment: EquipmentType;
  deadhead_saved_miles: number;
  net_profit_gain_cad: number;
  corridor: string;
}

export interface OperationalAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'TELEMATICS' | 'HOS' | 'COLD_CHAIN' | 'CUSTOMS' | 'DISPATCH';
  title: string;
  message: string;
  relatedUnitId?: string;
  relatedDriverId?: string;
  actionRequired: string;
}

export interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  title: string;
  terminal: string;
  avatarInitials: string;
  driverId?: string;
  truckId?: string;
}

export interface WeatherHazardData {
  latitude: number;
  longitude: number;
  locationName: string;
  temperatureC: number;
  temperatureF: number;
  apparentTempC: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedMph: number;
  windGustsMph: number;
  windDirectionDeg: number;
  relativeHumidityPct: number;
  precipitationMm: number;
  visibilityMiles: number;
  hazardLevel: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'CLEAR';
  primaryHazardTitle: string;
  hazardSummary: string;
  roadCondition: 'Dry' | 'Wet / Spray' | 'Slush / Hydroplaning' | 'Snow Covered' | 'Black Ice / Glaze';
  blowoverRisk: 'Low' | 'Moderate' | 'High (Empty Trailers)' | 'Extreme (All Profiles)';
  chainLawActive: boolean;
  recommendedSpeedReductionMph: number;
  truckingAdvisories: string[];
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'dispatcher' | 'driver';
  senderName: string;
  senderRole: string;
  timestamp: string;
  text: string;
  read: boolean;
  priority?: 'normal' | 'urgent';
}

export type AgentActionType = 
  | 'DISPATCH_LOAD' 
  | 'SCHEDULE_SERVICE' 
  | 'CLEAR_FAULT_CODE' 
  | 'UPDATE_DUTY_STATUS' 
  | 'CREATE_ALERT' 
  | 'DISMISS_ALERT' 
  | 'NAVIGATE_TAB' 
  | 'SWITCH_OPERATOR' 
  | 'CREATE_ORDER' 
  | 'OPTIMIZE_DEADHEAD';

export interface AgentAction {
  id: string;
  actionType: AgentActionType;
  title: string;
  description: string;
  params: Record<string, any>;
  status: 'pending' | 'executed' | 'failed' | 'rejected';
  executedAt?: string;
  resultSummary?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  thought?: string;
  timestamp: string;
  actions?: AgentAction[];
}


