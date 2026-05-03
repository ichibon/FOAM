export type UserRole = "customer" | "detailer" | "crew";
export type VehicleType = "sedan" | "suv" | "truck" | "van" | "coupe" | "other";
export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type RecurrenceRule = "weekly" | "biweekly" | "monthly";
export type PaymentStatus = "pending" | "captured" | "paid_out" | "refunded" | "failed";
export type SubscriptionTier = "starter" | "pro" | "crew";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type PhotoType = "before" | "after" | "damage";
export type ClaimStatus = "triggered" | "redeemed" | "expired";

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DetailerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  bio?: string;
  service_radius?: number;
  home_base_lat?: number;
  home_base_lng?: number;
  stripe_account_id?: string;
  is_active: boolean;
  is_verified: boolean;
  avg_rating?: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface DetailerSummary extends DetailerProfile {
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
}

export interface CrewMember {
  id: string;
  user_id: string;
  owner_id: string;
  display_name?: string;
  is_active: boolean;
  can_view_customer_contact: boolean;
  can_reschedule_jobs: boolean;
  can_view_team_earnings: boolean;
  commission_rate?: number;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  rain_protection_active: boolean;
  rain_protection_sub_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vehicle_type?: VehicleType;
  notes?: string;
  is_default: boolean;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  detailer_id: string;
  name: string;
  description?: string;
  duration_mins: number;
  base_price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface ServiceAddon {
  id: string;
  detailer_id: string;
  name: string;
  description?: string;
  price: number;
  duration_mins: number;
  is_active: boolean;
}

export interface VehicleSizePricing {
  id: string;
  package_id: string;
  vehicle_type: VehicleType;
  price_adjustment: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  detailer_id: string;
  crew_member_id?: string;
  vehicle_id: string;
  package_id: string;
  status: BookingStatus;
  scheduled_at: string;
  estimated_duration_mins?: number;
  service_address?: string;
  service_lat?: number;
  service_lng?: number;
  subtotal?: number;
  tip_amount: number;
  platform_fee?: number;
  total?: number;
  is_recurring: boolean;
  recurrence_rule?: RecurrenceRule;
  parent_booking_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  scheduled_at: string;
  service_address?: string;
  subtotal?: number;
  tip_amount: number;
  total?: number;
  is_recurring: boolean;
  recurrence_rule?: RecurrenceRule;
  notes?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  detailer_name?: string;
  detailer_phone?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vehicle_type?: VehicleType;
  package_name?: string;
  duration_mins?: number;
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  price: number;
}

export interface BookingPhoto {
  id: string;
  booking_id: string;
  photo_url: string;
  photo_type: PhotoType;
  uploaded_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id?: string;
  amount?: number;
  tip_amount: number;
  platform_fee?: number;
  payout_amount?: number;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  detailer_id: string;
  rating: number;
  body?: string;
  created_at: string;
}

export interface DetailerSubscription {
  id: string;
  detailer_id: string;
  stripe_subscription_id?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

export interface RainProtectionClaim {
  id: string;
  customer_id: string;
  booking_id: string;
  rain_detected_at?: string;
  precipitation_inches?: number;
  zip_code?: string;
  claim_status: ClaimStatus;
  redemption_booking_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}
