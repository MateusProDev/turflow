import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const addToCart = (item) => {
    setCart((prevCart) => [...prevCart, item]);
    setTotal((prevTotal) => prevTotal + (item.preco || item.price || 0));
  };

  const removeFromCart = (index) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      const removedItem = newCart.splice(index, 1)[0];
      const itemPrice = removedItem.preco || removedItem.price || 0;
      setTotal((prevTotal) => {
        const newTotal = prevTotal - itemPrice;
        return newTotal < 0 ? 0 : newTotal; // Garante que o total não seja negativo
      });
      return newCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, total, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};