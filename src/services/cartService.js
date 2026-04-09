// src/services/cartService.js
const CART_STORAGE_KEY = 'cart';

/**
 * Save cart items to localStorage
 * @param {Array} cartItems - Array of cart items
 */
export const saveCart = (cartItems) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

/**
 * Load cart items from localStorage
 * @returns {Array} Array of cart items
 */
export const loadCart = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

/**
 * Clear all cart items from localStorage
 */
export const clearCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

/**
 * Get cart item count
 * @returns {number} Number of items in cart
 */
export const getCartCount = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const cart = savedCart ? JSON.parse(savedCart) : [];
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
};

/**
 * Check if cart has items
 * @returns {boolean} True if cart has items
 */
export const hasCartItems = () => {
  return getCartCount() > 0;
};

/**
 * Add item to cart
 * @param {Object} item - Cart item to add
 */
export const addToCartStorage = (item) => {
  const cart = loadCart();
  const existingIndex = cart.findIndex(i => i.id === item.id);
  
  if (existingIndex !== -1) {
    cart[existingIndex].quantity += item.quantity || 1;
  } else {
    cart.push(item);
  }
  
  saveCart(cart);
  // Dispatch event for real-time updates
  window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Remove item from cart
 * @param {string} itemId - ID of item to remove
 */
export const removeFromCartStorage = (itemId) => {
  const cart = loadCart();
  const updatedCart = cart.filter(item => item.id !== itemId);
  saveCart(updatedCart);
  window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Update item quantity
 * @param {string} itemId - ID of item to update
 * @param {number} quantity - New quantity
 */
export const updateCartQuantity = (itemId, quantity) => {
  const cart = loadCart();
  const updatedCart = cart.map(item => 
    item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
  );
  saveCart(updatedCart);
  window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Get total cart value
 * @returns {number} Total value of all items in cart
 */
export const getCartTotal = () => {
  try {
    const cart = loadCart();
    return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  } catch (error) {
    console.error('Error getting cart total:', error);
    return 0;
  }
};