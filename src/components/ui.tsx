import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { iso, pd, short } from '../format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, T, TypeVariant } from '../theme';

/* ---------- Texto e ícone ---------- */

export function Txt({ v = 'bodyMedium', color = C.onSurface, style, ...rest }: TextProps & { v?: TypeVariant; color?: string }) {
  return <Text {...rest} style={[T[v], { color }, style]} />;
}

/** Material Icons; use o prefixo "mc:" para Material Community Icons (ex.: "mc:stethoscope"). */
export function Icon({ name, size = 24, color = C.onSurface, style }: { name: string; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  if (name.startsWith('mc:')) {
    return <MaterialCommunityIcons name={name.slice(3) as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={size} color={color} style={style} />;
  }
  return <MaterialIcons name={name as React.ComponentProps<typeof MaterialIcons>['name']} size={size} color={color} style={style} />;
}

/* ---------- Botões ---------- */

const BTN = {
  filled: { bg: C.primary, fg: C.onPrimary, border: undefined as string | undefined },
  tonal: { bg: C.secondaryContainer, fg: C.onSecondaryContainer, border: undefined },
  outlined: { bg: 'transparent', fg: C.primary, border: C.outline },
  text: { bg: 'transparent', fg: C.primary, border: undefined },
};

export function Button({
  variant = 'filled',
  size = 'medium',
  disabled,
  onPress,
  children,
  style,
}: {
  variant?: keyof typeof BTN;
  size?: 'small' | 'medium';
  disabled?: boolean;
  onPress?: () => void;
  children: string;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: R.full,
          minHeight: size === 'small' ? 32 : 40,
          paddingHorizontal: size === 'small' ? 16 : 24,
          backgroundColor: pressed && variant === 'text' ? C.primaryContainer : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.38 : pressed && variant !== 'text' ? 0.88 : 1,
        },
        style,
      ]}
    >
      <Txt v="labelLarge" color={v.fg}>
        {children}
      </Txt>
    </Pressable>
  );
}

export function IconBtn({
  icon,
  onPress,
  size = 40,
  iconSize = 24,
  color = C.primary,
  bg = 'transparent',
  label,
  style,
}: {
  icon: string;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  bg?: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.secondaryContainer : bg },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 12,
        borderRadius: R.sm,
        justifyContent: 'center',
        backgroundColor: selected ? C.secondaryContainer : pressed ? C.surfaceContainerHigh : 'transparent',
        borderWidth: 1,
        borderColor: selected ? C.secondaryContainer : C.outline,
      })}
    >
      <Txt v="labelLarge" color={selected ? C.onSecondaryContainer : C.onSurfaceVariant}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function FAB({ extended, label, onPress, bottom }: { extended?: boolean; label?: string; onPress: () => void; bottom: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || 'Adicionar'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom, paddingHorizontal: extended ? 20 : 0, width: extended ? undefined : 56, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Icon name="add" color={C.onPrimaryContainer} />
      {extended && label ? <Txt v="labelLarge" color={C.onPrimaryContainer}>{label}</Txt> : null}
    </Pressable>
  );
}

