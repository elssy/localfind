import React, { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@localfind/shared";

interface Props {
  children: React.ReactNode;
}

// On Android the window does not always shrink when the keyboard opens, so the
// form would sit behind it. We measure the keyboard and add that much space at
// the bottom of the form, which lets the person scroll the button into view.
// iOS has a built in way to do the same, so it is only used on Android.
function useAndroidKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) =>
      setHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

// The standard frame for any screen with form fields:
// 1. Keeps content clear of the notch, status bar and home bar (SafeAreaView
//    from react-native-safe-area-context, which works on both platforms).
// 2. Gives the form breathing room from the screen edges.
// 3. Scrolls, so a long form is never stuck behind the keyboard.
// 4. Tapping empty space closes the keyboard, while taps on buttons still work.
export default function FormScreen({ children }: Props) {
  const isIos = Platform.OS === "ios";
  const keyboardHeight = useAndroidKeyboardHeight();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={isIos ? "interactive" : "none"}
        automaticallyAdjustKeyboardInsets={isIos}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
});
