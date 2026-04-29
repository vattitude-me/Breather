import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder } from '../services/notifications';
import { COLORS, PRESET_REMINDERS, INTERVAL_PRESETS, DAYS_OF_WEEK, DEFAULT_SCHEDULE } from '../constants';
import { Reminder, DayOfWeek } from '../types';

export default function AddEditReminderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { reminders, settings, dispatch } = useRemindersContext();

  const editId = (route.params as { reminderId?: string } | undefined)?.reminderId;
  const existingReminder = editId ? reminders.find((r) => r.id === editId) : undefined;
  const isEditing = !!existingReminder;

  const [title, setTitle] = useState(existingReminder?.title || '');
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
  const [icon, setIcon] = useState(existingReminder?.icon || '🧘');
  const [showCustom, setShowCustom] = useState(isEditing);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(
    existingReminder?.schedule?.activeDays || settings.defaultSchedule?.activeDays || DEFAULT_SCHEDULE.activeDays as unknown as DayOfWeek[]
  );
  const [startHour, setStartHour] = useState(
    existingReminder?.schedule?.startHour ?? settings.defaultSchedule?.startHour ?? DEFAULT_SCHEDULE.startHour
  );
  const [endHour, setEndHour] = useState(
    existingReminder?.schedule?.endHour ?? settings.defaultSchedule?.endHour ?? DEFAULT_SCHEDULE.endHour
  );

  useEffect(() => {
    const numValue = parseInt(intervalValue) || 0;
    setIntervalMinutes(intervalUnit === 'hours' ? numValue * 60 : numValue);
  }, [intervalValue, intervalUnit]);

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const handleQuickStart = async (preset: typeof PRESET_REMINDERS[0]) => {
    const reminder: Reminder = {
      id: uuid.v4() as string,
      title: preset.title,
      intervalMinutes: preset.defaultInterval,
      isActive: true,
      snoozeDurationMinutes: settings.defaultSnoozeDurationMinutes,
      icon: preset.icon,
      createdAt: new Date().toISOString(),
      schedule: settings.defaultSchedule || DEFAULT_SCHEDULE as any,
    };

    try {
      const notificationId = await scheduleReminder(reminder);
      reminder.notificationId = notificationId;
    } catch {}

    dispatch({ type: 'ADD', payload: reminder });

    if (navigation.canGoBack()) {
      navigation.goBack();
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
      if (window.alert) window.alert('Please enter a reminder title.');
      return;
    }
    if (intervalMinutes < 1) {
      if (window.alert) window.alert('Interval must be at least 1 minute.');
      return;
    }
    if (activeDays.length === 0) {
      if (window.alert) window.alert('Please select at least one active day.');
      return;
    }

    const reminder: Reminder = {
      id: existingReminder?.id || (uuid.v4() as string),
      title: title.trim(),
      intervalMinutes,
      isActive: true,
      snoozeDurationMinutes: settings.defaultSnoozeDurationMinutes,
      icon,
      createdAt: existingReminder?.createdAt || new Date().toISOString(),
      schedule: {
        activeDays,
        startHour,
        endHour,
      },
    };

    try {
      if (existingReminder?.notificationId) {
        await cancelReminder(existingReminder.notificationId);
      }
      const notificationId = await scheduleReminder(reminder);
      reminder.notificationId = notificationId;
    } catch {}

    dispatch({
      type: isEditing ? 'UPDATE' : 'ADD',
      payload: reminder,
    });

    setTitle('');
    setIntervalValue(String(settings.defaultIntervalMinutes));
    setIntervalUnit('minutes');
    setIcon('🧘');
    setShowCustom(false);
    setActiveDays(settings.defaultSchedule?.activeDays || DEFAULT_SCHEDULE.activeDays as unknown as DayOfWeek[]);
    setStartHour(settings.defaultSchedule?.startHour ?? DEFAULT_SCHEDULE.startHour);
    setEndHour(settings.defaultSchedule?.endHour ?? DEFAULT_SCHEDULE.endHour);

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleDelete = async () => {
    if (!existingReminder) return;

    const confirmed = window.confirm
      ? window.confirm(`Delete "${existingReminder.title}"?`)
      : true;

    if (!confirmed) return;

    try {
      if (existingReminder.notificationId) {
        await cancelReminder(existingReminder.notificationId);
      }
    } catch {}
    dispatch({ type: 'DELETE', payload: existingReminder.id });
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Start - only show when creating new */}
      {!isEditing && (
        <View style={styles.section}>
          <Text style={styles.heroTitle}>Quick Start</Text>
          <Text style={styles.heroSubtitle}>
            Tap a preset to instantly create a reminder
          </Text>
          <View style={styles.presetsGrid}>
            {PRESET_REMINDERS.map((preset) => (
              <TouchableOpacity
                key={preset.title}
                style={styles.presetCard}
                onPress={() => handleQuickStart(preset)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetCardIcon}>{preset.icon}</Text>
                <Text style={styles.presetCardTitle}>{preset.title}</Text>
                <Text style={styles.presetCardInterval}>
                  Every {preset.defaultInterval >= 60
                    ? `${preset.defaultInterval / 60}h`
                    : `${preset.defaultInterval}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Custom / Edit Section */}
      {!isEditing && !showCustom && (
        <View style={styles.dividerSection}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      {!isEditing && !showCustom && (
        <TouchableOpacity
          style={styles.customToggle}
          onPress={() => setShowCustom(true)}
        >
          <Text style={styles.customToggleText}>Create Custom Reminder</Text>
          <Text style={styles.customToggleArrow}>›</Text>
        </TouchableOpacity>
      )}

      {(showCustom || isEditing) && (
        <View style={styles.section}>
          {!isEditing && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Custom Reminder</Text>
              <TouchableOpacity onPress={() => setShowCustom(false)}>
                <Text style={styles.collapseText}>Hide</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What do you want to be reminded about?"
              placeholderTextColor={COLORS.disabled}
            />
          </View>

          {/* Icon */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Icon</Text>
            <View style={styles.iconRow}>
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
          </View>

          {/* Interval */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Remind me every</Text>
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

            <View style={styles.intervalPresets}>
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
          </View>

          {/* Schedule - Days of Week */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Active Days</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    activeDays.includes(day as DayOfWeek) && styles.dayChipActive,
                  ]}
                  onPress={() => toggleDay(day as DayOfWeek)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      activeDays.includes(day as DayOfWeek) && styles.dayChipTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.dayShortcuts}>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
              >
                <Text style={styles.shortcutText}>Weekdays</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setActiveDays(['Sat', 'Sun'])}
              >
                <Text style={styles.shortcutText}>Weekends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
              >
                <Text style={styles.shortcutText}>Every Day</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Schedule - Time Range */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Active Hours</Text>
            <View style={styles.timeRangeContainer}>
              <View style={styles.timePickerGroup}>
                <Text style={styles.timeLabel}>From</Text>
                <View style={styles.timeControl}>
                  <TouchableOpacity
                    style={styles.timeArrow}
                    onPress={() => setStartHour((h) => Math.max(0, h - 1))}
                  >
                    <Text style={styles.timeArrowText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{formatHour(startHour)}</Text>
                  <TouchableOpacity
                    style={styles.timeArrow}
                    onPress={() => setStartHour((h) => Math.min(endHour - 1, h + 1))}
                  >
                    <Text style={styles.timeArrowText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.timeSeparator}>→</Text>

              <View style={styles.timePickerGroup}>
                <Text style={styles.timeLabel}>To</Text>
                <View style={styles.timeControl}>
                  <TouchableOpacity
                    style={styles.timeArrow}
                    onPress={() => setEndHour((h) => Math.max(startHour + 1, h - 1))}
                  >
                    <Text style={styles.timeArrowText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{formatHour(endHour)}</Text>
                  <TouchableOpacity
                    style={styles.timeArrow}
                    onPress={() => setEndHour((h) => Math.min(23, h + 1))}
                  >
                    <Text style={styles.timeArrowText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={styles.timeHint}>
              Reminders will only fire between {formatHour(startHour)} and {formatHour(endHour)}
            </Text>
          </View>

          {/* Save Button */}
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
        </View>
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
    padding: 24,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetCardIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  presetCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  presetCardInterval: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  customToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
  },
  customToggleArrow: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '300',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  collapseText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  iconBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
  },
  iconText: {
    fontSize: 24,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  intervalInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  intervalPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
    fontWeight: '500',
  },
  intervalChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  dayShortcuts: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shortcutText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timePickerGroup: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeArrowText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  timeHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
