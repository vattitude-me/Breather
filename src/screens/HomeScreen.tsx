import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import uuid from 'react-native-uuid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder, getNextFireTime, getAlertsSent } from '../services/notifications';
import { COLORS, APP_NAME, PRESET_REMINDERS, DEFAULT_SCHEDULE } from '../constants';
import { Reminder } from '../types';
import { HomeStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const { reminders, settings, dispatch } = useRemindersContext();
  const navigation = useNavigation<NavigationProp>();

  const activeReminders = reminders.filter((r) => r.isActive);
  const totalReminders = reminders.length;

  const [countdown, setCountdown] = useState('--');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertsSent, setAlertsSent] = useState(0);

  useEffect(() => {
    getAlertsSent().then(setAlertsSent);
    const poll = setInterval(() => {
      getAlertsSent().then(setAlertsSent);
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    function updateCountdown() {
      if (activeReminders.length === 0) {
        setCountdown('--');
        return;
      }

      const now = Date.now();
      let soonest = Infinity;

      for (const r of activeReminders) {
        const next = getNextFireTime(r);
        if (next) {
          const diff = next.getTime() - now;
          if (diff > 0 && diff < soonest) soonest = diff;
        }
      }

      if (soonest === Infinity) {
        setCountdown('--');
        return;
      }

      const totalSec = Math.floor(soonest / 1000);
      if (totalSec >= 3600) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        setCountdown(`${h}h ${m}m`);
      } else if (totalSec >= 60) {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${totalSec}s`);
      }
    }

    updateCountdown();
    const interval = setInterval(() => {
      updateCountdown();
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeReminders]);

  const handleQuickAdd = async (preset: typeof PRESET_REMINDERS[0]) => {
    const existing = reminders.find((r) => r.title === preset.title);
    if (existing) return;

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
  };

  const handleToggle = async (reminder: Reminder) => {
    try {
      if (reminder.isActive && reminder.notificationId) {
        await cancelReminder(reminder.notificationId);
        dispatch({
          type: 'UPDATE',
          payload: { ...reminder, isActive: false, notificationId: undefined },
        });
      } else {
        const notificationId = await scheduleReminder(reminder);
        dispatch({
          type: 'UPDATE',
          payload: { ...reminder, isActive: true, notificationId },
        });
      }
    } catch {
      dispatch({
        type: 'UPDATE',
        payload: { ...reminder, isActive: !reminder.isActive },
      });
    }
  };

  const handleDelete = async (reminder: Reminder) => {
    const confirmed = window.confirm
      ? window.confirm(`Delete "${reminder.title}"?`)
      : true;

    if (!confirmed) return;

    try {
      if (reminder.notificationId) {
        await cancelReminder(reminder.notificationId);
      }
    } catch {}
    dispatch({ type: 'DELETE', payload: reminder.id });
  };

  const formatInterval = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  const getCategoryColor = (index: number): string => {
    const colors = [COLORS.cardPink, COLORS.cardPeach, COLORS.cardMint, COLORS.cardLavender];
    return colors[index % colors.length];
  };

  const renderReminderItem = ({ item, index }: { item: Reminder; index: number }) => (
    <TouchableOpacity
      style={[styles.reminderCard, { backgroundColor: getCategoryColor(index) }]}
      onPress={() => navigation.navigate('EditReminder', { reminderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.reminderTopRow}>
        <View style={styles.reminderIconCircle}>
          <Text style={styles.reminderIcon}>{item.icon}</Text>
        </View>
        <View style={styles.reminderActions}>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggle(item)}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            thumbColor={item.isActive ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>
      <View style={styles.reminderBottom}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <Text style={styles.reminderInterval}>
          Every {formatInterval(item.intervalMinutes)}
        </Text>
        <View style={styles.reminderStatusRow}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#4CAF50' : COLORS.disabled }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Paused'}</Text>
          <TouchableOpacity
            style={styles.deleteIcon}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteIconText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.appTitle}>{APP_NAME}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>🌿</Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* Quick Stats Banner */}
      {totalReminders > 0 && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeReminders.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{alertsSent}</Text>
            <Text style={styles.statLabel}>Alerts Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{countdown}</Text>
            <Text style={styles.statLabel}>Next In</Text>
          </View>
        </View>
      )}

      {/* My Routines */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Routines</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddReminder')}>
            <Text style={styles.seeAllText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {reminders.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => navigation.navigate('AddReminder')}
            activeOpacity={0.7}
          >
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyPlusIcon}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>Create your first routine</Text>
            <Text style={styles.emptySubtitle}>Tap to start</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.routinesGrid}>
            {reminders.map((item, index) => (
              <View key={item.id} style={styles.routineGridItem}>
                {renderReminderItem({ item, index })}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Add */}
      <View style={styles.sectionContainer}>
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
          {PRESET_REMINDERS.map((preset) => {
            const alreadyExists = reminders.some((r) => r.title === preset.title);
            return (
              <TouchableOpacity
                key={preset.title}
                style={[styles.quickAddChip, alreadyExists && styles.quickAddChipDisabled]}
                activeOpacity={alreadyExists ? 1 : 0.7}
                onPress={() => handleQuickAdd(preset)}
              >
                <Text style={styles.quickAddChipIcon}>{preset.icon}</Text>
                <Text style={[styles.quickAddChipLabel, alreadyExists && styles.quickAddChipLabelDisabled]}>
                  {preset.title}
                </Text>
                {alreadyExists && <Text style={styles.quickAddChipCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tip of the Day */}
      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>💡 Tip</Text>
        <Text style={styles.tipText}>
          Taking a 5-minute stretch break every hour can reduce back pain by up to 40% and boost focus.
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickAddTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  quickAddScroll: {
    marginHorizontal: -4,
  },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  quickAddChipDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.border,
  },
  quickAddChipIcon: {
    fontSize: 16,
  },
  quickAddChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickAddChipLabelDisabled: {
    color: COLORS.textSecondary,
  },
  quickAddChipCheck: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232, 97, 77, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyPlusIcon: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  routinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routineGridItem: {
    width: '47%',
  },
  reminderCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reminderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderActions: {
    transform: [{ scale: 0.85 }],
  },
  reminderBottom: {
    gap: 2,
  },
  reminderIcon: {
    fontSize: 22,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  reminderInterval: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reminderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 32,
  },
});
