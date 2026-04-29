import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder } from '../services/notifications';
import { COLORS, PRESET_REMINDERS, INTERVAL_PRESETS, SNOOZE_OPTIONS } from '../constants';
import { Reminder } from '../types';
import { HomeStackParamList } from '../navigation/RootNavigator';

type EditRouteProps = RouteProp<HomeStackParamList, 'EditReminder'>;

export default function AddEditReminderScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditRouteProps>();
  const { reminders, settings, dispatch } = useRemindersContext();

  const editId = route.params?.reminderId;
  const existingReminder = editId ? reminders.find((r) => r.id === editId) : undefined;
  const isEditing = !!existingReminder;

  const [title, setTitle] = useState(existingReminder?.title || '');
  const [description, setDescription] = useState(existingReminder?.description || '');
  const [intervalMinutes, setIntervalMinutes] = useState(
    existingReminder?.intervalMinutes || settings.defaultIntervalMinutes
  );
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>(
    (existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) >= 60
      ? 'hours'
      : 'minutes'
  );
  const [intervalValue, setIntervalValue] = useState(
    (existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) >= 60
      ? String(Math.floor((existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) / 60))
      : String(existingReminder?.intervalMinutes || settings.defaultIntervalMinutes)
  );
  const [snoozeDuration, setSnoozeDuration] = useState(
    existingReminder?.snoozeDurationMinutes || settings.defaultSnoozeDurationMinutes
  );
  const [icon, setIcon] = useState(existingReminder?.icon || '🧘');

  useEffect(() => {
    const numValue = parseInt(intervalValue) || 0;
    setIntervalMinutes(intervalUnit === 'hours' ? numValue * 60 : numValue);
  }, [intervalValue, intervalUnit]);

  const handlePresetSelect = (preset: typeof PRESET_REMINDERS[0]) => {
    setTitle(preset.title);
    setIcon(preset.icon);
    if (preset.defaultInterval >= 60) {
      setIntervalUnit('hours');
      setIntervalValue(String(preset.defaultInterval / 60));
    } else {
      setIntervalUnit('minutes');
      setIntervalValue(String(preset.defaultInterval));
    }
  };

  const handleIntervalPreset = (minutes: number) => {
    if (minutes >= 60) {
      setIntervalUnit('hours');
      setIntervalValue(String(minutes / 60));
    } else {
      setIntervalUnit('minutes');
      setIntervalValue(String(minutes));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a reminder title.');
      return;
    }
    if (intervalMinutes < 1) {
      Alert.alert('Invalid Interval', 'Interval must be at least 1 minute.');
      return;
    }

    const reminder: Reminder = {
      id: existingReminder?.id || (uuid.v4() as string),
      title: title.trim(),
      description: description.trim() || undefined,
      intervalMinutes,
      isActive: true,
      snoozeDurationMinutes: snoozeDuration,
      icon,
      createdAt: existingReminder?.createdAt || new Date().toISOString(),
    };

    if (existingReminder?.notificationId) {
      await cancelReminder(existingReminder.notificationId);
    }

    const notificationId = await scheduleReminder(reminder);
    reminder.notificationId = notificationId;

    dispatch({
      type: isEditing ? 'UPDATE' : 'ADD',
      payload: reminder,
    });

    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existingReminder) return;
    Alert.alert('Delete Reminder', `Delete "${existingReminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (existingReminder.notificationId) {
            await cancelReminder(existingReminder.notificationId);
          }
          dispatch({ type: 'DELETE', payload: existingReminder.id });
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Quick Start</Text>
      <View style={styles.presetsRow}>
        {PRESET_REMINDERS.map((preset) => (
          <TouchableOpacity
            key={preset.title}
            style={[
              styles.presetChip,
              title === preset.title && styles.presetChipActive,
            ]}
            onPress={() => handlePresetSelect(preset)}
          >
            <Text style={styles.presetIcon}>{preset.icon}</Text>
            <Text
              style={[
                styles.presetLabel,
                title === preset.title && styles.presetLabelActive,
              ]}
            >
              {preset.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Stretch, Drink Water"
        placeholderTextColor={COLORS.disabled}
      />

      <Text style={styles.sectionTitle}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="A short note about this reminder"
        placeholderTextColor={COLORS.disabled}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.sectionTitle}>Interval</Text>
      <View style={styles.intervalRow}>
        <TextInput
          style={[styles.input, styles.intervalInput]}
          value={intervalValue}
          onChangeText={setIntervalValue}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor={COLORS.disabled}
        />
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitBtn, intervalUnit === 'minutes' && styles.unitBtnActive]}
            onPress={() => setIntervalUnit('minutes')}
          >
            <Text style={[styles.unitText, intervalUnit === 'minutes' && styles.unitTextActive]}>
              Min
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitBtn, intervalUnit === 'hours' && styles.unitBtnActive]}
            onPress={() => setIntervalUnit('hours')}
          >
            <Text style={[styles.unitText, intervalUnit === 'hours' && styles.unitTextActive]}>
              Hours
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.presetsRow}>
        {INTERVAL_PRESETS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[
              styles.intervalChip,
              intervalMinutes === minutes && styles.intervalChipActive,
            ]}
            onPress={() => handleIntervalPreset(minutes)}
          >
            <Text
              style={[
                styles.intervalChipText,
                intervalMinutes === minutes && styles.intervalChipTextActive,
              ]}
            >
              {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Snooze Duration</Text>
      <View style={styles.presetsRow}>
        {SNOOZE_OPTIONS.map((mins) => (
          <TouchableOpacity
            key={mins}
            style={[
              styles.intervalChip,
              snoozeDuration === mins && styles.intervalChipActive,
            ]}
            onPress={() => setSnoozeDuration(mins)}
          >
            <Text
              style={[
                styles.intervalChipText,
                snoozeDuration === mins && styles.intervalChipTextActive,
              ]}
            >
              {mins}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Icon</Text>
      <View style={styles.presetsRow}>
        {PRESET_REMINDERS.map((p) => (
          <TouchableOpacity
            key={p.icon}
            style={[styles.iconBtn, icon === p.icon && styles.iconBtnActive]}
            onPress={() => setIcon(p.icon)}
          >
            <Text style={styles.iconText}>{p.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {isEditing ? 'Update Reminder' : 'Create Reminder'}
        </Text>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Reminder</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  presetIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  presetLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  presetLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  intervalInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.text,
  },
  unitTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  intervalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intervalChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  intervalChipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  intervalChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  iconText: {
    fontSize: 22,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
