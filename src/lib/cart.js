import { readCart, writeCart, cartKey } from './store.js';

export const isIphone = (item) => item.category === 'iphones';

export function addToCart(item) {
  const cart = readCart();
  const key = cartKey(item.productId, item.variant);
  const existing = cart.find((c) => cartKey(c.productId, c.variant) === key);
  if (existing) {
    existing.qty = Math.min(existing.qty + item.qty, item.stock);
  } else {
    cart.push({ ...item, qty: Math.min(item.qty, item.stock) });
  }
  writeCart(cart);
}

export function updateQty(productId, variant, qty) {
  const cart = readCart()
    .map((c) => (c.productId === productId && c.variant === variant ? { ...c, qty } : c))
    .filter((c) => c.qty > 0);
  writeCart(cart);
}

export function removeLine(productId, variant) {
  writeCart(readCart().filter((c) => !(c.productId === productId && c.variant === variant)));
}

export function clearCart() {
  writeCart([]);
}
