export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  outlet_id: string;
  stylist_id: string | null;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDetails extends Review {
  customer?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  outlet?: {
    id: string;
    name: string;
  } | null;
  stylist?: {
    id: string;
    name: string;
  } | null;
  booking?: {
    id: string;
    booking_date: string;
    service: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface CreateReviewInput {
  booking_id: string;
  rating: number;
  comment?: string;
}
