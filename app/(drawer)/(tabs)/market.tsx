import { StyleSheet, Text, View } from 'react-native';

export default function MarketScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Markets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B09',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
