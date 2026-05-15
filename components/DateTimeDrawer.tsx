import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { LucideIcon } from "@/components/LucideIcon";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// 8:00 AM – 5:00 PM in 30-minute intervals
const TIME_SLOTS: string[] = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateTimeDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  value: string | null;
  onConfirm: (isoString: string) => void;
}

interface CalendarDay {
  day: number;
  isPast: boolean;
  isToday: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToSelection(
  iso: string | null
): { year: number; month: number; day: number; time: string | null } | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? "AM" : "PM";
    const dH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const dM = m === 0 ? "00" : String(m);
    const timeStr = `${dH}:${dM} ${ampm}`;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      time: TIME_SLOTS.includes(timeStr) ? timeStr : null,
    };
  } catch {
    return null;
  }
}

function parseTimeSlot(slot: string): { h: number; m: number } | null {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { h, m };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DateTimeDrawer({
  visible,
  onRequestClose,
  value,
  onConfirm,
}: DateTimeDrawerProps) {
  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(todayMidnight.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayMidnight.getMonth());
  const [selYear, setSelYear] = useState<number | null>(null);
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const parsed = isoToSelection(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setSelYear(parsed.year);
      setSelMonth(parsed.month);
      setSelDay(parsed.day);
      setSelTime(parsed.time);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setSelYear(null);
      setSelMonth(null);
      setSelDay(null);
      setSelTime(null);
    }
  }, [visible, value]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    setSelYear(viewYear);
    setSelMonth(viewMonth);
    setSelDay(day);
    setSelTime(null);
  }

  function handleConfirm() {
    if (selYear === null || selMonth === null || selDay === null || !selTime) return;
    const hm = parseTimeSlot(selTime);
    if (!hm) return;
    const d = new Date(selYear, selMonth, selDay, hm.h, hm.m);
    onConfirm(d.toISOString());
  }

  // ── Calendar rows ─────────────────────────────────────────────────────────

  const calendarRows = useMemo((): (CalendarDay | null)[][] => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (CalendarDay | null)[] = Array.from({ length: firstDow }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      d.setHours(0, 0, 0, 0);
      cells.push({
        day,
        isPast: d < todayMidnight,
        isToday: d.getTime() === todayMidnight.getTime(),
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (CalendarDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth, todayMidnight]);

  // ── Derived display values ────────────────────────────────────────────────

  const hasDay = selYear !== null && selMonth !== null && selDay !== null;

  const summaryDateLabel = hasDay
    ? (() => {
        const dow = new Date(selYear!, selMonth!, selDay!).getDay();
        return `${DAY_NAMES[dow]}, ${MONTH_NAMES[selMonth!]} ${selDay}`;
      })()
    : null;

  const canConfirm = hasDay && selTime !== null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      <DrawerHeader title="When works for you?" onClose={onRequestClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Summary pills ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <LucideIcon name="Calendar" size={14} color={Colors.foamBlue} />
            <Text style={styles.summaryPillText}>
              {summaryDateLabel ?? "No date selected"}
            </Text>
          </View>
          {selTime && (
            <View style={styles.summaryPill}>
              <LucideIcon name="Clock" size={14} color={Colors.foamBlue} />
              <Text style={styles.summaryPillText}>{selTime}</Text>
            </View>
          )}
        </View>

        {/* ── Month navigation ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth} activeOpacity={0.7}>
            <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth} activeOpacity={0.7}>
            <LucideIcon name="ChevronRight" size={20} color={Colors.light.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Day-of-week headers ── */}
        <View style={styles.dowRow}>
          {DAY_HEADERS.map((d) => (
            <View key={d} style={styles.dowCell}>
              <Text style={styles.dowText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* ── Calendar grid ── */}
        <View style={styles.calendarGrid}>
          {calendarRows.map((row, ri) => (
            <View key={ri} style={styles.calRow}>
              {row.map((cell, ci) => {
                if (!cell) {
                  return <View key={`e-${ci}`} style={styles.dayCell} />;
                }
                const isSelected =
                  selYear === viewYear &&
                  selMonth === viewMonth &&
                  selDay === cell.day;
                return (
                  <TouchableOpacity
                    key={cell.day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      cell.isToday && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => selectDay(cell.day)}
                    disabled={cell.isPast}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                        cell.isToday && !isSelected && styles.dayCellTextToday,
                        cell.isPast && styles.dayCellTextPast,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Time slots ── */}
        <Text style={styles.timesLabel}>AVAILABLE TIMES</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeSlotsContent}
        >
          {hasDay
            ? TIME_SLOTS.map((slot) => {
                const isSelected = selTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                    onPress={() => setSelTime(slot)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })
            : (
              <View style={styles.timeSlotPlaceholderWrap}>
                <Text style={styles.timeSlotPlaceholderText}>
                  Select a date first
                </Text>
              </View>
            )}
        </ScrollView>
      </ScrollView>

      <DrawerFooter>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onRequestClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm && { opacity: 0.4 }]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </DrawerFooter>
    </DrawerModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingBottom: 24,
    gap: 20,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.sm,
  },
  summaryPillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textPrimary,
  },

  // Month navigation
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },

  // Day-of-week headers
  dowRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
  },
  dowCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dowText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
  },

  // Calendar grid
  calendarGrid: {
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  calRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  dayCellSelected: {
    backgroundColor: Colors.foamBlue,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.foamBlue,
  },
  dayCellText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  dayCellTextSelected: {
    color: Colors.white,
  },
  dayCellTextToday: {
    color: Colors.foamBlue,
  },
  dayCellTextPast: {
    color: Colors.light.textDisabled,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginHorizontal: Spacing.md,
  },

  // Time slots
  timesLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: Typography.tracking.label,
    paddingHorizontal: Spacing.md,
  },
  timeSlotsContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: "center",
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  timeSlotSelected: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  timeSlotText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  timeSlotTextSelected: {
    color: Colors.white,
  },
  timeSlotPlaceholderWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  timeSlotPlaceholderText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },

  // Footer
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
});
