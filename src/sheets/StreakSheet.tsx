import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Button, Grid, Icon, Txt } from '../components/ui';
import { add, pd, WD } from '../format';
import { streakInfo } from '../logic';
import { useDiary } from '../store';
import { C, R } from '../theme';

function Flame({ lit, celebrate }: { lit: boolean; celebrate: boolean }) {
  const pop = useRef(new Animated.Value(celebrate ? 0 : 1)).current;
  const flicker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: celebrate ? 800 : 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: celebrate ? 800 : 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    if (celebrate) {
      pop.setValue(0);
      Animated.timing(pop, { toValue: 1, duration: 700, easing: Easing.bezier(0.2, 0.9, 0.3, 1.3), useNativeDriver: true }).start(() => loop.start());
    } else loop.start();
    return () => loop.stop();
  }, [celebrate, pop, flicker]);

  const scale = Animated.multiply(
    pop.interpolate({ inputRange: [0, 0.55, 0.75, 1], outputRange: [0.3, 1.18, 0.95, 1] }),
    flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }),
  );
  const rotate = pop.interpolate({ inputRange: [0, 0.55, 1], outputRange: ['-8deg', '4deg', '0deg'] });
  const translateY = flicker.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={{ opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ scale }, { rotate }, { translateY }] }}>
      <Icon name="local-fire-department" size={72} color={lit ? C.flame : C.outline} />
    </Animated.View>
  );
}

export function StreakSheet({ celebrate, onClose }: { celebrate: boolean; onClose: () => void }) {
  const { data, today } = useDiary();
  const si = streakInfo(data.diet, today);
  const title = celebrate ? 'Sequência estendida!' : si.todayDone ? 'Dia fechado. Até amanhã!' : si.count ? 'Não perca sua sequência' : 'Comece sua sequência';
  const sub = celebrate
    ? 'Você registrou sua dieta ' + si.count + (si.count === 1 ? ' dia' : ' dias') + ' seguidos.'
    : si.todayDone
      ? 'Volte amanhã para continuar.'
      : 'Marque como foi o dia na aba Dieta antes da meia-noite.';

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <View style={{ width: 112, height: 112, borderRadius: R.full, backgroundColor: si.todayDone ? C.flameBg : C.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        <Flame lit={si.todayDone} celebrate={celebrate} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Txt v="displaySmall" style={{ fontFamily: 'Satoshi-Bold' }} color={si.todayDone ? C.flameFg : C.onSurfaceVariant}>
          {si.count + ' ' + (si.count === 1 ? 'dia' : 'dias')}
        </Txt>
        <Txt v="titleMedium" style={{ marginTop: 4 }}>
          {title}
        </Txt>
        <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ marginTop: 4, textAlign: 'center' }}>
          {sub}
        </Txt>
      </View>

      <Grid cols={7} gap={4} style={{ alignSelf: 'stretch', paddingVertical: 14, paddingHorizontal: 8, borderRadius: R.md, backgroundColor: C.surfaceContainer }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = add(today, i - 6);
          const on = si.done(d);
          const isT = d === today;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6 }}>
              <Txt v="labelMedium" color={isT ? C.onSurface : C.onSurfaceVariant}>
                {WD[pd(d).getDay()]}
              </Txt>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: R.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? C.flame : 'transparent',
                  borderWidth: 2,
                  borderStyle: isT && !on ? 'dashed' : 'solid',
                  borderColor: on || isT ? C.flame : C.outlineVariant,
                }}
              >
                {on ? <Icon name="local-fire-department" size={20} color={C.neutral100} /> : null}
              </View>
            </View>
          );
        })}
      </Grid>

      <Grid cols={2} style={{ alignSelf: 'stretch' }}>
        <View style={{ padding: 12, borderRadius: R.md, borderWidth: 1, borderColor: C.outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="emoji-events" size={20} color={C.flame} />
            <Txt v="titleLarge">{String(si.best)}</Txt>
          </View>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>
            recorde de dias
          </Txt>
        </View>
        <View style={{ padding: 12, borderRadius: R.md, borderWidth: 1, borderColor: C.outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="event-available" size={20} color={C.primary} />
            <Txt v="titleLarge">{String(si.total)}</Txt>
          </View>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>
            dias registrados
          </Txt>
        </View>
      </Grid>

      <Button onPress={onClose} style={{ alignSelf: 'stretch' }}>
        {celebrate ? 'CONTINUAR' : 'FECHAR'}
      </Button>
    </View>
  );
}
