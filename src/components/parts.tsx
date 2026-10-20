import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { buildChart, CHART } from '../logic';
import { nf } from '../format';
import { C, F, R } from '../theme';
import { Workout } from '../types';
import { card, Icon, Txt } from './ui';

export const workoutMeta = (w: Workout) =>
  [w.min + ' min', w.dist ? nf(w.dist) + ' km' : null, w.fc ? Math.round(w.fc) + ' bpm' : null, w.int].filter(Boolean).join(' · ');

export function WorkoutCard({ w, icon, showObs, onLongPress }: { w: Workout; icon: string; showObs?: boolean; onLongPress?: () => void }) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [card, { flexDirection: 'row', gap: 14, padding: 14, alignItems: showObs ? 'flex-start' : 'center', opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.modIcon}>
        <Icon name={icon} color={C.onPrimaryContainer} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt v="titleMedium" style={{ flex: 1 }} numberOfLines={1}>
            {w.mod}
          </Txt>
          <Txt v="titleSmall" color={C.primary}>
            {Math.round(w.kcal)} kcal
          </Txt>
        </View>
        <Txt v="bodySmall" color={C.onSurfaceVariant}>
          {workoutMeta(w)}
        </Txt>
        {showObs && w.obs ? (
          <Txt v="bodySmall" style={{ marginTop: 4 }}>
            “{w.obs}”
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

export function BodyChart({ chart }: { chart: NonNullable<ReturnType<typeof buildChart>> }) {
  const [w, setW] = useState(0);
  const h = (w * CHART.H) / CHART.W;
  const { X0, X1, Y0, Y1 } = CHART;
  const mid = (Y0 + Y1) / 2;
  const label = { fontFamily: F.medium, fontSize: 11, fill: C.onSurfaceVariant };
  return (
    <View style={[card, { paddingTop: 12, paddingHorizontal: 8, paddingBottom: 8 }]}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 ? (
          <Svg width={w} height={h} viewBox={`0 0 ${CHART.W} ${CHART.H}`}>
            <Path d={`M${X0} ${Y0}H${X1}M${X0} ${mid}H${X1}M${X0} ${Y1}H${X1}`} stroke={C.outlineVariant} strokeWidth={1} strokeDasharray="3 4" fill="none" />
            <Path d={chart.area} fill={C.primary90} opacity={0.7} />
            <Polyline points={chart.points} fill="none" stroke={C.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={chart.lastX} cy={chart.lastY} r={5} fill={C.primary} stroke={C.surface} strokeWidth={2.5} />
            <SvgText {...label} x={30} y={Y0 + 4} textAnchor="end">{chart.yMax}</SvgText>
            <SvgText {...label} x={30} y={mid + 4} textAnchor="end">{chart.yMid}</SvgText>
            <SvgText {...label} x={30} y={Y1 + 4} textAnchor="end">{chart.yMin}</SvgText>
            <SvgText {...label} x={X0} y={170} textAnchor="start">{chart.xStart}</SvgText>
            <SvgText {...label} x={X1} y={170} textAnchor="end">{chart.xEnd}</SvgText>
          </Svg>
        ) : (
          <View style={{ aspectRatio: CHART.W / CHART.H }} />
        )}
      </View>
    </View>
  );
}

export function Spark({ points, width = 56, height = 20 }: { points: string; width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <Polyline points={points} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Foto 3:4 com rótulo do ângulo; vazia quando não há imagem. */
export function PhotoTile({ uri, angle, big }: { uri?: string; angle?: string; big?: boolean }) {
  const has = !!uri;
  return (
    <View
      style={{
        aspectRatio: 3 / 4,
        borderRadius: big ? R.md : R.sm,
        overflow: 'hidden',
        backgroundColor: has ? C.surfaceContainerHigh : 'transparent',
        borderWidth: has ? 0 : 1,
        borderStyle: 'dashed',
        borderColor: C.outlineVariant,
      }}
    >
      {has ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {angle ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {has ? (
            <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 10 10">
              <Defs>
                <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000" stopOpacity={0} />
                  <Stop offset="1" stopColor="#000" stopOpacity={0.55} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="10" height="10" fill="url(#fade)" />
            </Svg>
          ) : null}
          <Txt v="labelSmall" color={has ? C.neutral100 : C.onSurfaceVariant} style={{ paddingTop: 14, paddingHorizontal: 6, paddingBottom: 5 }}>
            {angle}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export function EmptyBox({ children, dashed = true }: { children: string; dashed?: boolean }) {
  return (
    <View
      style={{
        padding: 20,
        borderRadius: R.md,
        borderWidth: dashed ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: C.outlineVariant,
        backgroundColor: dashed ? 'transparent' : C.surfaceContainerLow,
        alignItems: 'center',
      }}
    >
      <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ textAlign: 'center' }}>
        {children}
      </Txt>
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 4 }}>
      <Txt v="titleMedium">{title}</Txt>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  modIcon: {
    width: 44,
    height: 44,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
