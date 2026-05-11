import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Drawer, Layout } from "@/constants/design";
import { ErrorState, type ErrorStateProps } from "./ErrorState";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

export interface ErrorDrawerProps extends ErrorStateProps {
  visible: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function ErrorDrawer({
  visible,
  onDismiss,
  severity,
  recovery,
  icon,
  headline,
  body,
  ctaLabel,
  retryAction,
  navigateTo,
  ghostLabel,
  ghostAction,
  errorCode,
  children,
}: ErrorDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_MAX_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const lastRetry = useRef(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: Drawer.animationDuration,
          useNativeDriver: true,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: Drawer.animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: DRAWER_MAX_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCtaPress = () => {
    if (recovery === "retry") {
      const now = Date.now();
      if (now - lastRetry.current < 1000) return;
      lastRetry.current = now;
      retryAction?.();
    } else if (recovery === "navigate" && navigateTo) {
      onDismiss?.();
      setTimeout(
        () => router.push(navigateTo as Parameters<typeof router.push>[0]),
        250,
      );
    } else if (recovery === "support") {
      Linking.openURL("mailto:support@foamauto.app");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateY }], maxHeight: DRAWER_MAX_HEIGHT },
          ]}
        >
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ErrorState
              severity={severity}
              recovery={recovery}
              icon={icon}
              headline={headline}
              body={body}
              ctaLabel={ctaLabel}
              retryAction={retryAction}
              navigateTo={navigateTo}
              ghostLabel={ghostLabel}
              ghostAction={ghostAction}
              errorCode={errorCode}
              fullScreen={false}
              onCtaPress={handleCtaPress}
            />

            {children && (
              <View style={styles.childrenContainer}>{children}</View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Drawer.backdropError,
  },
  drawer: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  dragHandleRow: {
    width: "100%",
    alignItems: "center",
    paddingTop: Drawer.dragHandleTopOffset,
    paddingBottom: 4,
  },
  dragHandle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  childrenContainer: {
    paddingHorizontal: Layout.screenPaddingH,
    marginTop: 8,
  },
});
