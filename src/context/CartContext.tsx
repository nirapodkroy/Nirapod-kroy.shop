import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, CartItem } from "../types";
import { useToast } from "./ToastContext";
import { safeGetLocalStorage, safeSetLocalStorage } from "../utils/storage";
import { getProductImagesWithCodes } from "../utils/productCodeHelper";

interface CartContextType {
  items: CartItem[];
  directCheckoutItem: CartItem | null;
  setDirectCheckoutItem: (item: CartItem | null) => void;
  updateDirectItemCode: (code: string, imageUrl?: string) => void;
  updateDirectItemSize: (size: string) => void;
  updateDirectItemQuantity: (delta: number) => void;
  addItem: (product: Product, quantity?: number, selectedImageCode?: string, selectedImageUrl?: string, selectedSize?: string) => void;
  updateItemCode: (productId: string, code: string, imageUrl?: string) => void;
  updateItemSize: (productId: string, size: string, oldSize?: string) => void;
  removeItem: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, delta: number, selectedSize?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  buyNow: (product: Product, selectedImageCode?: string, selectedImageUrl?: string, quantity?: number, selectedSize?: string) => void;
  openCartCheckout: () => void;
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
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
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
    selectedImageUrl?: string,
    selectedSize?: string
  ) => {
    const finalSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    setItems(prev => {
      // Find matching item by product.id, selectedImageCode, and selectedSize
      const existingIdx = prev.findIndex(
        item =>
          item.product.id === product.id &&
          (!selectedImageCode || item.selectedImageCode === selectedImageCode) &&
          (item.selectedSize === finalSize)
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          selectedImageCode: selectedImageCode || updated[existingIdx].selectedImageCode,
          selectedImageUrl: selectedImageUrl || updated[existingIdx].selectedImageUrl,
          selectedSize: finalSize || updated[existingIdx].selectedSize,
          productCode: product.productCode
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            selectedImageCode,
            selectedImageUrl: selectedImageUrl || product.imageUrl,
            selectedSize: finalSize,
            productCode: product.productCode
          }
        ];
      }
    });
    const sizeNote = finalSize ? ` (সাইজ: ${finalSize})` : "";
    addToast(`Added "${product.title}" ${selectedImageCode ? `[${selectedImageCode}]` : ""}${sizeNote} to cart!`, "success");
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

  const updateItemSize = (productId: string, size: string, oldSize?: string) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId && (!oldSize || item.selectedSize === oldSize)) {
          return {
            ...item,
            selectedSize: size
          };
        }
        return item;
      });
    });
  };

  const removeItem = (productId: string, selectedSize?: string) => {
    const item = items.find(i => i.product.id === productId && (!selectedSize || i.selectedSize === selectedSize));
    setItems(prev => prev.filter(i => !(i.product.id === productId && (!selectedSize || i.selectedSize === selectedSize))));
    if (item) {
      addToast(`Removed "${item.product.title}" from cart`, "info");
    }
  };

  const updateQuantity = (productId: string, delta: number, selectedSize?: string) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId && (!selectedSize || item.selectedSize === selectedSize)) {
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

  const buyNow = (
    product: Product,
    selectedImageCode?: string,
    selectedImageUrl?: string,
    quantity: number = 1,
    selectedSize?: string
  ) => {
    const imageItems = getProductImagesWithCodes(product);
    const chosenCode = selectedImageCode || imageItems[0]?.code || product.productCode || "P-01";
    const chosenUrl = selectedImageUrl || imageItems[0]?.url || product.imageUrl;
    const finalSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);

    setDirectCheckoutItem({
      product,
      quantity: Math.max(1, quantity),
      selectedImageCode: chosenCode,
      selectedImageUrl: chosenUrl,
      selectedSize: finalSize,
      productCode: product.productCode
    });
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const updateDirectItemCode = (code: string, imageUrl?: string) => {
    setDirectCheckoutItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedImageCode: code,
        selectedImageUrl: imageUrl || prev.selectedImageUrl || prev.product.imageUrl
      };
    });
  };

  const updateDirectItemSize = (size: string) => {
    setDirectCheckoutItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedSize: size
      };
    });
  };

  const updateDirectItemQuantity = (delta: number) => {
    setDirectCheckoutItem(prev => {
      if (!prev) return null;
      const nextQty = Math.max(1, Math.min(prev.product.stock || 99, prev.quantity + delta));
      return {
        ...prev,
        quantity: nextQty
      };
    });
  };

  const openCartCheckout = () => {
    setDirectCheckoutItem(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        directCheckoutItem,
        setDirectCheckoutItem,
        updateDirectItemCode,
        updateDirectItemSize,
        updateDirectItemQuantity,
        addItem,
        updateItemCode,
        updateItemSize,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        buyNow,
        openCartCheckout
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
