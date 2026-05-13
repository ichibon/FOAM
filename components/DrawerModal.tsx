import { useEffect, useRef, useState } from "react";
import { Animated, Modal } from "react-native";

const DURATION = 280;
const SLIDE_OFFSET = 700;

interface DrawerModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export function DrawerModal({ visible, onRequestClose, children }: DrawerModalProps) {
  const slideAnim = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SLIDE_OFFSET,
        duration: DURATION,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flex: 1,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
