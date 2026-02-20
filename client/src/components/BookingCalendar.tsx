import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { generateDailySlots, ScheduleConfig } from "@/lib/scheduleUtils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatTime12h } from "@/lib/utils";

interface BookingCalendarProps {
    schedule: ScheduleConfig;
    bookedSlots?: { date: string; time: string }[];
    onBookSlot: (date: Date, time: string) => void;
}

export function BookingCalendar({ schedule, bookedSlots = [], onBookSlot }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availableDays, setAvailableDays] = useState<Date[]>([]);
    const [startIndex, setStartIndex] = useState(0);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // 4 days on desktop, 3 on mobile
    const itemsToShow = isDesktop ? 4 : 3;

    // Generate next 14 days
    useEffect(() => {
        const days: Date[] = [];
        const today = new Date();
        const dailySchedules = schedule.dailySchedules || [];

        for (let i = 0; i < 14; i++) {
            const date = addDays(today, i);
            const dayName = format(date, "EEEE");

            const daySchedule = dailySchedules.find(d => d.day === dayName);

            if (daySchedule && daySchedule.enabled) {
                days.push(date);
            }
        }
        Promise.resolve().then(() => {
            setAvailableDays(days);
            if (days.length > 0) setSelectedDate(days[0]);
        });
    }, [schedule]);

    const handleNext = () => {
        if (startIndex + itemsToShow < availableDays.length) {
            setStartIndex(prev => Math.min(prev + itemsToShow, availableDays.length - itemsToShow)); // Move by full batch
        }
    };

    const handlePrev = () => {
        if (startIndex > 0) {
            setStartIndex(prev => Math.max(prev - itemsToShow, 0)); // Move by full batch
        }
    };

    const visibleDays = availableDays.slice(startIndex, startIndex + itemsToShow);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="font-bold text-lg text-primary">المواعيد المتاحة</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        disabled={startIndex === 0}
                        className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        disabled={startIndex + itemsToShow >= availableDays.length}
                        className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {availableDays.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 bg-gray-50 rounded-lg border border-dashed">
                    <p>لا توجد مواعيد متاحة قريباً</p>
                </div>
            ) : (
                <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-3'} gap-0 divide-x divide-x-reverse divide-gray-100 border-t border-b border-gray-100`}>
                    {visibleDays.map((date) => {
                        const slots = generateDailySlots(date, schedule);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <div key={date.toString()} className="flex flex-col min-h-[300px]">
                                {/* Day Header */}
                                <div className={`text-center p-2 md:p-3 border-b-2 transition-colors ${isToday ? 'bg-blue-50/50 border-primary' : 'border-transparent bg-gray-50/30'}`}>
                                    <div className={`font-bold text-xs md:text-sm ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                                        {isToday
                                            ? "اليوم"
                                            : isSameDay(date, addDays(new Date(), 1))
                                                ? "غداً"
                                                : format(date, "EEEE", { locale: ar })}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                        {format(date, "d/M")}
                                    </div>
                                </div>

                                {/* Slots Column */}
                                <div className="flex-1 p-1 md:p-2 space-y-2 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {slots.length > 0 ? (
                                        slots.map((time, index) => {
                                            const isBooked = bookedSlots.some(slot =>
                                                isSameDay(new Date(slot.date), date) && slot.time === time
                                            );

                                            return (
                                                <Button
                                                    key={index}
                                                    variant={isBooked ? "ghost" : "outline"}
                                                    disabled={isBooked}
                                                    className={`w-full text-[10px] md:text-xs font-medium py-1.5 md:py-2 h-auto transition-all duration-200 ${isBooked
                                                        ? 'opacity-50 line-through decoration-red-500 decoration-2 bg-gray-50'
                                                        : 'hover:bg-primary hover:text-white hover:border-primary'
                                                        }`}
                                                    onClick={() => !isBooked && onBookSlot(date, time)}
                                                >
                                                    {time}
                                                </Button>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground text-xs">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                <span className="text-lg">😴</span>
                                            </div>
                                            لا توجد مواعيد
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-4 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                <span>يتم تحديث المواعيد تلقائياً</span>
            </div>
        </div>
    );
}
