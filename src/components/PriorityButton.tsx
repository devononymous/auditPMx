import { Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { PriorityButtonProps } from '../types';

export function PriorityButton({ 
  priority, 
  currentPriority, 
  onPress, 
  icon, 
  label, 
  colors 
}: PriorityButtonProps) {
  return (
    <Button
      mode={currentPriority === priority ? 'contained' : 'outlined'}
      onPress={onPress}
      icon={icon}
      style={[
        styles.button,
        { 
          backgroundColor: currentPriority === priority ? colors.background : 'transparent',
          borderColor: colors.border 
        }
      ]}
      labelStyle={styles.label}
      contentStyle={styles.content}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'column',
    height: 70,
  },
}); 