import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRemindersContext } from '../context/RemindersContext';
import { COLORS, STORAGE_KEYS } from '../constants';
import { ProgressData, ProgressEntry } from '../types';

const DEFAULT_PROGRESS: ProgressData = {
  entries: [],
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalMinutes: 0,
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(entries: ProgressEntry[]): number {
  if (entries.length === 0) return 0;

  const sorted = [...entries]
    .filter((e) => e.completedCount > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function ProgressScreen() {
  const { reminders } = useRemindersContext();
  const [progress, setProgress] = useState<ProgressData>(DEFAULT_PROGRESS);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts'>('overview');

  const loadProgress = useCallback(async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (data) {
      const parsed: ProgressData = JSON.parse(data);
      const streak = calculateStreak(parsed.entries);
      setProgress({ ...parsed, currentStreak: streak });
    } else {
      const today = getToday();
      const activeCount = reminders.filter((r) => r.isActive).length;
      const initialEntry: ProgressEntry = {
        date: today,
        completedCount: activeCount,
        totalMinutes: activeCount * 5,
        sessions: activeCount > 0 ? 1 : 0,
      };
      const initial: ProgressData = {
        entries: activeCount > 0 ? [initialEntry] : [],
        currentStreak: activeCount > 0 ? 1 : 0,
        longestStreak: activeCount > 0 ? 1 : 0,
        totalSessions: activeCount > 0 ? 1 : 0,
        totalMinutes: activeCount > 0 ? activeCount * 5 : 0,
      };
      setProgress(initial);
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(initial));
    }
  }, [reminders]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const todayEntry = progress.entries.find((e) => e.date === getToday());
  const thisWeekEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return entryDate >= weekAgo;
  });
  const thisMonthEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });

  const weekSessions = thisWeekEntries.reduce((sum, e) => sum + e.sessions, 0);
  const weekBreaks = thisWeekEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const weekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  const monthSessions = thisMonthEntries.reduce((sum, e) => sum + e.sessions, 0);
  const monthBreaks = thisMonthEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const monthMinutes = thisMonthEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  const streakMessage = progress.currentStreak >= 7
    ? "You're unstoppable!"
    : progress.currentStreak >= 3
      ? "Great momentum! Keep going!"
      : "Keep it up! You're on fire!";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <View style={styles.content}>
          {/* Streak Card */}
          <View style={styles.streakCard}>
            <Text style={styles.streakFireIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{progress.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakMessage}>{streakMessage}</Text>
          </View>

          {/* Today's Stats */}
          <View style={styles.todayRow}>
            <View style={styles.todayCard}>
              <Text style={styles.todayCardIcon}>📋</Text>
              <Text style={styles.todayCardNumber}>
                {todayEntry?.sessions ?? 0}
              </Text>
              <Text style={styles.todayCardLabel}>Total Sessions</Text>
            </View>
            <View style={styles.todayCard}>
              <Text style={styles.todayCardIcon}>🎯</Text>
              <Text style={styles.todayCardNumber}>
                {todayEntry?.completedCount ?? 0}
              </Text>
              <Text style={styles.todayCardLabel}>Today's Focus</Text>
            </View>
          </View>

          {/* This Week */}
          <View style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>📅</Text>
              <Text style={styles.periodTitle}>This Week</Text>
            </View>
            <View style={styles.periodStatsRow}>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{weekSessions}</Text>
                <Text style={styles.periodStatLabel}>Sessions</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{weekBreaks}</Text>
                <Text style={styles.periodStatLabel}>Breaks</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{weekMinutes}</Text>
                <Text style={styles.periodStatLabel}>Minutes</Text>
              </View>
            </View>
          </View>

          {/* This Month */}
          <View style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>📆</Text>
              <Text style={styles.periodTitle}>This Month</Text>
            </View>
            <View style={styles.periodStatsRow}>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{monthSessions}</Text>
                <Text style={styles.periodStatLabel}>Sessions</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{monthBreaks}</Text>
                <Text style={styles.periodStatLabel}>Breaks</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{monthMinutes}</Text>
                <Text style={styles.periodStatLabel}>Minutes</Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>🏆</Text>
              <Text style={styles.periodTitle}>Achievements</Text>
            </View>
            <View style={styles.achievementsList}>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>
                  {progress.currentStreak >= 1 ? '✅' : '⬜'}
                </Text>
                <Text style={styles.achievementText}>First Day</Text>
              </View>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>
                  {progress.currentStreak >= 3 ? '✅' : '⬜'}
                </Text>
                <Text style={styles.achievementText}>3-Day Streak</Text>
              </View>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>
                  {progress.currentStreak >= 7 ? '✅' : '⬜'}
                </Text>
                <Text style={styles.achievementText}>Week Warrior</Text>
              </View>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>
                  {progress.totalSessions >= 10 ? '✅' : '⬜'}
                </Text>
                <Text style={styles.achievementText}>10 Sessions</Text>
              </View>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementBadge}>
                  {progress.currentStreak >= 30 ? '✅' : '⬜'}
                </Text>
                <Text style={styles.achievementText}>Monthly Master</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Weekly Activity Chart (simple bar representation) */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <View style={styles.barChart}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const dayDate = new Date();
                const currentDay = dayDate.getDay();
                const diff = i - ((currentDay + 6) % 7);
                const targetDate = new Date(dayDate.getTime() + diff * 86400000);
                const dateStr = targetDate.toISOString().split('T')[0];
                const entry = progress.entries.find((e) => e.date === dateStr);
                const height = entry ? Math.min(entry.completedCount * 20, 80) : 4;

                return (
                  <View key={day} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height },
                          entry && entry.completedCount > 0 && styles.barFilled,
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day.charAt(0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Best Streak */}
          <View style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>⭐</Text>
              <Text style={styles.periodTitle}>Personal Best</Text>
            </View>
            <View style={styles.periodStatsRow}>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{progress.longestStreak}</Text>
                <Text style={styles.periodStatLabel}>Best Streak</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{progress.totalSessions}</Text>
                <Text style={styles.periodStatLabel}>All Sessions</Text>
              </View>
              <View style={styles.periodStat}>
                <Text style={styles.periodStatNumber}>{progress.totalMinutes}</Text>
                <Text style={styles.periodStatLabel}>All Minutes</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  streakCard: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  streakFireIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.text,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  streakMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  todayRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  todayCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayCardIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  todayCardNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  todayCardLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  periodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  periodIcon: {
    fontSize: 18,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  periodStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodStat: {
    alignItems: 'center',
  },
  periodStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  periodStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  achievementsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementBadge: {
    fontSize: 18,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 80,
    justifyContent: 'flex-end',
    width: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.border,
    minHeight: 4,
  },
  barFilled: {
    backgroundColor: COLORS.primary,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});
