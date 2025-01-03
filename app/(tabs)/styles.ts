import { StyleSheet } from "react-native";

 const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
    imageButton: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: 'transparent',
    minHeight: 100,
  },
  pickedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  lowPriority: {
    backgroundColor: '#e8f5e9',
  },
  mediumPriority: {
    backgroundColor: '#fff3e0',
  },
  highPriority: {
    backgroundColor: '#ffebee',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  savedEntriesCard: {
    backgroundColor: 'rgba(33, 115, 70, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  savedEntriesText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoImage: {
    height: 120,
    width: 120,
    bottom: 20,
    alignSelf: 'center',
    position: 'absolute',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    borderRadius: 8,
  },
  priorityButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityButtonContent: {
    flexDirection: 'column',
    height: 70,
  },
});


export default styles;