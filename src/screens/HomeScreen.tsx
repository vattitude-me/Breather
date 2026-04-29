import React from 'react';
import {
  View,
  Text,
  FlatList,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder } from '../services/notifications';
import { COLORS } from '../constants';
import { Reminder } from '../types';
import { HomeStackParamList, RootTabParamList } from '../navigation/RootNavigator';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeList'>,
  BottomTabNavigationProp<RootTabParamList>
>;

export default function HomeScreen() {
  const { reminders, dispatch } = useRemindersContext();
  const navigation = useNavigation<NavigationProp>();

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
    return `${minutes}m`;
  };

  const renderItem = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={() => navigation.navigate('EditReminder', { reminderId: item.id })}
    >
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
    </TouchableOpacity>
  );

  if (reminders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🧘</Text>
        <Text style={styles.emptyTitle}>No Reminders Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start taking regular breaks to stretch, hydrate, and move
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReminder')}
        >
          <Text style={styles.addButtonText}>+ Add Reminder</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: 16,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  reminderIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reminderInterval: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
