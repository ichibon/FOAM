import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

export type UserRole = "customer" | "operator" | "manager" | "team_member";

export interface FoamUser {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
}

// SecureStore has a 2048 byte value limit — chunk large values (tokens can exceed this)
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    try {
      const numChunksStr = await SecureStore.getItemAsync(`${key}.chunks`);
      if (!numChunksStr) return SecureStore.getItemAsync(key);
      const n = parseInt(numChunksStr, 10);
      const chunks = await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`))
      );
      if (chunks.some((c) => c === null)) return null;
      return (chunks as string[]).join("");
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await SecureStore.setItemAsync(`${key}.chunks`, String(chunks.length));
      await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}.${i}`, c)));
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    try {
      const numChunksStr = await SecureStore.getItemAsync(`${key}.chunks`);
      if (numChunksStr) {
        const n = parseInt(numChunksStr, 10);
        await SecureStore.deleteItemAsync(`${key}.chunks`);
        await Promise.all(
          Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`))
        );
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
