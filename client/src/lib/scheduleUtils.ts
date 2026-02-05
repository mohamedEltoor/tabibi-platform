import { format, addDays, isSameDay, parse, addMinutes, isBefore, isAfter, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";

export interface DailySchedule {
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
}

export interface ScheduleConfig {
    dailySchedules?: DailySchedule[];
    slotDuration: number;
    waitingTime?: number;
}

export const generateDailySlots = (date: Date, schedule: ScheduleConfig): string[] => {
    const dayName = format(date, "EEEE");
    const dailySchedules = schedule.dailySchedules || [];
    const daySchedule = dailySchedules.find(d => d.day === dayName);

    if (!daySchedule || !daySchedule.enabled || !daySchedule.startTime || !daySchedule.endTime || !schedule.slotDuration) {
        return [];
    }

    const slots: string[] = [];
    const start = parse(daySchedule.startTime, "HH:mm", date);
    const end = parse(daySchedule.endTime, "HH:mm", date);
    const now = new Date();

    let current = start;

    // Safety check to prevent infinite loops if slotDuration is 0 or invalid
    const duration = schedule.slotDuration > 0 ? schedule.slotDuration : 30;

    while (isBefore(current, end)) {
        // Filter out past slots if date is today
        if (!isSameDay(date, now) || isAfter(current, now)) {
            slots.push(format(current, "hh:mm a", { locale: ar }));
        }
        current = addMinutes(current, duration);
    }

    return slots;
};

export const getFirstAvailableSlot = (schedule: ScheduleConfig): { date: Date, time: string } | null => {
    const today = new Date();
    // Check next 14 days
    for (let i = 0; i < 14; i++) {
        const date = addDays(today, i);
        const slots = generateDailySlots(date, schedule);
        if (slots.length > 0) {
            return { date, time: slots[0] };
        }
    }
    return null;
};
