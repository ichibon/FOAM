import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Drawer } from "@/constants/design";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.87;
const DISMISS_THRESHOLD = 80;
const DISMISS_VELOCITY = 0.5;

interface DrawerModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export function DrawerModal({ visible, onRequestClose, children }: DrawerModalProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const panDelta = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      panDelta.setValue(0);
      setModalVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: Drawer.animationDuration,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: Drawer.animationDuration,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible, translateY, panDelta]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 4 && dy > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) panDelta.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > DISMISS_THRESHOLD || vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            panDelta.setValue(0);
            onRequestClose();
          });
        } else {
          Animated.spring(panDelta, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panDelta, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    })
  ).current;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <Pressable style={styles.scrim} onPress={onRequestClose} />
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: Animated.add(translateY, panDelta) }] },
        ]}
      >
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Drawer.backdropStandard,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    overflow: "hidden",
  },
  handleZone: {
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    paddingTop: 10,
  },
  handle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
  },
  content: {
    flex: 1,
  },
});
