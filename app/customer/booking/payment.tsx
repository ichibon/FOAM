import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStripe } from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type PaymentStatus = "idle" | "loading" | "confirming" | "success" | "error";

export default function BookingPaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { session } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingAmount, setBookingAmount] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (bookingId) {
      initializePayment();
    }
  }, [bookingId]);

  const initializePayment = useCallback(async () => {
    if (!bookingId || !session?.user) return;

    try {
      setStatus("loading");
      setErrorMessage(null);

      const supabase = getSupabase();

      // Ensure customer has a Stripe customer record
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not authenticated");

      await supabase.functions.invoke("stripe-create-customer", {
        body: {
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
        },
      });

      // Fetch customer profile ID
      const { data: customerProfile } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!customerProfile) throw new Error("Customer profile not found");

      // Fetch booking amount for display
      const { data: booking } = await supabase
        .from("bookings")
        .select("subtotal")
        .eq("id", bookingId)
        .single();

      if (booking) setBookingAmount(Number(booking.subtotal));

      // Create payment intent (authorization hold)
      const { data: intentData, error: intentError } =
        await supabase.functions.invoke("stripe-create-payment-intent", {
          body: {
            booking_id: bookingId,
            customer_id: customerProfile.id,
          },
        });

      if (intentError) throw new Error(intentError.message);
      if (!intentData?.client_secret)
        throw new Error("No client secret returned");

      // Initialize Stripe PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "FOAM",
        paymentIntentClientSecret: intentData.client_secret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          email: user.email,
        },
        appearance: {
          colors: {
            primary: "#339DC7",
            background: "#0F2F3C",
            componentBackground: "#1C5268",
            componentBorder: "rgba(255,255,255,0.15)",
            componentDivider: "rgba(255,255,255,0.08)",
            primaryText: "#FFFFFF",
            secondaryText: "rgba(255,255,255,0.6)",
            componentText: "#FFFFFF",
            placeholderText: "rgba(255,255,255,0.35)",
            icon: "#339DC7",
          },
          shapes: {
            borderRadius: 12,
          },
        },
      });

      if (initError) throw new Error(initError.message);

      setInitialized(true);
      setStatus("idle");
    } catch (err) {
      console.error("Payment init error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to initialize payment"
      );
      setStatus("error");
    }
  }, [bookingId, session]);

  async function handlePay() {
    if (!initialized) return;

    try {
      setStatus("confirming");
      setErrorMessage(null);

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === "Canceled") {
          // User dismissed the sheet — not an error
          setStatus("idle");
          return;
        }
        throw new Error(error.message);
      }

      setStatus("success");

      // Navigate to booking confirmation
      router.replace({
        pathname: "/customer/booking/confirmation",
        params: { bookingId },
      });
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Payment failed. Please try again."
      );
      setStatus("error");
    }
  }

  const isLoading = status === "loading" || status === "confirming";

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#339DC7" />
        <Text style={styles.loadingText}>Preparing payment…</Text>
      </SafeAreaView>
    );
  }

  if (status === "success") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#339DC7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          disabled={isLoading}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        {/* Amount summary */}
        {bookingAmount !== null && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Authorization hold</Text>
            <Text style={styles.summaryAmount}>
              ${bookingAmount.toFixed(2)}
            </Text>
            <Text style={styles.summaryNote}>
              Your card will be held but not charged until the service is
              complete.
            </Text>
          </View>
        )}

        {/* Error message */}
        {status === "error" && errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={initializePayment} style={styles.retryLink}>
              <Text style={styles.retryLinkText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Accepts Visa, Mastercard, Amex, Apple Pay, Google Pay, and Cash App
            Pay.
          </Text>
        </View>
      </View>

      {/* Pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payBtn,
            (!initialized || isLoading) && styles.payBtnDisabled,
          ]}
          onPress={handlePay}
          disabled={!initialized || isLoading}
        >
          {status === "confirming" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>
              {bookingAmount !== null
                ? `Authorize $${bookingAmount.toFixed(2)}`
                : "Authorize Payment"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Secured by Stripe · PCI DSS compliant
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F2F3C",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0F2F3C",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  backBtn: {
    width: 80,
  },
  backBtnText: {
    color: "#339DC7",
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#1C5268",
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  summaryNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryLinkText: {
    color: "#339DC7",
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  infoText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    padding: 20,
    paddingBottom: 8,
    gap: 10,
  },
  payBtn: {
    backgroundColor: "#339DC7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  payBtnDisabled: {
    opacity: 0.45,
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  footerNote: {
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
  },
  loadingText: {
    marginTop: 16,
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    textAlign: "center",
  },
});
