import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DailySchedule {
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
}

interface ScheduleSettingsProps {
    schedule: {
        dailySchedules: DailySchedule[];
        slotDuration: number;
        waitingTime: number;
    };
    onChange: (newSchedule: any) => void;
}

const WEEK_DAYS = [
    { id: "Saturday", label: "السبت" },
    { id: "Sunday", label: "الأحد" },
    { id: "Monday", label: "الاثنين" },
    { id: "Tuesday", label: "الثلاثاء" },
    { id: "Wednesday", label: "الأربعاء" },
    { id: "Thursday", label: "الخميس" },
    { id: "Friday", label: "الجمعة" },
];

export function ScheduleSettings({ schedule, onChange }: ScheduleSettingsProps) {

    // Ensure dailySchedules is initialized properly if empty
    const dailySchedules = schedule.dailySchedules || [];

    const handleDayToggle = (dayId: string, checked: boolean) => {
        const existingDayIndex = dailySchedules.findIndex(d => d.day === dayId);
        let newDailySchedules = [...dailySchedules];

        if (existingDayIndex >= 0) {
            newDailySchedules[existingDayIndex] = {
                ...newDailySchedules[existingDayIndex],
                enabled: checked
            };
        } else {
            // Initialize if not exists (shouldn't happen with proper init, but safe)
            newDailySchedules.push({
                day: dayId,
                startTime: "10:00",
                endTime: "22:00",
                enabled: checked
            });
        }
        onChange({ ...schedule, dailySchedules: newDailySchedules });
    };

    const handleTimeChange = (dayId: string, field: 'startTime' | 'endTime', value: string) => {
        const newDailySchedules = dailySchedules.map(daySchedule => {
            if (daySchedule.day === dayId) {
                return { ...daySchedule, [field]: value };
            }
            return daySchedule;
        });
        onChange({ ...schedule, dailySchedules: newDailySchedules });
    };

    // Helper to get day config, or default
    const getDayConfig = (dayId: string) => {
        return dailySchedules.find(d => d.day === dayId) || {
            day: dayId,
            startTime: "10:00",
            endTime: "22:00",
            enabled: false
        };
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">مواعيد العمل الأسبوعية</h3>

            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground mb-2 px-2">
                    <div className="col-span-3 md:col-span-2">اليوم</div>
                    <div className="col-span-4 md:col-span-4">بداية العمل</div>
                    <div className="col-span-4 md:col-span-4">نهاية العمل</div>
                    <div className="col-span-1 md:col-span-2 text-center">الحالة</div>
                </div>

                {WEEK_DAYS.map((day) => {
                    const config = getDayConfig(day.id);
                    return (
                        <div key={day.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${config.enabled ? 'bg-white border-primary/20 shadow-sm' : 'bg-muted/30 border-transparent opacity-80'}`}>

                            <div className="col-span-3 md:col-span-2 font-medium flex items-center gap-2">
                                <Checkbox
                                    id={`enable-${day.id}`}
                                    checked={config.enabled}
                                    onCheckedChange={(checked) => handleDayToggle(day.id, checked)}
                                />
                                <Label htmlFor={`enable-${day.id}`} className="cursor-pointer">
                                    {day.label}
                                </Label>
                            </div>

                            <div className="col-span-4 md:col-span-4">
                                <Input
                                    type="time"
                                    value={config.startTime}
                                    onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                                    disabled={!config.enabled}
                                    className="h-8 text-xs md:text-sm"
                                />
                            </div>

                            <div className="col-span-4 md:col-span-4">
                                <Input
                                    type="time"
                                    value={config.endTime}
                                    onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                                    disabled={!config.enabled}
                                    className="h-8 text-xs md:text-sm"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 text-center text-xs">
                                <span className={config.enabled ? "text-green-600" : "text-muted-foreground"}>
                                    {config.enabled ? "مفعل" : "معطل"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor="slotDuration">مدة الكشف (بالدقائق)</Label>
                    <Select
                        value={schedule.slotDuration?.toString()}
                        onValueChange={(val) => onChange({ ...schedule, slotDuration: Number(val) })}
                    >
                        <SelectTrigger id="slotDuration" className="text-right" dir="rtl">
                            <SelectValue placeholder="اختر المدة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="10">10 دقائق</SelectItem>
                            <SelectItem value="15">15 دقيقة</SelectItem>
                            <SelectItem value="20">20 دقيقة</SelectItem>
                            <SelectItem value="30">30 دقيقة</SelectItem>
                            <SelectItem value="45">45 دقيقة</SelectItem>
                            <SelectItem value="60">60 دقيقة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="waitingTime">مدة الانتظار (بالدقائق)</Label>
                    <Select
                        value={schedule.waitingTime?.toString()}
                        onValueChange={(val) => onChange({ ...schedule, waitingTime: Number(val) })}
                    >
                        <SelectTrigger id="waitingTime" className="text-right" dir="rtl">
                            <SelectValue placeholder="اختر المدة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="0">بدون انتظار</SelectItem>
                            <SelectItem value="5">5 دقائق</SelectItem>
                            <SelectItem value="10">10 دقائق</SelectItem>
                            <SelectItem value="15">15 دقيقة</SelectItem>
                            <SelectItem value="20">20 دقيقة</SelectItem>
                            <SelectItem value="30">30 دقيقة</SelectItem>
                            <SelectItem value="45">45 دقيقة</SelectItem>
                            <SelectItem value="60">60 دقيقة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
