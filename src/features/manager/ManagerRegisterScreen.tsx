import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography, radii } from '../../theme';
import { PrimaryButton, Field } from '../../components/ui';
import { api } from '../../api';
import { lookupCep, formatCep } from './cep';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ManagerRegister'>;

const RADII = [
  { m: 100, label: '100 m' },
  { m: 250, label: '250 m' },
  { m: 500, label: '500 m' },
  { m: 1000, label: '1 km' },
];
const STEPS = ['Interfone', 'Endereço', 'Estrutura', 'Raio', 'Revisão'];

interface CreatedCondo {
  id: string;
  name: string;
  join_code: string;
  qr_token: string;
  units: number;
}

function parseUnits(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s) && seen.add(s));
}

export function ManagerRegisterScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // form
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [cepBusy, setCepBusy] = useState(false);
  const [hasBlocks, setHasBlocks] = useState<boolean | null>(null);
  const [blocks, setBlocks] = useState<{ id: string; name: string; unitsText: string }[]>([
    { id: 'b1', name: '', unitsText: '' },
  ]);
  const [unitsText, setUnitsText] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(250);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permissão negada', 'Autorize o acesso às fotos para escolher uma imagem.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [16, 10],
    });
    if (!res.canceled && res.assets[0]?.base64) {
      setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const onCepBlur = async () => {
    if (cep.replace(/\D/g, '').length !== 8) return;
    setCepBusy(true);
    try {
      const a = await lookupCep(cep);
      setStreet(a.street);
      setDistrict(a.district);
      setCity(a.city);
      setUf(a.state);
    } catch (e: any) {
      Alert.alert('CEP', e.message ?? 'Não foi possível buscar o endereço.');
    } finally {
      setCepBusy(false);
    }
  };

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permissão negada', 'Autorize a localização para definir o raio.');
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  };

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return name.trim().length >= 2;
      case 1:
        return city.trim().length > 0 && uf.trim().length > 0;
      case 2:
        if (hasBlocks === null) return false;
        return hasBlocks
          ? blocks.some((b) => b.name.trim() && parseUnits(b.unitsText).length > 0)
          : parseUnits(unitsText).length > 0;
      case 3:
        return radius > 0;
      default:
        return true;
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload: any = {
        name: name.trim(),
        photo_url: photo ?? undefined,
        zip_code: cep || undefined,
        street: street || undefined,
        street_number: number || undefined,
        complement: complement || undefined,
        district: district || undefined,
        city: city || undefined,
        state: uf || undefined,
        has_blocks: !!hasBlocks,
        geo: geo ? { latitude: geo.lat, longitude: geo.lng, radius_m: radius } : undefined,
      };
      if (hasBlocks) {
        payload.blocks = blocks
          .filter((b) => b.name.trim() && parseUnits(b.unitsText).length)
          .map((b) => ({ name: b.name.trim(), units: parseUnits(b.unitsText).map((n) => ({ number: n })) }));
      } else {
        payload.units = parseUnits(unitsText).map((n) => ({ number: n }));
      }
      const created = await api.post<CreatedCondo>('/condominiums', payload);
      navigation.replace('RegisterSuccess', {
        condoName: created.name,
        joinCode: created.join_code,
        qrToken: created.qr_token,
      });
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível cadastrar o interfone.');
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => (step === 0 ? navigation.goBack() : setStep((s) => s - 1));
  const goNext = () => (step === STEPS.length - 1 ? submit() : setStep((s) => s + 1));

  return (
    <SafeAreaView style={styles.screen}>
      {/* header + stepper */}
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.stepLabel}>{`Passo ${step + 1} de ${STEPS.length} · ${STEPS[step]}`}</Text>
      </View>
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressBar, i <= step && styles.progressBarOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <StepTitle title="Seu interfone" sub="Dê um nome e, se quiser, uma foto do prédio." />
            <Pressable style={styles.photoBox} onPress={pickPhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <Text style={styles.photoHint}>＋ Escolher foto (opcional)</Text>
              )}
            </Pressable>
            <Field label="Nome do interfone" value={name} onChangeText={setName} placeholder="Ex.: Edifício Aurora" />
          </>
        )}

        {step === 1 && (
          <>
            <StepTitle title="Endereço" sub="Digite o CEP para preencher automaticamente." />
            <Field
              label={cepBusy ? 'CEP (buscando…)' : 'CEP'}
              value={cep}
              onChangeText={(v) => setCep(formatCep(v))}
              onBlur={onCepBlur}
              keyboardType="number-pad"
              placeholder="00000-000"
              maxLength={9}
            />
            <Field label="Rua" value={street} onChangeText={setStreet} placeholder="Logradouro" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Número" value={number} onChangeText={setNumber} placeholder="123" keyboardType="number-pad" />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1.4 }}>
                <Field label="Complemento" value={complement} onChangeText={setComplement} placeholder="Bloco/portaria" />
              </View>
            </View>
            <Field label="Bairro" value={district} onChangeText={setDistrict} />
            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Field label="Cidade" value={city} onChangeText={setCity} />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Field label="UF" value={uf} onChangeText={setUf} maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle title="Estrutura" sub="Este interfone tem blocos?" />
            <View style={styles.segment}>
              <SegBtn label="Tem blocos" active={hasBlocks === true} onPress={() => setHasBlocks(true)} />
              <SegBtn label="Sem blocos" active={hasBlocks === false} onPress={() => setHasBlocks(false)} />
            </View>
            {hasBlocks === false && (
              <>
                <Text style={styles.help}>Liste as unidades separadas por vírgula (ex.: Casa · ou 101, 102, 103).</Text>
                <Field label="Unidades" value={unitsText} onChangeText={setUnitsText} placeholder="Casa" multiline />
              </>
            )}
            {hasBlocks === true && (
              <>
                <Text style={styles.help}>Para cada bloco, informe o nome e as unidades (separadas por vírgula).</Text>
                {blocks.map((b, i) => (
                  <View key={b.id} style={styles.blockCard}>
                    <View style={styles.blockHead}>
                      <Text style={styles.blockNum}>Bloco {i + 1}</Text>
                      {blocks.length > 1 && (
                        <Pressable onPress={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))}>
                          <Text style={styles.remove}>remover</Text>
                        </Pressable>
                      )}
                    </View>
                    <Field
                      label="Nome do bloco"
                      value={b.name}
                      onChangeText={(v) => setBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, name: v } : x)))}
                      placeholder="Ex.: A"
                    />
                    <Field
                      label="Unidades"
                      value={b.unitsText}
                      onChangeText={(v) => setBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, unitsText: v } : x)))}
                      placeholder="101, 102, 103"
                      multiline
                    />
                  </View>
                ))}
                <Pressable
                  style={styles.addBlock}
                  onPress={() => setBlocks((bs) => [...bs, { id: `b${Date.now()}`, name: '', unitsText: '' }])}
                >
                  <Text style={styles.addBlockText}>＋ Adicionar bloco</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <StepTitle title="Raio de atuação" sub="Só dentro deste raio o convidado/entregador poderá usar o QR code para chamar pela web." />
            <Pressable style={[styles.locBtn, geo && styles.locBtnOn]} onPress={useMyLocation}>
              <Text style={[styles.locText, geo && styles.locTextOn]}>
                {geo ? '📍 Localização definida ✓' : '📍 Usar minha localização (centro do raio)'}
              </Text>
            </Pressable>
            <Text style={styles.help}>Fique no prédio ao definir a localização, para o centro do raio ficar correto.</Text>
            <View style={styles.chips}>
              {RADII.map((r) => (
                <Pressable key={r.m} onPress={() => setRadius(r.m)} style={[styles.chip, radius === r.m && styles.chipOn]}>
                  <Text style={[styles.chipText, radius === r.m && styles.chipTextOn]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            {!geo && <Text style={styles.warn}>Sem localização, o raio é salvo mas não será aplicado até você defini-la.</Text>}
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle title="Revisão" sub="Confira antes de cadastrar." />
            <Review label="Interfone" value={name} />
            <Review label="Endereço" value={[street, number, district, city && `${city}/${uf}`].filter(Boolean).join(', ') || '—'} />
            <Review
              label="Estrutura"
              value={
                hasBlocks
                  ? `${blocks.filter((b) => b.name.trim()).length} bloco(s) · ${blocks.reduce((n, b) => n + parseUnits(b.unitsText).length, 0)} unidade(s)`
                  : `${parseUnits(unitsText).length} unidade(s), sem blocos`
              }
            />
            <Review label="Raio" value={`${radius >= 1000 ? radius / 1000 + ' km' : radius + ' m'}${geo ? ' · com localização' : ' · sem localização'}`} />
            <Text style={styles.note}>
              Após o cadastro, o interfone fica <Text style={{ fontWeight: '600' }}>aguardando autorização do administrador</Text>.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={step === STEPS.length - 1 ? (busy ? 'Cadastrando…' : 'Cadastrar interfone') : 'Continuar'}
          onPress={goNext}
          loading={busy}
          disabled={!canNext()}
        />
      </View>
    </SafeAreaView>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}
function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.seg, active && styles.segOn]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
    </Pressable>
  );
}
function Review({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.review}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  back: { color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.sm },
  stepLabel: { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xl, marginTop: spacing.sm, marginBottom: spacing.md },
  progressBar: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.border },
  progressBarOn: { backgroundColor: colors.accent },
  body: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.text },
  sub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  row: { flexDirection: 'row' },
  photoBox: { height: 150, borderRadius: radii.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: colors.textSecondary, fontSize: typography.size.md },
  help: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  warn: { fontSize: typography.size.xs, color: colors.warning, marginTop: spacing.md },
  segment: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  seg: { flex: 1, height: 48, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  segOn: { borderColor: colors.text, backgroundColor: colors.text },
  segText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  segTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  blockCard: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  blockNum: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  remove: { color: colors.error, fontSize: typography.size.sm },
  addBlock: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  addBlockText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  locBtn: { height: 52, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, marginBottom: spacing.md },
  locBtnOn: { borderColor: colors.success, backgroundColor: colors.successBg },
  locText: { color: colors.text, fontSize: typography.size.md, fontWeight: typography.weight.medium },
  locTextOn: { color: colors.success },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: typography.size.md },
  chipTextOn: { color: colors.textOnAccent, fontWeight: typography.weight.semibold },
  review: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.lg },
  reviewLabel: { color: colors.textSecondary, fontSize: typography.size.sm },
  reviewValue: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.medium, flexShrink: 1, textAlign: 'right' },
  note: { marginTop: spacing.xl, fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
  footer: { padding: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
});
