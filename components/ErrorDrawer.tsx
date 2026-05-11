import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Drawer, Layout } from "@/constants/design";
import { ErrorState, type ErrorStateProps } from "./ErrorState";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

export interface ErrorDrawerProps {
  visible: boolean;
  onDismiss?: () => void;
  /**
   * severity, recovery, icon, headline, body, ctaLabel are all passed through
   * to ErrorState. ctaAction and ghostAction are intercepted so the drawer
   * dismisses itself before executing the caller's action.
   */
  severity: ErrorStateProps["severity"];
  recovery: ErrorStateProps["recovery"];
  icon: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaAction: () => void;
  ghostLabel?: string;
  ghostAction?: () => void;
  errorCode?: string;
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
  ctaAction,
  ghostLabel,
  ghostAction,
  errorCode,
  children,
}: ErrorDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_MAX_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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

  const handleCta = () => {
    onDismiss?.();
    setTimeout(ctaAction, 250);
  };

  const handleGhost = ghostAction
    ? () => {
        onDismiss?.();
        setTimeout(ghostAction, 250);
      }
    : undefined;

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
              ctaAction={handleCta}
              ghostLabel={ghostLabel}
              ghostAction={handleGhost}
              errorCode={errorCode}
              fullScreen={false}
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
