import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme';

/** QR code visual (react-native-qrcode-svg / react-native-svg). */
export function QrImage({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <View style={{ padding: size > 100 ? 12 : 4, backgroundColor: '#fff', borderRadius: 12 }}>
      <QRCode value={value || ' '} size={size} color={colors.text} backgroundColor="#fff" />
    </View>
  );
}