/* ---------- Campos ---------- */

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  supportingText,
  keyboardType,
  multiline,
  minHeight,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  supportingText?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const bc = error ? C.error : focused ? C.primary : C.outline;
  return (
    <View style={[{ gap: 4 }, style]}>
      {label ? (
        <Txt v="bodySmall" color={error ? C.error : focused ? C.primary : C.onSurfaceVariant} numberOfLines={1}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.outline}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          fontFamily: F.regular,
          fontSize: 16,
          color: C.onSurface,
          borderWidth: focused || error ? 2 : 1,
          borderColor: bc,
          borderRadius: R.xs,
          paddingHorizontal: focused || error ? 11 : 12,
          paddingVertical: multiline ? (focused || error ? 11 : 12) : 0,
          height: multiline ? undefined : 46,
          minHeight,
        }}
      />
      {supportingText ? (
        <Txt v="bodySmall" color={error ? C.error : C.onSurfaceVariant}>
          {supportingText}
        </Txt>
      ) : null}
    </View>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.outlineVariant }}>
      {tabs.map((t) => (
        <Pressable
          key={t}
          accessibilityRole="tab"
          accessibilityState={{ selected: t === value }}
          onPress={() => onChange(t)}
          style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 3, borderBottomColor: t === value ? C.primary : 'transparent', marginBottom: -1 }}
        >
          <Txt v="titleSmall" color={t === value ? C.primary : C.onSurfaceVariant}>
            {t}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function Switch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={6}
      style={{
        width: 52,
        height: 32,
        borderRadius: R.full,
        padding: value ? 4 : 6,
        justifyContent: 'center',
        backgroundColor: value ? C.primary : C.surfaceContainerHighest,
        borderWidth: value ? 0 : 2,
        borderColor: C.outline,
      }}
    >
      <View
        style={{
          width: value ? 24 : 16,
          height: value ? 24 : 16,
          borderRadius: R.full,
          backgroundColor: value ? C.onPrimary : C.outline,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

/** Campo de data com o seletor nativo (diálogo no Android, calendário no iOS). */
export function DateInput({
  label,
  value,
  onChange,
  maximumDate,
  fallback,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  maximumDate?: string;
  fallback: string;
}) {
  const [open, setOpen] = useState(false);
  const onPick = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android' || e.type !== 'set') setOpen(false);
    if (e.type === 'set' && d) {
      onChange(iso(d));
      if (Platform.OS === 'ios') setOpen(false);
    }
  };
  return (
    <View style={{ gap: 4 }}>
      <Txt v="bodySmall" color={open ? C.primary : C.onSurfaceVariant}>
        {label}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(!open)}
        style={{
          height: 46,
          borderWidth: open ? 2 : 1,
          borderColor: open ? C.primary : C.outline,
          borderRadius: R.xs,
          paddingHorizontal: open ? 11 : 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Txt style={{ fontFamily: F.regular, fontSize: 16 }} color={value ? C.onSurface : C.outline}>
          {value ? short(value) + ' ' + pd(value).getFullYear() : 'dd/mm/aaaa'}
        </Txt>
        <Icon name="calendar-today" size={18} color={C.onSurfaceVariant} />
      </Pressable>
      {open && Platform.OS !== 'ios' ? (
        <DateTimePicker value={pd(value || fallback)} mode="date" maximumDate={maximumDate ? pd(maximumDate) : undefined} onChange={onPick} />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', padding: 16 }} onPress={() => setOpen(false)}>
            <Pressable style={{ backgroundColor: C.surfaceContainerLow, borderRadius: R.xl, padding: 12 }}>
              <Txt v="labelLarge" color={C.onSurfaceVariant} style={{ paddingHorizontal: 8, paddingTop: 4 }}>
                {label}
              </Txt>
              <DateTimePicker
                value={pd(value || fallback)}
                mode="date"
                display="inline"
                maximumDate={maximumDate ? pd(maximumDate) : undefined}
                locale="pt-BR"
                accentColor={C.primary}
                themeVariant="light"
                onChange={onPick}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

/** Opção grande selecionável (ícone, título, subtítulo e check). */
export function OptionCard({ icon, label, sub, selected, onPress }: { icon: string; label: string; sub: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: R.md,
        borderWidth: 1,
        borderColor: selected ? C.primary : C.outlineVariant,
        backgroundColor: selected ? C.primaryContainer : 'transparent',
      }}
    >
      <Icon name={icon} color={selected ? C.onPrimaryContainer : C.onSurfaceVariant} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="titleSmall">{label}</Txt>
        <Txt v="bodySmall" color={C.onSurfaceVariant}>
          {sub}
        </Txt>
      </View>
      {selected ? <Icon name="check-circle" size={22} color={C.primary} /> : <View style={{ width: 22, height: 22 }} />}
    </Pressable>
  );
}

/* ---------- Layout ---------- */

export function Label({ children }: { children: string }) {
  return (
    <Txt v="labelLarge" color={C.onSurfaceVariant}>
      {children}
    </Txt>
  );
}

export function Row({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** Grade de N colunas iguais. */
export function Grid({ cols, gap = 8, children, style }: { cols: number; gap?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap }, style]}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {Array.from({ length: cols }, (_, j) => (
            <View key={j} style={{ flex: 1, minWidth: 0 }}>
              {r[j] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Snackbar({ text, bottom }: { text: string; bottom: number }) {
  const op = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (text) setShown(text);
    Animated.timing(op, { toValue: text ? 1 : 0, duration: 150, useNativeDriver: true }).start();
  }, [text, op]);
  return (
    <Animated.View pointerEvents="none" style={[styles.snack, { bottom, opacity: op }]}>
      <Txt v="bodyMedium" color={C.inverseOnSurface}>
        {shown}
      </Txt>
    </Animated.View>
  );
}

export function Sheet({
  visible,
  onClose,
  children,
  scrollEnabled = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scrollEnabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const ty = useRef(new Animated.Value(800)).current;
  useEffect(() => {
    if (visible) {
      ty.setValue(800);
      Animated.timing(ty, { toValue: 0, duration: 320, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: true }).start();
    }
  }, [visible, ty]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Fechar" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.32)' }]} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: ty }] }]}>
          <ScrollView
            scrollEnabled={scrollEnabled}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 28, gap: 16 }}
          >
            <View style={styles.handle} />
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const card: ViewStyle = { borderRadius: R.md, backgroundColor: C.surfaceContainerLow };

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    height: 56,
    borderRadius: R.lg,
    backgroundColor: C.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  snack: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: C.inverseSurface,
    borderRadius: R.xs,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: C.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: { width: 32, height: 4, borderRadius: 2, backgroundColor: C.outline, alignSelf: 'center', marginBottom: 4 },
});
