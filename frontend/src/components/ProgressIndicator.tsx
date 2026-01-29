import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FONT_FAMILIES } from "../config/fonts";

type ProgressIndicatorProps = {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps?: 3 | 4;
  theme: "lapis" | "obsidian" | "porcelain";
  onStepPress?: (step: number) => void;
};

const STEP_COLORS = {
  lapis: {
    active: "#0F1939",
    activeText: "#FFFFFF",
    inactive: "rgba(15, 25, 57, 0.1)",
    inactiveText: "#0F1939",
  },
  obsidian: {
    active: "#F392A0",
    activeText: "#202030",
    inactive: "rgba(243, 146, 160, 0.2)",
    inactiveText: "#F392A0",
  },
  porcelain: {
    active: "#6C6D2F",
    activeText: "#FFFFFF",
    inactive: "rgba(108, 109, 47, 0.15)",
    inactiveText: "#6C6D2F",
  },
};

export default function ProgressIndicator({
  currentStep,
  totalSteps = 4,
  theme,
  onStepPress,
}: ProgressIndicatorProps) {
  const colors = STEP_COLORS[theme];
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.pillContainer}>
        {steps.map((step) => {
          const isActive = step === currentStep;
          return (
            <TouchableOpacity
              key={step}
              style={[
                styles.step,
                {
                  backgroundColor: isActive ? colors.active : colors.inactive,
                },
              ]}
              onPress={() => onStepPress?.(step)}
              disabled={!onStepPress}
              activeOpacity={onStepPress ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    color: isActive ? colors.activeText : colors.inactiveText,
                  },
                ]}
              >
                0{step}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 30,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  stepText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
