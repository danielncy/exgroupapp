import type { BrandId } from "@ex-group/shared";

export interface BrandTokens {
  primary: string;
  accent: string;
  surface: string;
  text: string;
}

export const brandTokens: Record<BrandId, BrandTokens> = {
  ex_style: {
    primary: "#1A1A2E",
    accent: "#E94560",
    surface: "#FAFAFA",
    text: "#1A1A2E",
  },
  ex_beauty: {
    primary: "#2D1B69",
    accent: "#FF6B9D",
    surface: "#FFF9FB",
    text: "#2D1B69",
  },
  uhair: {
    primary: "#0D3B66",
    accent: "#FAA307",
    surface: "#FFFCF2",
    text: "#0D3B66",
  },
  coulisse: {
    primary: "#1B4332",
    accent: "#95D5B2",
    surface: "#F8FFF9",
    text: "#1B4332",
  },
} as const;
