import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { lookupCep, formatCep } from './cep';
import { getCondo, updateCondo, useManagerCondo } from './manager.api';
import type { ManagerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'EditInfo'>;
const RADII = [100, 250, 500, 1000];

/** Editar informações do interfone (nome, foto, endereço, raio). */
export function EditInterfoneScreen({ navigation }: Props) {
  const condo = useManagerCondo();
  const id = condo?.condoId;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(250);

  useEffect(() => {
    if (!id) return;
    getCondo(id).then((d) => {
      setName(d.name);
      setPhoto(d.photo_url);
      setCep(d.address.zip_code ?? '');
      setStreet(d.address.street ?? '');
      setNumber(d.address.number ?? '');
      setDistrict(d.address.district ?? '');
      setCity(d.address.city ?? '');
      setUf(d.address.state ?? '');
      if (d.geo) { setGeo({ lat: +d.geo.latitude, lng: +d.geo.longitude }); setRadius(d.geo.radius_m); }
    }).finally(() => setLoading(false));
  }, [id]);

  const pickPhoto = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true, allowsEditing: true, aspect: [16, 10] });
    if (!r.canceled && r.assets[0]?.base64) setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
  };
  const onCepBlur = async () => {
    if (cep.replace(/\D/g, '').length !== 8) return;
    try { const a = await lookupCep(cep); setStreet(a.street); setDistrict(a.district); setCity(a.city); setUf(a.state); } catch {}
  };
  const useLocation = async () => {
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  };

  const save = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await updateCondo(id, {
        name, photo_url: photo ?? undefined, zip_code: cep, street, street_number: number, district, city, state: uf,
        geo: geo ? { latitude: geo.lat, longitude: geo.lng, radius_m: radius } : undefined,
      });
      Alert.alert('Salvo', 'Informações atualizadas.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao salvar.');
    } finally { setBusy(false); }
  };

  if (loading) return <SafeAreaView style={styles.screen} />;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Editar interfone</Text>

        <Pressable style={styles.photoBox} onPress={pickPhoto}>
          {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Text style={styles.photoHint}>＋ Trocar foto</Text>}
        </Pressable>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Field label="CEP" value={cep} onChangeText={(v) => setCep(formatCep(v))} onBlur={onCepBlur} keyboardType="number-pad" maxLength={9} />
        <Field label="Rua" value={street} onChangeText={setStreet} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field label="Número" value={number} onChangeText={setNumber} keyboardType="number-pad" /></View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1.4 }}><Field label="Bairro" value={district} onChangeText={setDistrict} /></View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 2 }}><Field label="Cidade" value={city} onChangeText={setCity} /></View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}><Field label="UF" value={uf} onChangeText={setUf} maxLength={2} autoCapitalize="characters" /></View>
        </View>

        <Text style={styles.label}>Raio de atuação</Text>
        <Pressable style={[styles.loc, geo && styles.locOn]} onPress={useLocation}>
          <Text style={[styles.locText, geo && { color: colors.success }]}>{geo ? '📍 Localização definida ✓' : '📍 Usar minha localização'}</Text>
        </Pressable>
        <View style={styles.chips}>
          {RADII.map((m) => (
            <Pressable key={m} onPress={() => setRadius(m)} style={[styles.chip, radius === m && styles.chipOn]}>
              <Text style={[styles.chipText, radius === m && styles.chipTextOn]}>{m >= 1000 ? `${m / 1000} km` : `${m} m`}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: spacing.xl }} />
        <PrimaryButton label={busy ? 'Salvando…' : 'Salvar alterações'} onPress={save} loading={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.lg },
  row: { flexDirection: 'row' },
  photoBox: { height: 140, borderRadius: radii.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: colors.textSecondary, fontSize: typography.size.md },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: typography.weight.medium, marginTop: spacing.sm },
  loc: { height: 50, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, marginBottom: spacing.md },
  locOn: { borderColor: colors.success, backgroundColor: colors.successBg },
  locText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.md },
  chipTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
});
