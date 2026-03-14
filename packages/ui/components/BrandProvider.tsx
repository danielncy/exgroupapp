"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { brandTokens } from "../tokens/brands";
import type { BrandTokens } from "../tokens/brands";
import type { BrandId } from "@ex-group/shared";

const BRAND_NAMES: Record<BrandId, string> = {
  ex_style: "EX Style",
  ex_beauty: "EX Beauty",
  uhair: "UHair",
  coulisse: "Coulisse",
};

export interface BrandContextValue {
  id: BrandId;
  name: string;
  colors: BrandTokens;
}

const BrandContext = createContext<BrandContextValue | null>(null);

interface BrandProviderProps {
  brandId?: BrandId;
  children: ReactNode;
}

export function BrandProvider({ brandId = "ex_style", children }: BrandProviderProps) {
  const value = useMemo<BrandContextValue>(
    () => ({
      id: brandId,
      name: BRAND_NAMES[brandId],
      colors: brandTokens[brandId],
    }),
    [brandId],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
