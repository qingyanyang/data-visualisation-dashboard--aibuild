"use client";

import { useQuery } from "@tanstack/react-query";

interface Product {
  id: number;
  name: string;
  sku: string | null;
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch products");
  }

  const data = await res.json();
  return data.products;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });
}
