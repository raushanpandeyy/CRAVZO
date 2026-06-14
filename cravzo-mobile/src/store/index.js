import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { createMMKV } from "react-native-mmkv";

import userReducer from "./slices/userSlice";
import cartReducer from "./slices/cartSlice";
import foodReducer from "./slices/foodSlice";
import vendorReducer from "./slices/vendorSlice";


const storageInstance = createMMKV();


const reduxStorage = {
  setItem: (key, value) => {
    storageInstance.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key) => {
    const value = storageInstance.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key) => {
    storageInstance.delete(key);
    return Promise.resolve(true);
  },
};

const persistConfig = {
  key: "root",
  storage: reduxStorage, 
  whitelist: ["user", "cart"],
};

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  food: foodReducer,
  vendor: vendorReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
