import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    if (products.find(saveProduct => saveProduct.id === product.id)) {
      setProducts(state =>
        state.map(stateProduct => {
          if (stateProduct.id === product.id) {
            stateProduct.quantity++;
          }
          return stateProduct;
        }),
      );
    } else {
      setProducts(state => [...state, { ...product, quantity: 1 }]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }
  }, []);

  const increment = useCallback(async id => {
    setProducts(state =>
      state.map(product => {
        if (product.id === id) {
          product.quantity++;
        }
        return product;
      }),
    );
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, []);

  const decrement = useCallback(async id => {
    const product = products.find(p => p.id === id);
    if (!!product?.quantity && product.quantity <= 1) {
      setProducts(state => state.filter(product => product.id !== id));
      return;
    }
    setProducts(state =>
      state.map(product => {
        if (product.id === id) {
          product.quantity--;
        }
        return product;
      }),
    );
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
