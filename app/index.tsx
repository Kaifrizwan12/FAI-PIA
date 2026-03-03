import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { Colors, Fonts } from "@/constants/theme";
import { getHeight, getWidth } from "@/hooks/use-responsive-sizing";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";

import EvilIcons from "@expo/vector-icons/EvilIcons";
import { router } from "expo-router";
// import Svg, {
//   Use,
//   Image,
// } from 'react-native-svg';

const Icon2 = require("../assets/svgs/Scanning-visual-metaphor.svg");
const Icon = require("../assets/svgs/Overlay-Border-Shadow.svg");

export default function HomeScreen() {
  const colorScheme = "light";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <Image source={Icon} style={styles.personImage} />
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
        Smart Attendance
      </Text>
      <Text style={[styles.titleSec, { color: Colors[colorScheme].textSec }]}>
        Face Recognition Based Attendance with GPS Verification
      </Text>
      <Image source={Icon2} style={styles.mainImage} contentFit="contain" />
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.gpsBadge]}>
          <EvilIcons
            name="location"
            size={0.05 * getWidth()}
            color="#2463EB"
            weight="700"
            style={{ marginRight: 3 }}
          />
          <Text style={styles.statusText}>GPS ENABLED</Text>
        </View>
        <View style={[styles.statusBadge, styles.secureBadge]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={0.05 * getWidth()}
            color="#059668"
            style={{ marginRight: 3 }}
          />
          <Text style={styles.status2Text}>SECURE</Text>
        </View>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => router.push("/attendance")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <AntDesign name="arrow-right" size={Math.round(0.046 * getWidth())} color="white" />
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 0.01 * getWidth(), marginTop: 0.02 * getHeight() }}>
        <Ionicons
          name="shield-checkmark-outline"
          size={Math.round(0.036 * getWidth())}
          color={Colors[colorScheme].textSec}
        />
        <Text
          style={[styles.titleSec2, { color: Colors[colorScheme].textSec }]}
        >
          Secure & Location Verified
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  titleSec2: {
    fontSize: 0.03 * getWidth(),
    fontWeight: "400",
    textAlign: "center",
  },

  button: {
    backgroundColor: Colors.light.buttonBg,
    paddingVertical: 0.019 * getHeight(),
    paddingHorizontal: 0.062 * getWidth(),
    borderRadius: 0.09 * getWidth(),
    alignItems: "center",
    gap: 0.02 * getWidth(),
    width: "80%",
    flexDirection: "row",
    justifyContent: "center",

    marginTop: 0.1 * getHeight(),
  },
  buttonText: {
    color: "#fff",
    fontSize: 0.045 * getWidth(),
    fontWeight: "600",
    fontFamily: Fonts.sans,
  },

  personImage: {
    width: 0.167 * getWidth(),
    height: 0.167 * getWidth(),
    marginTop: 0.1 * getHeight(),
    marginBottom: 0.019 * getHeight(),
  },
  title: {
    fontSize: 0.06 * getWidth(),
    fontWeight: "700",
    fontFamily: Fonts.sans,
  },
  mainImage: {
    height: 0.3 * getHeight(),
    marginTop: 0.065 * getHeight(),
    width: "90%",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.02 * getWidth(),
    marginTop: 0.014 * getHeight(),
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 0.007 * getHeight(),
    paddingHorizontal: 0.031 * getWidth(),
    flexDirection: "row",
    alignItems: "center",
  },
  gpsBadge: {
    backgroundColor: "#2463eb31",
  },
  secureBadge: {
    backgroundColor: "#0596682a",
  },
  statusText: {
    color: "#2463EB",
    fontSize: 0.03 * getWidth(),
    fontWeight: "700",
    opacity: 1,
    letterSpacing: 0.3,
  },
  status2Text: {
    color: "#059668",
    fontSize: 0.03 * getWidth(),
    fontWeight: "700",
    opacity: 1,
    letterSpacing: 0.3,
  },
  titleSec: {
    fontSize: 0.04 * getWidth(),
    fontWeight: "400",
    marginTop: 0.01 * getHeight(),
    alignItems: "center",
    textAlign: "center",
    width: "80%",
  },
});
