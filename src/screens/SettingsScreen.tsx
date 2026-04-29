import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRemindersContext } from '../context/RemindersContext';
import { cancelAllReminders, scheduleReminder } from '../services/notifications';
import { COLORS, SNOOZE_OPTIONS, INTERVAL_PRESETS } from '../constants';

export default function SettingsScreen() {
  const { settings, updateSettings, reminders, dispatch } = useRemindersContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

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
          const notificationId = await scheduleReminder(reminder);
          dispatch({ type: 'UPDATE', payload: { ...reminder, notificationId } });
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

  const handleResetAll = () => {
    Alert.alert(
      'Reset All Reminders',
      'This will delete all your reminders. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cancelAllReminders();
            reminders.forEach((r) => dispatch({ type: 'DELETE', payload: r.id }));
          },
        },
      ]
    );
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
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetAll}>
          <Text style={styles.dangerButtonText}>Reset All Reminders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Stretch Reminder v1.0.0</Text>
        <Text style={styles.aboutDescription}>
          Take regular breaks to stretch, hydrate, and move your body during long work sessions.
        </Text>
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
  aboutText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: 8,
  },
  aboutDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
