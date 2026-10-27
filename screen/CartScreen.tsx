import React from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount
} from '../slices/cartSlice';

export default function CartScreen() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemCount);

  const products = [
    { id: 1, name: 'Laptop', price: 1000 },
    { id: 2, name: 'Mouse', price: 25 },
    { id: 3, name: 'Keyboard', price: 80 }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Giỏ Hàng Nâng Cao</Text>

      <Text style={styles.subtitle}>Danh Sách Sản Phẩm</Text>
      <View style={styles.productList}>
        {products.map(product => (
          <Button
            key={product.id}
            title={`Thêm ${product.name} ($${product.price})`}
            onPress={() => dispatch(addToCart(product))}
          />
        ))}
      </View>

      <Text style={styles.subtitle}>Giỏ Hàng ({itemCount} sản phẩm)</Text>
      
      {cartItems.length === 0 ? (
        <Text>Giỏ hàng trống</Text>
      ) : (
        <ScrollView style={styles.cartList}>
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <Text style={{ flex: 1 }}>{item.name}</Text>
              
              {/* Cụm nút tăng giảm */}
              <View style={styles.quantityControl}>
                <Button title="-" onPress={() => dispatch(decreaseQuantity(item.id))} />
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Button title="+" onPress={() => dispatch(increaseQuantity(item.id))} />
              </View>

              <Text style={{ width: 70, textAlign: 'right' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
              <Button title="Xóa" color="red" onPress={() => dispatch(removeFromCart(item.id))} />
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.totalText}>Tổng Cộng: ${totalPrice.toFixed(2)}</Text>
        <Button title="Xóa Tất Cả" color="gray" onPress={() => dispatch(clearCart())} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  productList: { gap: 10, marginBottom: 20 },
  cartList: { flex: 1, marginVertical: 10 },
  cartItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderColor: '#ccc' 
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10 },
  quantityText: { fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 20, borderTopWidth: 1, paddingTop: 20 },
  totalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 }
});