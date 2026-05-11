import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ErrorDrawer } from "@/components/ErrorDrawer";
import { Colors } from "@/constants/design";

const SectionLabel = ({ label }: { label: string }) => (
  <View style={styles.sectionLabel}>
    <Text style={styles.sectionLabelText}>{label}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

export default function DevQA() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState<"error" | "warning">("error");

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Component QA</Text>
        <Text style={styles.headerSub}>EmptyState · ErrorState · ErrorDrawer</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── EmptyState: first_run ── */}
        <SectionLabel label="EmptyState — first_run" />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today tab (operator)</Text>
          <EmptyState
            variant="first_run"
            icon="calendar-days"
            headline="Wide open today."
            body="Share your booking link and put someone on the calendar."
            ctaLabel="Share My Link"
            ctaRoute="/operator/today"
            ghostLabel="Explore the app"
            ghostRoute="/operator/today"
            fullScreen={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Discover tab (customer)</Text>
          <EmptyState
            variant="first_run"
            icon="map-pin"
            headline="Let's find you a detailer."
            body="Top-rated mobile detailers and shops near you, all in one place."
            ctaLabel="Search Near Me"
            ctaRoute="/customer/discover"
            fullScreen={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Vehicles (customer)</Text>
          <EmptyState
            variant="first_run"
            icon="car"
            headline="No rides added yet."
            body="Add your vehicle once and we'll remember it for every booking."
            ctaLabel="Add a Vehicle"
            ctaRoute="/customer/vehicles/add"
            ghostLabel="I'll add it later"
            ghostRoute="/customer/profile"
            fullScreen={false}
          />
        </View>

        <Divider />

        {/* ── EmptyState: functional ── */}
        <SectionLabel label="EmptyState — functional" />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nothing booked</Text>
          <EmptyState
            variant="functional"
            icon="calendar-x"
            headline="Nothing on the books today."
            body="Open up your availability and share your booking link."
            ctaLabel="Share My Link"
            ctaRoute="/operator/today"
            fullScreen={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>No customers yet</Text>
          <EmptyState
            variant="functional"
            icon="users"
            headline="No customers yet."
            body="Do the work, the list will grow."
            ctaLabel="Share Booking Link"
            ctaRoute="/operator/profile/share"
            fullScreen={false}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Success state (all jobs assigned)</Text>
          <EmptyState
            variant="functional"
            icon="shield-check"
            iconColor="#16A34A"
            headline="All jobs assigned."
            body="Great work. Check back when new bookings come in."
            ctaLabel="View All Jobs"
            ctaRoute="/manager/bookings"
            fullScreen={false}
          />
        </View>

        <Divider />

        {/* ── ErrorState: warning ── */}
        <SectionLabel label="ErrorState — warning" />

        <View style={styles.card}>
          <ErrorState
            severity="warning"
            recovery="retry"
            icon="map-pin-off"
            headline="Nobody's nearby right now."
            body="We're growing fast. Try expanding your search area."
            ctaLabel="Expand Search"
            retryAction={() => {}}
          />
        </View>

        <Divider />

        {/* ── ErrorState: error ── */}
        <SectionLabel label="ErrorState — error" />

        <View style={styles.card}>
          <ErrorState
            severity="error"
            recovery="navigate"
            icon="credit-card"
            headline="Card declined."
            body="Your payment method didn't work. Update it and try again."
            ctaLabel="Update Payment"
            navigateTo="/customer/payments"
            ghostLabel="Try a different card"
            ghostAction={() => {}}
          />
        </View>

        <View style={styles.card}>
          <ErrorState
            severity="error"
            recovery="retry"
            icon="alert-circle"
            headline="Something went sideways."
            body="Give it another tap. If it keeps happening, let us know."
            ctaLabel="Try Again"
            retryAction={() => {}}
            ghostLabel="Contact Support"
            ghostAction={() => {}}
            errorCode="ERR-500-A"
          />
        </View>

        <Divider />

        {/* ── ErrorState: blocking ── */}
        <SectionLabel label="ErrorState — blocking (full screen preview)" />

        <View style={[styles.card, { height: 420 }]}>
          <Text style={styles.cardLabel}>No internet (blocking)</Text>
          <ErrorState
            severity="blocking"
            recovery="retry"
            icon="wifi-off"
            headline="You're offline."
            body="Check your connection and we'll pick up where you left off."
            ctaLabel="Try Again"
            retryAction={() => {}}
          />
        </View>

        <Divider />

        {/* ── ErrorDrawer ── */}
        <SectionLabel label="ErrorDrawer — bottom sheet" />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tap to open drawer</Text>

          <TouchableOpacity
            style={styles.drawerTrigger}
            onPress={() => {
              setDrawerType("error");
              setDrawerVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.drawerTriggerText}>Open Error Drawer (error)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.drawerTrigger, styles.drawerTriggerWarning]}
            onPress={() => {
              setDrawerType("warning");
              setDrawerVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.drawerTriggerText}>Open Error Drawer (warning)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <ErrorDrawer
        visible={drawerVisible}
        onDismiss={() => setDrawerVisible(false)}
        severity={drawerType}
        recovery="navigate"
        icon={drawerType === "error" ? "credit-card" : "alert-circle"}
        headline={drawerType === "error" ? "Card declined." : "Payment needs attention."}
        body={
          drawerType === "error"
            ? "Your payment method didn't work. Update it and try again."
            : "Your detail is complete but we couldn't process payment. Update your card to finish up."
        }
        ctaLabel={drawerType === "error" ? "Update Payment" : "Update Payment"}
        navigateTo="/customer/payments"
        ghostLabel="Contact Support"
        ghostAction={() => setDrawerVisible(false)}
        errorCode={drawerType === "error" ? "PMT-4242" : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: "#0F2F3C",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F4F4F5",
  },
  sectionLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#A3A3A3",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    overflow: "hidden",
    padding: 4,
  },
  cardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#A3A3A3",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  divider: {
    height: 8,
    backgroundColor: "#F4F4F5",
    marginVertical: 4,
  },
  drawerTrigger: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: 8,
    margin: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerTriggerWarning: {
    backgroundColor: "#D97706",
    marginTop: 0,
  },
  drawerTriggerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  bottomPad: {
    height: 100,
  },
});
