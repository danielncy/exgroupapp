export type BrandId = "ex_style" | "ex_beauty" | "uhair" | "coulisse";

export interface Brand {
  id: string;
  code: BrandId;
  name: string;
  type: "hair_salon" | "beauty" | "scalp_specialist";
  logo_url: string;
  primary_color: string;
  accent_color: string;
  country: "MY" | "SG";
  created_at: string;
}
