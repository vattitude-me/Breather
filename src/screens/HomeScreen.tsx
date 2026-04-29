import React from 'react';
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
import { scheduleReminder, cancelReminder } from '../services/notifications';
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
      style={styles.reminderCard}
      onPress={() => navigation.navigate('EditReminder', { reminderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.reminderAccent, { backgroundColor: getCategoryColor(index) }]} />
      <View style={styles.reminderContent}>
        <View style={styles.reminderLeft}>
          <Text style={styles.reminderIcon}>{item.icon}</Text>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={styles.reminderInterval}>
              Every {formatInterval(item.intervalMinutes)}
            </Text>
          </View>
        </View>
        <View style={styles.reminderRight}>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggle(item)}
            trackColor={{ false: COLORS.disabled, true: COLORS.primaryLight }}
            thumbColor={item.isActive ? COLORS.primary : '#f4f3f4'}
          />
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
            <Text style={styles.statNumber}>{totalReminders}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {activeReminders.length > 0
                ? formatInterval(Math.min(...activeReminders.map((r) => r.intervalMinutes)))
                : '--'}
            </Text>
            <Text style={styles.statLabel}>Next In</Text>
          </View>
        </View>
      )}

      {/* Quick Add */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickAddRow}>
          {PRESET_REMINDERS.map((preset) => {
            const alreadyExists = reminders.some((r) => r.title === preset.title);
            return (
              <TouchableOpacity
                key={preset.title}
                style={[styles.quickAddCard, alreadyExists && styles.quickAddCardDisabled]}
                activeOpacity={alreadyExists ? 1 : 0.7}
                onPress={() => handleQuickAdd(preset)}
              >
                <View style={[styles.quickAddIconWrap, { backgroundColor: alreadyExists ? COLORS.border : COLORS.primaryLight }]}>
                  <Text style={styles.quickAddIcon}>{preset.icon}</Text>
                </View>
                <Text style={[styles.quickAddLabel, alreadyExists && styles.quickAddLabelDisabled]}>
                  {preset.title}
                </Text>
                {alreadyExists && <Text style={styles.quickAddCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
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
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAddCard: {
    alignItems: 'center',
    width: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickAddCardDisabled: {
    opacity: 0.5,
  },
  quickAddIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickAddIcon: {
    fontSize: 22,
  },
  quickAddLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  quickAddLabelDisabled: {
    color: COLORS.textSecondary,
  },
  quickAddCheck: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
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
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderAccent: {
    width: 5,
    alignSelf: 'stretch',
  },
  reminderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  reminderIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  reminderInterval: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 10,
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
