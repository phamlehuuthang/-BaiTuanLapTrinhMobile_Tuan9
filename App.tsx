import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaView } from 'react-native';
import store from './store'; 
import CartScreen from './screen/CartScreen';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <CartScreen />
      </SafeAreaView>
    </Provider>
  );
}