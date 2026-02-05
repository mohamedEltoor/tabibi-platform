import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getGovernorates, getCities } from "@/lib/egyptData";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { popularSpecialties, otherSpecialties } from "@/lib/medicalData";

interface DoctorSearchBoxProps {
    showFilters?: boolean;
}

export default function DoctorSearchBox({ showFilters = true }: DoctorSearchBoxProps) {
    const [activeTab, setActiveTab] = useState<"doctor" | "call">("doctor");
    const [governorate, setGovernorate] = useState("");
    const [area, setArea] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [searchText, setSearchText] = useState("");
    const [gender, setGender] = useState<string>("");
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");

    // Custom Specialty Dropdown State
    const [isSpecialtyOpen, setIsSpecialtyOpen] = useState(false);
    const [specialtyPage, setSpecialtyPage] = useState(0);
    const specialtyRef = useRef<HTMLDivElement>(null);

    // Get governorates and cities from egyptData
    const governorates = getGovernorates();
    const cities = governorate ? getCities(governorate) : [];

    // Close specialty dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (specialtyRef.current && !specialtyRef.current.contains(event.target as Node)) {
                setIsSpecialtyOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = () => {
        // Build query parameters
        const params = new URLSearchParams();
        if (governorate) params.append('governorate', governorate);
        if (area) params.append('city', area);
        if (specialty) params.append('specialty', specialty);
        if (searchText) params.append('name', searchText);
        if (gender) params.append('gender', gender);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);

        // Navigate to search page with filters
        const queryString = params.toString();
        window.location.href = `/search${queryString ? '?' + queryString : ''}`;
    };

    const itemsPerPage = 10;
    const allSpecialties = [...popularSpecialties, ...otherSpecialties];
    const totalPages = Math.ceil(allSpecialties.length / itemsPerPage);
    const currentSpecialties = allSpecialties.slice(
        specialtyPage * itemsPerPage,
        (specialtyPage + 1) * itemsPerPage
    );

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab("doctor")}
                    className={`px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === "doctor"
                        ? "bg-white text-red-600 shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } `}
                >
                    احجز عند دكتور
                </button>
                <button
                    onClick={() => setActiveTab("call")}
                    className={`px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === "call"
                        ? "bg-white text-red-600 shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } `}
                >
                    كلم دكتور
                </button>
            </div>

            {/* Search Box */}
            <div className="bg-white shadow-xl rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Governorate */}
                    <div className="relative">
                        <Select
                            value={governorate}
                            onValueChange={(val) => {
                                setGovernorate(val);
                                setArea("");
                            }}
                        >
                            <SelectTrigger className="h-12" dir="rtl">
                                <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {governorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                        {gov}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Area */}
                    <div className="relative">
                        <Select
                            value={area}
                            onValueChange={setArea}
                            disabled={!governorate}
                        >
                            <SelectTrigger className="h-12" dir="rtl">
                                <SelectValue placeholder="اختر المنطقة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {cities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Specialty (Restored Custom Dropdown) */}
                    <div className="relative md:col-span-2" ref={specialtyRef}>
                        <button
                            onClick={() => setIsSpecialtyOpen(!isSpecialtyOpen)}
                            className="w-full h-12 border border-gray-200 bg-white rounded-xl px-3 py-2 text-right flex items-center justify-between hover:border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all shadow-sm text-sm"
                        >
                            <span className={specialty ? "text-gray-900" : "text-muted-foreground"}>
                                {specialty || "اختر التخصص"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </button>

                        {isSpecialtyOpen && (
                            <div className="absolute top-full mt-2 w-full md:w-[500px] bg-white shadow-xl rounded-xl p-4 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 border">
                                <div className="mb-3">
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 text-right">التخصصات الأكثر بحثاً</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4" dir="rtl">
                                    {currentSpecialties.map((spec) => (
                                        <button
                                            key={spec}
                                            onClick={() => {
                                                setSpecialty(spec);
                                                setIsSpecialtyOpen(false);
                                                setSpecialtyPage(0);
                                            }}
                                            className="text-right p-2 rounded-lg transition-colors bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm"
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-3 border-t" dir="rtl">
                                    <button
                                        onClick={() => setSpecialtyPage(Math.max(0, specialtyPage - 1))}
                                        disabled={specialtyPage === 0}
                                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <span>السابق</span>
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        {specialtyPage + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setSpecialtyPage(Math.min(totalPages - 1, specialtyPage + 1))}
                                        disabled={specialtyPage >= totalPages - 1}
                                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span>التالي</span>
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Gender Filter for Large Screens or if showFilters is strictly for the dropdown row */}
                    {/* Wait, the original had Gender in a separate conditional block. 
                        If showFilters, it showed up. 
                        Let's check the grid. Standard is 5 columns. 
                        Gov(1) + Area(1) + Spec(2) + Input(1) = 5.
                        If Gender is present, layout might need adjustment or it wraps.
                        Original code: Gender was conditional. 
                        If showFilters, it showed up. 
                        
                        The original input was:
                        <div className={showFilters ? "relative" : "relative md:col-span-1"}> 
                        
                        If showFilters is true, we have:
                        Gov(1), Area(1), Spec(2), Gender(1), Input(1)? That's 6 cols?
                        Original grid was `md: grid - cols - 5`. 
                        So it would wrap. 
                        
                        Let's preserve the Gender logic.
                    */}

                    {showFilters && (
                        <div className="relative">
                            <Select
                                value={gender}
                                onValueChange={setGender}
                            >
                                <SelectTrigger className="h-12" dir="rtl">
                                    <SelectValue placeholder="النوع" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="male">ذكر</SelectItem>
                                    <SelectItem value="female">أنثى</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className={showFilters ? "relative" : "relative md:col-span-1"}>
                        <Input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="ابحث عن دكتور أو مستشفى"
                            className="h-12 text-right rounded-xl"
                        />
                    </div>
                </div>

                {/* Price Range Filter */}
                {
                    showFilters && (
                        <div className="mt-4">
                            <Select
                                value={minPrice && maxPrice ? `${minPrice}-${maxPrice}` : minPrice ? `${minPrice}-` : ""}
                                onValueChange={(val) => {
                                    if (val === "all") {
                                        setMinPrice("");
                                        setMaxPrice("");
                                    } else if (val.includes("-")) {
                                        const [min, max] = val.split("-");
                                        setMinPrice(min);
                                        setMaxPrice(max);
                                    } else if (val.endsWith("-")) {
                                        setMinPrice(val.replace("-", ""));
                                        setMaxPrice("");
                                    } else {
                                        setMinPrice("");
                                        setMaxPrice(val); // Handle "less than" cases if needed, though current logic supports ranges better
                                    }
                                }}
                            >
                                <SelectTrigger className="h-12 w-full text-right" dir="rtl">
                                    <SelectValue placeholder="سعر الكشف" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="0-100">أقل من 100 جنيه</SelectItem>
                                    <SelectItem value="100-200">من 100 إلى 200 جنيه</SelectItem>
                                    <SelectItem value="200-300">من 200 إلى 300 جنيه</SelectItem>
                                    <SelectItem value="300-500">من 300 إلى 500 جنيه</SelectItem>
                                    <SelectItem value="500-">أكثر من 500 جنيه</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }

                {/* Search Button */}
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleSearch}
                        className="bg-red-600 text-white px-7 py-3 rounded-xl text-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <Search className="h-5 w-5" />
                        <span>ابحث</span>
                    </button>
                </div>
            </div >
        </div >
    );
}
