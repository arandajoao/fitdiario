import React, { useRef, useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, View } from 'react-native';
import { Button, Icon, TextField, Txt } from '../components/ui';
import { useDiary } from '../store';
import { C, R } from '../theme';

const ROW = 48; // altura da linha
const STEP = ROW + 4; // linha + espaçamento

export function MealsSheet({ onClose, onDragging }: { onClose: () => void; onDragging: (d: boolean) => void }) {
  const { data, actions } = useDiary();
  const meals = data.meals;
  const [newMeal, setNewMeal] = useState('');
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const startY = useRef(0);

  const over = drag ? Math.max(0, Math.min(meals.length - 1, drag.from + Math.round(drag.dy / STEP))) : null;

  const shiftFor = (i: number) => {
    if (!drag || over == null || i === drag.from) return 0;
    if (drag.from < over && i > drag.from && i <= over) return -STEP;
    if (drag.from > over && i >= over && i < drag.from) return STEP;
    return 0;
  };

  const grant = (i: number, e: GestureResponderEvent) => {
    startY.current = e.nativeEvent.pageY;
    setDrag({ from: i, dy: 0 });
    onDragging(true);
  };
  const move = (e: GestureResponderEvent) => {
    setDrag((d) => (d ? { ...d, dy: e.nativeEvent.pageY - startY.current } : d));
  };
  const release = () => {
    if (drag && over != null && over !== drag.from) {
      const a = meals.slice();
      const [it] = a.splice(drag.from, 1);
      a.splice(over, 0, it);
      actions.setMeals(a);
    }
    setDrag(null);
    onDragging(false);
  };

  const remove = (name: string) =>
    Alert.alert('Remover refeição?', name, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => actions.setMeals(meals.filter((m) => m !== name)) },
    ]);

  const add = () => {
    const n = newMeal.trim();
    if (!n || meals.includes(n)) return;
    actions.setMeals([...meals, n]);
    setNewMeal('');
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Txt v="headlineSmall">Minhas refeições</Txt>
        <Txt v="bodyMedium" color={C.onSurfaceVariant}>
          Elas aparecem todo dia no registro da dieta.
        </Txt>
      </View>

      <View style={{ gap: 4 }}>
        {meals.map((m, i) => {
          const dragging = drag?.from === i;
          return (
            <View
              key={m}
              style={{
                height: ROW,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: R.sm,
                backgroundColor: dragging ? C.surfaceContainerHighest : 'transparent',
                zIndex: dragging ? 2 : 1,
                elevation: dragging ? 4 : 0,
                transform: [{ translateY: dragging ? drag!.dy : shiftFor(i) }],
              }}
            >
              <View
                accessibilityLabel="Arrastar para reordenar"
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderTerminationRequest={() => false}
                onResponderGrant={(e) => grant(i, e)}
                onResponderMove={move}
                onResponderRelease={release}
                onResponderTerminate={release}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="drag-indicator" size={22} color={C.onSurfaceVariant} />
              </View>
              <Txt v="bodyLarge" style={{ flex: 1 }} numberOfLines={1}>
                {m}
              </Txt>
              <Pressable
                accessibilityLabel={'Remover ' + m}
                onPress={() => remove(m)}
                style={({ pressed }) => ({ width: 40, height: 40, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.error90 : 'transparent' })}
              >
                <Icon name="delete" size={22} color={C.error} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <TextField style={{ flex: 1 }} label="Nova refeição" placeholder="Ex.: Ceia" value={newMeal} onChangeText={setNewMeal} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar refeição"
          onPress={add}
          style={{ width: 48, height: 48, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: C.secondaryContainer }}
        >
          <Icon name="add" color={C.onSecondaryContainer} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button onPress={onClose}>PRONTO</Button>
      </View>
    </View>
  );
}
