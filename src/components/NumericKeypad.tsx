import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface NumericKeypadProps {
  onDigitClick: (digit: string) => void;
  onClearClick: () => void;
  onBackspaceClick: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitClick,
  onClearClick,
  onBackspaceClick,
}) => {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'BACK'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((item, cIdx) => {
            if (item === 'BACK') {
              return (
                <TouchableOpacity
                  key={cIdx}
                  style={[styles.keyButton, styles.specialKey]}
                  onPress={onBackspaceClick}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="backspace" size={20} color={Colors.slate600} />
                </TouchableOpacity>
              );
            }
            if (item === 'C') {
              return (
                <TouchableOpacity
                  key={cIdx}
                  style={[styles.keyButton, styles.specialKey]}
                  onPress={onClearClick}
                  activeOpacity={0.7}
                >
                  <Text style={styles.specialKeyText}>C</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={cIdx}
                style={styles.keyButton}
                onPress={() => onDigitClick(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.digitText}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate800,
  },
  specialKey: {
    backgroundColor: Colors.slate200,
  },
  specialKeyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate600,
  },
});
