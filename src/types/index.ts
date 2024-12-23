// Define all interfaces and types
export interface FormData {
  slNo: string;
  location: string;
  observation: string;
  image: string | null;
  priority: 'low' | 'medium' | 'high';
  recommendation: string;
  status: string;
}

export interface PriorityButtonProps {
  priority: string;
  currentPriority: string;
  onPress: () => void;
  icon: string;
  label: string;
  colors: {
    background: string;
    border: string;
  };
} 