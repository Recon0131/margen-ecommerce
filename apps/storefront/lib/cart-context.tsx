'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { CartLine } from '../lib/api-client';
import { createCart, getUserCart } from '../lib/api-client';
import { useAuth } from './auth-context';

type CartState = {
  lines: CartLine[];
  totalQuantity: number;
  loading: boolean;
  addLine: (sku: string, quantity: number) => Promise<void>;
  setQuantity: (sku: string, quantity: number) => Promise<void>;
  removeLine: (sku: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const linesRef = useRef<CartLine[]>([]);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      loadedRef.current = true;
      setLines([]);
      setLoading(false);
      return;
    }
    loadedRef.current = false;
    setLoading(true);
    getUserCart()
      .then((cart) => {
        if (cancelled) return;
        setLines(cart.lines);
        loadedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        loadedRef.current = true;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const persist = useCallback(
    async (next: CartLine[]) => {
      if (!user) return;
      const cart = await createCart(next);
      setLines(cart.lines);
    },
    [user],
  );

  const addLine = useCallback(
    async (sku: string, quantity: number) => {
      const prev = linesRef.current;
      const next = [...prev];
      const i = next.findIndex((l) => l.sku === sku);
      if (i >= 0) next[i] = { ...next[i], quantity: Math.min(next[i].quantity + quantity, 100) };
      else next.push({ sku, quantity: Math.min(quantity, 100) });
      setLines(next);
      await persist(next);
    },
    [persist],
  );

  const setQuantity = useCallback(
    async (sku: string, quantity: number) => {
      const prev = linesRef.current;
      let next: CartLine[];
      if (quantity <= 0) next = prev.filter((l) => l.sku !== sku);
      else next = prev.map((l) => (l.sku === sku ? { ...l, quantity: Math.min(quantity, 100) } : l));
      setLines(next);
      await persist(next);
    },
    [persist],
  );

  const removeLine = useCallback(
    async (sku: string) => {
      const prev = linesRef.current;
      const next = prev.filter((l) => l.sku !== sku);
      setLines(next);
      await persist(next);
    },
    [persist],
  );

  const clear = useCallback(async () => {
    setLines([]);
    if (user) {
      try {
        await createCart([]);
      } catch {
        // ignore persistence errors on clear
      }
    }
  }, [user]);

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, totalQuantity, loading, addLine, setQuantity, removeLine, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
