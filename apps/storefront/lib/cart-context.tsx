'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CartLine } from '../lib/api-client';

type CartState = {
  lines: CartLine[];
  totalQuantity: number;
  addLine: (sku: string, quantity: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  removeLine: (sku: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = 'margen_cart';

function loadLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(loadLines());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    }
  }, [lines]);

  const addLine = useCallback((sku: string, quantity: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.sku === sku);
      if (existing) {
        return prev.map((l) => (l.sku === sku ? { ...l, quantity: Math.min(l.quantity + quantity, 100) } : l));
      }
      return [...prev, { sku, quantity: Math.min(quantity, 100) }];
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.sku !== sku));
    } else {
      setLines((prev) => prev.map((l) => (l.sku === sku ? { ...l, quantity: Math.min(quantity, 100) } : l)));
    }
  }, []);

  const removeLine = useCallback((sku: string) => {
    setLines((prev) => prev.filter((l) => l.sku !== sku));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, totalQuantity, addLine, setQuantity, removeLine, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
