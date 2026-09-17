import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, CartItem } from "../types";
import { useToast } from "./ToastContext";
import { safeGetLocalStorage, safeSetLocalStorage } from "../utils/storage";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedImageCode?: string, selectedImageUrl?: string) => void;
  updateItemCode: (productId: string, code: string, imageUrl?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  buyNow: (product: Product, selectedImageCode?: string, selectedImageUrl?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = safeGetLocalStorage("auracart_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    safeSetLocalStorage("auracart_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (
    product: Product,
    quantity: number = 1,
    selectedImageCode?: string,
    selectedImageUrl?: string
  ) => {
    setItems(prev => {
      // Find matching item by product.id and matching selectedImageCode (if applicable)
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && (!selectedImageCode || item.selectedImageCode === selectedImageCode)
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          selectedImageCode: selectedImageCode || updated[existingIdx].selectedImageCode,
          selectedImageUrl: selectedImageUrl || updated[existingIdx].selectedImageUrl
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            selectedImageCode,
            selectedImageUrl: selectedImageUrl || product.imageUrl
          }
        ];
      }
    });
    addToast(`Added "${product.title}" ${selectedImageCode ? `[${selectedImageCode}]` : ""} to cart!`, "success");
  };

  const updateItemCode = (productId: string, code: string, imageUrl?: string) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            selectedImageCode: code,
            selectedImageUrl: imageUrl || item.selectedImageUrl || item.product.imageUrl
          };
        }
        return item;
      });
    });
  };

  const removeItem = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    setItems(prev => prev.filter(i => i.product.id !== productId));
    if (item) {
      addToast(`Removed "${item.product.title}" from cart`, "info");
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const buyNow = (product: Product, selectedImageCode?: string, selectedImageUrl?: string) => {
    setItems(prev => {
      const existsIdx = prev.findIndex(i => i.product.id === product.id);
      if (existsIdx > -1) {
        const updated = [...prev];
        if (selectedImageCode) updated[existsIdx].selectedImageCode = selectedImageCode;
        if (selectedImageUrl) updated[existsIdx].selectedImageUrl = selectedImageUrl;
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedImageCode,
          selectedImageUrl: selectedImageUrl || product.imageUrl
        }
      ];
    });
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemCode,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        buyNow
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
