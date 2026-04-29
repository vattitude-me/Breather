import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRemindersContext } from '../context/RemindersContext';
import { cancelAllReminders, scheduleReminder } from '../services/notifications';
import { COLORS, SNOOZE_OPTIONS, INTERVAL_PRESETS, DAYS_OF_WEEK, DEFAULT_SCHEDULE } from '../constants';
import { DayOfWeek } from '../types';

export default function SettingsScreen() {
  const { settings, updateSettings, reminders, dispatch } = useRemindersContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

  const schedule = settings.defaultSchedule || DEFAULT_SCHEDULE;

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    updateSettings({ ...settings, notificationsEnabled: value });

    if (!value) {
      await cancelAllReminders();
      const updatedReminders = reminders.map((r) => ({
        ...r,
        isActive: false,
        notificationId: undefined,
      }));
      updatedReminders.forEach((r) => dispatch({ type: 'UPDATE', payload: r }));
    } else {
      for (const reminder of reminders) {
        if (reminder.isActive) {
          try {
            const notificationId = await scheduleReminder(reminder);
            dispatch({ type: 'UPDATE', payload: { ...reminder, notificationId } });
          } catch {}
        }
      }
    }
  };

  const handleDefaultInterval = (minutes: number) => {
    updateSettings({ ...settings, defaultIntervalMinutes: minutes });
  };

  const handleDefaultSnooze = (minutes: number) => {
    updateSettings({ ...settings, defaultSnoozeDurationMinutes: minutes });
  };

  const toggleDefaultDay = (day: DayOfWeek) => {
    const currentDays = schedule.activeDays as DayOfWeek[];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, activeDays: newDays },
    });
  };

  const setDefaultStartHour = (hour: number) => {
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, startHour: hour },
    });
  };

  const setDefaultEndHour = (hour: number) => {
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, endHour: hour },
    });
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const handleResetAll = async () => {
    const confirmed = window.confirm
      ? window.confirm('This will delete all your reminders. This action cannot be undone.')
      : true;

    if (!confirmed) return;

    await cancelAllReminders();
    reminders.forEach((r) => dispatch({ type: 'DELETE', payload: r.id }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>Enable Notifications</Text>
            <Text style={styles.rowDescription}>
              Turn off to pause all reminders
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: COLORS.disabled, true: COLORS.primaryLight }}
            thumbColor={notificationsEnabled ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Interval</Text>
        <Text style={styles.sectionDescription}>
          Used when creating new reminders
        </Text>
        <View style={styles.chipsRow}>
          {INTERVAL_PRESETS.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.chip,
                settings.defaultIntervalMinutes === minutes && styles.chipActive,
              ]}
              onPress={() => handleDefaultInterval(minutes)}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.defaultIntervalMinutes === minutes && styles.chipTextActive,
                ]}
              >
                {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Snooze Duration</Text>
        <Text style={styles.sectionDescription}>
          How long to snooze when you tap Snooze
        </Text>
        <View style={styles.chipsRow}>
          {SNOOZE_OPTIONS.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.chip,
                settings.defaultSnoozeDurationMinutes === minutes && styles.chipActive,
              ]}
              onPress={() => handleDefaultSnooze(minutes)}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.defaultSnoozeDurationMinutes === minutes && styles.chipTextActive,
                ]}
              >
                {minutes}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Schedule</Text>
        <Text style={styles.sectionDescription}>
          Default active days and hours for new reminders
        </Text>

        <Text style={styles.subLabel}>Active Days</Text>
        <View style={styles.daysRow}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                (schedule.activeDays as readonly string[]).includes(day) && styles.dayChipActive,
              ]}
              onPress={() => toggleDefaultDay(day as DayOfWeek)}
            >
              <Text
                style={[
                  styles.dayChipText,
                  (schedule.activeDays as readonly string[]).includes(day) && styles.dayChipTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Active Hours</Text>
        <View style={styles.timeRangeContainer}>
          <View style={styles.timePickerGroup}>
            <Text style={styles.timeLabel}>From</Text>
            <View style={styles.timeControl}>
              <TouchableOpacity
                style={styles.timeArrow}
                onPress={() => setDefaultStartHour(Math.max(0, schedule.startHour - 1))}
              >
                <Text style={styles.timeArrowText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{formatHour(schedule.startHour)}</Text>
              <TouchableOpacity
                style={styles.timeArrow}
                onPress={() => setDefaultStartHour(Math.min(schedule.endHour - 1, schedule.startHour + 1))}
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
                onPress={() => setDefaultEndHour(Math.max(schedule.startHour + 1, schedule.endHour - 1))}
              >
                <Text style={styles.timeArrowText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{formatHour(schedule.endHour)}</Text>
              <TouchableOpacity
                style={styles.timeArrow}
                onPress={() => setDefaultEndHour(Math.min(23, schedule.endHour + 1))}
              >
                <Text style={styles.timeArrowText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetAll}>
          <Text style={styles.dangerButtonText}>Reset All Reminders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutAppName}>Breakly</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutDescription}>
            Breakly helps you build healthier work habits by reminding you to stretch, hydrate, move, and rest your eyes throughout the day.
          </Text>
          <Text style={styles.aboutDescription}>
            Designed for professionals who spend long hours at their desk. Small breaks, big impact.
          </Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutFooter}>Made with care for your wellbeing.</Text>
        </View>
      </View>
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  rowDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
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
    marginTop: 8,
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
    gap: 10,
  },
  timeArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeArrowText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 55,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  dangerButton: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  aboutVersion: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  aboutDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  aboutFooter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
