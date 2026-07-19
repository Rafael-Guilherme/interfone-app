import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, radii } from '../theme';
import type { DayStatus, DiaCalendario } from '../features/resident/resident.api';

/**
 * Calendário mensal de ocupação de uma área comum, compartilhado entre morador
 * e gestor. A reserva é sempre por dia inteiro, então cada dia é um alvo só.
 *
 * Cores (definidas com o cliente):
 *   cinza    — indisponível (bloqueado pela administração ou fora da janela)
 *   vermelho — ocupado por outro morador
 *   verde    — ocupado por você
 *   azul     — ocupado pela administração
 */
// Cores SÓLIDAS (fundo cheio + texto branco), para cada estado ficar
// inconfundível no calendário e na legenda. Os tons pastel de antes se
// confundiam entre si e com "livre".
const CORES: Record<DayStatus, { bg: string; fg: string }> = {
  livre: { bg: colors.card, fg: colors.text }, // branco com borda (único selecionável)
  meu: { bg: '#1FA463', fg: '#FFFFFF' }, // verde — sua reserva
  pendente: { bg: '#E0930B', fg: '#FFFFFF' }, // âmbar — aguardando aprovação
  ocupado: { bg: '#E5484D', fg: '#FFFFFF' }, // vermelho — outro morador
  administracao: { bg: '#2563C9', fg: '#FFFFFF' }, // azul — administração
  bloqueado: { bg: '#8A8F9C', fg: '#FFFFFF' }, // cinza — indisponível
  fora_janela: { bg: '#EDEEF1', fg: '#B9BDC7' }, // fora da janela: apagado de propósito
};

export const LEGENDA: { status: DayStatus; label: string }[] = [
  { status: 'livre', label: 'Livre' },
  { status: 'meu', label: 'Sua reserva' },
  { status: 'pendente', label: 'Aguardando' },
  { status: 'ocupado', label: 'Outro morador' },
  { status: 'administracao', label: 'Administração' },
  { status: 'bloqueado', label: 'Indisponível' },
];

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "YYYY-MM-DD" → partes, sem passar por Date (evita deslocamento de fuso). */
const partes = (dia: string) => {
  const [a, m, d] = dia.split('-').map(Number);
  return { ano: a, mes: m, dia: d };
};

export function Calendario({
  days,
  selecionado,
  onSelect,
  selecionavel = (s: DayStatus) => s === 'livre',
}: {
  days: DiaCalendario[];
  selecionado?: string | null;
  onSelect: (dia: DiaCalendario) => void;
  /** Quais status podem ser tocados. O gestor usa outra regra do morador. */
  selecionavel?: (s: DayStatus) => boolean;
}) {
  // Agrupa por mês e alinha o 1º dia na coluna certa da semana.
  const meses = useMemo(() => {
    const mapa = new Map<string, DiaCalendario[]>();
    for (const d of days) {
      const { ano, mes } = partes(d.day);
      const chave = `${ano}-${mes}`;
      const lista = mapa.get(chave);
      if (lista) lista.push(d);
      else mapa.set(chave, [d]);
    }
    return [...mapa.entries()].map(([chave, dias]) => {
      const [ano, mes] = chave.split('-').map(Number);
      const primeiroDiaSemana = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
      return { chave, ano, mes, dias, primeiroDiaSemana };
    });
  }, [days]);

  return (
    <View>
      {meses.map((m) => {
        // O 1º dia do mês pode não ser o 1º da lista (o calendário começa hoje).
        const offset = m.primeiroDiaSemana + (partes(m.dias[0].day).dia - 1);
        return (
          <View key={m.chave} style={styles.mes}>
            <Text style={styles.mesTitulo}>
              {MESES[m.mes - 1]} de {m.ano}
            </Text>
            <View style={styles.semana}>
              {SEMANA.map((s, i) => (
                <Text key={i} style={styles.semanaLabel}>{s}</Text>
              ))}
            </View>
            <View style={styles.grade}>
              {Array.from({ length: offset % 7 }, (_, i) => (
                <View key={`v${i}`} style={styles.celula} />
              ))}
              {m.dias.map((d) => {
                const cor = CORES[d.status];
                const ativo = selecionavel(d.status);
                const marcado = selecionado === d.day;
                return (
                  <Pressable
                    key={d.day}
                    disabled={!ativo}
                    onPress={() => onSelect(d)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !ativo, selected: marcado }}
                    style={styles.celula}
                  >
                    <View
                      style={[
                        styles.dia,
                        { backgroundColor: cor.bg },
                        d.status === 'livre' && styles.diaLivre,
                        marcado && styles.diaMarcado,
                      ]}
                    >
                      <Text style={[styles.diaTexto, { color: marcado ? colors.textOnAccent : cor.fg }]}>
                        {partes(d.day).dia}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function Legenda({ itens = LEGENDA }: { itens?: typeof LEGENDA }) {
  return (
    <View style={styles.legenda}>
      {itens.map((l) => (
        <View key={l.status} style={styles.legendaItem}>
          <View
            style={[
              styles.legendaCor,
              { backgroundColor: CORES[l.status].bg },
              // Só o "livre" (branco) precisa de contorno para aparecer.
              l.status === 'livre' && { borderWidth: 1, borderColor: colors.border },
            ]}
          />
          <Text style={styles.legendaTexto}>{l.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mes: { marginBottom: spacing.xl },
  mesTitulo: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  semana: { flexDirection: 'row', marginBottom: spacing.xs },
  semanaLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  dia: { flex: 1, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' },
  diaLivre: { borderWidth: 1, borderColor: colors.border },
  diaMarcado: { backgroundColor: colors.accent, borderColor: colors.accent },
  diaTexto: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendaCor: { width: 16, height: 16, borderRadius: 4 },
  legendaTexto: { fontSize: typography.size.xs, color: colors.text },
});
