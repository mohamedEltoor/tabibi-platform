const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { cloudinary } = require('../middleware/uploadMiddleware');

exports.getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;

        // Validate Doctor ID presence
        if (!req.params.id || req.params.id === "undefined") {
            return res.status(400).json({ msg: 'Invalid Doctor ID' });
        }

        let query = {
            doctor: req.params.id,
            status: { $ne: 'cancelled' },
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } // From today onwards
        };

        if (date) {
            // If specific date requested
            const queryDate = new Date(date);
            query.date = queryDate;
        }

        const appointments = await Appointment.find(query).select('date time -_id');
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Doctor ID' });
        }
        res.status(500).send('Server error');
    }
};

exports.searchDoctors = async (req, res) => {
    try {
        const { governorate, city, specialty, name, gender, minPrice, maxPrice } = req.query;

        // Build user filter for location
        let userFilter = {};
        if (governorate) userFilter.governorate = governorate;
        if (city) userFilter.city = city;
        if (name) userFilter.name = { $regex: name, $options: 'i' }; // Case-insensitive search

        // Find users matching location/name criteria
        let userIds = [];
        if (Object.keys(userFilter).length > 0) {
            const users = await User.find({ ...userFilter, role: 'doctor' }).select('_id');
            userIds = users.map(u => u._id);
        }

        // Build doctor filter
        let doctorFilter = { isProfileComplete: true };
        if (specialty) doctorFilter.specialty = { $regex: specialty, $options: 'i' };
        if (gender) doctorFilter.gender = gender;

        // Price range filter
        if (minPrice || maxPrice) {
            doctorFilter['pricing.consultationFee'] = {};
            if (minPrice) doctorFilter['pricing.consultationFee'].$gte = Number(minPrice);
            if (maxPrice) doctorFilter['pricing.consultationFee'].$lte = Number(maxPrice);
        }

        // Access/Subscription Filter
        const now = new Date();
        doctorFilter.$and = [
            { isManuallyDeactivated: { $ne: true } },
            { isPaused: { $ne: true } },
            {
                $or: [
                    { trialExpiresAt: { $gt: now } },
                    { subscriptionExpiresAt: { $gt: now } }
                ]
            }
        ];

        // Combine filters
        if (userIds.length > 0) {
            doctorFilter.user = { $in: userIds };
        } else if (Object.keys(userFilter).length > 0) {
            // If we filtered by user but found none, return empty
            return res.json([]);
        }

        const doctors = await Doctor.find(doctorFilter)
            .populate('user', ['name', 'email', 'phone', 'governorate', 'city', 'address']);

        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.getAllDoctors = async (req, res) => {
    try {
        const now = new Date();
        const doctorFilter = {
            isProfileComplete: true,
            isManuallyDeactivated: { $ne: true },
            $or: [
                { trialExpiresAt: { $gt: now } },
                { subscriptionExpiresAt: { $gt: now } }
            ]
        };
        const doctors = await Doctor.find(doctorFilter).populate('user', ['name', 'email', 'phone', 'governorate', 'city', 'address']);
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('user', ['name', 'email', 'phone', 'governorate', 'city', 'address']);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.status(500).send('Server error');
    }
};

exports.createDoctorProfile = async (req, res) => {
    try {
        const { specialty, bio, pricing, availability } = req.body;

        // Check if doctor profile already exists
        let doctor = await Doctor.findOne({ user: req.user.id });
        if (doctor) {
            return res.status(400).json({ msg: 'Doctor profile already exists' });
        }

        doctor = new Doctor({
            user: req.user.id,
            specialty,
            bio,
            pricing,
            availability
        });

        await doctor.save();
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        // Always get user data first
        const user = await User.findById(req.user.id).select('-password');

        // Then try to get doctor profile
        const doctor = await Doctor.findOne({ user: req.user.id });

        // Calculate missing fields
        const completionStatus = checkProfileCompletion(user, doctor);

        // Return both user and doctor data in consistent format
        res.json({
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                governorate: user.governorate,
                city: user.city,
                address: user.address
            },
            doctor: doctor ? {
                _id: doctor._id,
                specialty: doctor.specialty,
                subspecialty: doctor.subspecialty,
                title: doctor.title,
                gender: doctor.gender,
                bio: doctor.bio,
                profileImage: doctor.profileImage,
                yearsOfExperience: doctor.yearsOfExperience,
                location: doctor.location,
                pricing: doctor.pricing,
                schedule: doctor.schedule,
                availability: doctor.availability,
                trialExpiresAt: doctor.trialExpiresAt,
                subscriptionExpiresAt: doctor.subscriptionExpiresAt,
                isManuallyDeactivated: doctor.isManuallyDeactivated,
                isPaused: doctor.isPaused,
                hasValidAccess: (!doctor.isManuallyDeactivated && !doctor.isPaused && (await checkValidFinancialAccess(doctor))),
                debtBreakdown: await calculateDebt(doctor),
                isProfileComplete: completionStatus.isComplete,
                missingFields: completionStatus.missingFields
            } : {
                hasValidAccess: true,
                debtBreakdown: { subscription: 0, commission: 0, total: 0, shouldBlock: false, appointmentCount: 0 },
                isProfileComplete: false,
                missingFields: completionStatus.missingFields
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const calculateDebt = async (doctor) => {
    const now = new Date();
    let subscriptionDebt = 0;

    // 1. Subscription Debt (Fixed 150)
    const isSubExpired = !doctor.subscriptionExpiresAt || new Date(doctor.subscriptionExpiresAt) < now;
    const isTrialExpired = doctor.trialExpiresAt && new Date(doctor.trialExpiresAt) < now;

    if ((isSubExpired && isTrialExpired) || doctor.isManuallyDeactivated) {
        subscriptionDebt = 150; // Hardcoded per platform rule
    }

    // 2. Unpaid Commission (Strictly PREVIOUS months only as per user rules)
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const dueAppointments = await Appointment.find({
        doctor: doctor._id,
        source: 'website',
        status: 'attended',
        'commission.paid': false,
        date: { $lte: endOfPrevMonth }
    });

    // Dynamic Calculation: Force 15% of current consultation fee
    const currentFee = doctor.pricing?.consultationFee || 0;
    const standardCommission = currentFee * 0.15;

    const commissionDebt = dueAppointments.length * standardCommission;

    // 3. Blocking Logic: Only block if past the 5th of the month
    const isCommissionOverdue = now.getDate() > 5 && commissionDebt > 0;
    const shouldBlock = (subscriptionDebt > 0) || isCommissionOverdue;

    return {
        subscription: subscriptionDebt,
        commission: Math.round(commissionDebt),
        total: subscriptionDebt + Math.round(commissionDebt),
        shouldBlock,
        appointmentCount: dueAppointments.length
    };
};

const checkValidFinancialAccess = async (doctor) => {
    const debt = await calculateDebt(doctor);
    // Block only if shouldBlock is true
    return !debt.shouldBlock;
};

exports.submitRenewalRequest = async (req, res) => {
    try {
        const { phone, receiptImage } = req.body;

        if (!phone || !receiptImage) {
            return res.status(400).json({ msg: 'يرجى تقديم رقم الهاتف وصورة الإيصال' });
        }

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }

        let imageUrl = receiptImage;
        if (receiptImage && receiptImage.startsWith('data:image')) {
            try {
                const result = await cloudinary.uploader.upload(receiptImage, {
                    folder: 'tabibi/receipts',
                    public_id: `renewal-${req.user.id}-${Date.now()}`
                });
                imageUrl = result.secure_url;
            } catch (err) {
                console.error('[Cloudinary] Renewal Receipt Upload Error:', err);
            }
        }

        doctor.renewalRequest = {
            phone,
            receiptImage: imageUrl,
            status: 'pending',
            requestedAt: new Date()
        };

        await doctor.save();
        res.json({ msg: 'تم إرسال طلب التجديد بنجاح، سيتم مراجعته من قبل الإدارة', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.submitCommissionPayment = async (req, res) => {
    try {
        const { phone, receiptImage, amount } = req.body;

        if (!phone || !receiptImage || !amount) {
            return res.status(400).json({ msg: 'يرجى تقديم رقم الهاتف، صورة الإيصال، والمبلغ المسدد' });
        }

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }

        let imageUrl = receiptImage;
        if (receiptImage && receiptImage.startsWith('data:image')) {
            try {
                const result = await cloudinary.uploader.upload(receiptImage, {
                    folder: 'tabibi/commissions',
                    public_id: `commission-${req.user.id}-${Date.now()}`
                });
                imageUrl = result.secure_url;
            } catch (err) {
                console.error('[Cloudinary] Commission Receipt Upload Error:', err);
            }
        }

        doctor.commissionPaymentRequest = {
            phone,
            receiptImage: imageUrl,
            amount,
            status: 'pending',
            requestedAt: new Date()
        };

        await doctor.save();
        res.json({ msg: 'تم إرسال طلب سداد العمولة بنجاح، سيتم مراجعته من قبل الإدارة', doctor });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const checkProfileCompletion = (user, doctor) => {
    const missingFields = [];
    if (!user) return { isComplete: false, missingFields: ['user_not_found'] };

    // 1. Basic User Info (Required for visibility)
    if (!user.phone) missingFields.push('phone');
    if (!user.governorate) missingFields.push('governorate');
    if (!user.city) missingFields.push('city');
    if (!user.address) missingFields.push('address');

    // 2. Doctor specific info
    if (!doctor) {
        // If no doctor profile exists yet, all these are missing
        missingFields.push('specialty');
        missingFields.push('consultationFee');
        missingFields.push('schedule');
    } else {
        // Medical Info
        if (!doctor.specialty) missingFields.push('specialty');

        // Pricing Info
        if (!(doctor.pricing && doctor.pricing.consultationFee && doctor.pricing.consultationFee > 0)) {
            missingFields.push('consultationFee');
        }

        // Schedule Info
        const hasSchedule = !!(doctor.schedule &&
            doctor.schedule.dailySchedules &&
            doctor.schedule.dailySchedules.some(s => s.enabled));
        if (!hasSchedule) missingFields.push('schedule');
    }

    const result = {
        isComplete: missingFields.length === 0,
        missingFields
    };

    console.log(`[ProfileCheck] User ${user?._id}:`, result);
    return result;
};

exports.updateMyProfile = async (req, res) => {
    try {
        const { name, phone, governorate, city, address, specialty, subspecialty, title, gender, bio, profileImage, yearsOfExperience, location, pricing, schedule, availability } = req.body;
        console.log('UpdateProfile Request Body Schedule:', JSON.stringify(schedule, null, 2));

        // Update user information
        const userFields = {};
        if (name) userFields.name = name;
        if (phone) userFields.phone = phone;
        if (governorate) userFields.governorate = governorate;
        if (city) userFields.city = city;
        if (address) userFields.address = address;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        // Prepare doctor fields
        const doctorFields = {};
        if (specialty) doctorFields.specialty = specialty;
        if (subspecialty) doctorFields.subspecialty = subspecialty;
        if (title) doctorFields.title = title;
        if (gender) doctorFields.gender = gender;
        if (bio !== undefined) doctorFields.bio = bio;

        // Handle Base64 Profile Image Upload to Supabase
        if (profileImage && profileImage.startsWith('data:image')) {
            try {
                // Upload Base64 to Cloudinary
                const result = await cloudinary.uploader.upload(profileImage, {
                    folder: 'tabibi/profiles',
                    public_id: `${req.user.id}-${Date.now()}`,
                    resource_type: 'image'
                });

                doctorFields.profileImage = result.secure_url;
            } catch (err) {
                console.error('[Cloudinary] Profile Upload Error:', err);
                // Fallback: keep previous image if upload fails
            }
        } else if (profileImage !== undefined) {
            doctorFields.profileImage = profileImage;
        }
        if (yearsOfExperience !== undefined) doctorFields.yearsOfExperience = yearsOfExperience;
        if (location !== undefined) doctorFields.location = location;
        if (pricing) doctorFields.pricing = pricing;
        if (schedule) doctorFields.schedule = schedule;
        if (availability) doctorFields.availability = availability;

        // Update existing doctor profile or create new one
        let doctor = await Doctor.findOne({ user: req.user.id });

        if (doctor) {
            // Update
            doctor = await Doctor.findOneAndUpdate(
                { user: req.user.id },
                { $set: doctorFields },
                { new: true }
            );
        } else if (specialty) {
            // Create new doctor profile
            doctorFields.user = req.user.id;
            doctor = new Doctor(doctorFields);
            await doctor.save();
        }

        // Final completion check
        let completionStatus = checkProfileCompletion(user, doctor);
        if (doctor) {
            if (completionStatus.isComplete !== doctor.isProfileComplete) {
                doctor.isProfileComplete = completionStatus.isComplete;
                await doctor.save();
            }
        }

        const populatedDoctor = doctor ? await Doctor.findById(doctor._id).populate('user', ['name', 'email', 'phone', 'governorate', 'city', 'address']) : null;

        // Merge missing fields into doctor object for response
        let doctorResponse = populatedDoctor ? populatedDoctor.toObject() : null;
        if (!doctorResponse) {
            doctorResponse = {
                isProfileComplete: false,
                missingFields: completionStatus.missingFields
            };
        } else {
            doctorResponse.missingFields = completionStatus.missingFields;
            doctorResponse.isProfileComplete = completionStatus.isComplete;
        }

        res.json({ user, doctor: doctorResponse });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMyPatients = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }

        // Find all appointments for this doctor
        const appointments = await Appointment.find({
            doctor: doctor._id
        }).populate('patient', 'name email phone gender dateOfBirth')
            .sort({ date: -1 });

        const phones = new Set();
        appointments.forEach(app => {
            if (app.patient && app.patient.phone) phones.add(app.patient.phone);
            if (app.guestDetails && app.guestDetails.phone) phones.add(app.guestDetails.phone);
        });

        // Fetch all Patient profiles (EMR) for these phones
        const patientProfiles = await Patient.find({ phone: { $in: Array.from(phones) } });
        const profilesMap = new Map();
        patientProfiles.forEach(p => profilesMap.set(p.phone, p));

        const patientsMap = new Map();

        appointments.forEach(app => {
            let patientPhone = null;
            let patientData = null;

            if (app.patient) {
                patientPhone = app.patient.phone;
                const profile = profilesMap.get(patientPhone);

                patientData = {
                    _id: app.patient._id.toString(),
                    name: profile?.name || app.patient.name,
                    email: app.patient.email,
                    phone: app.patient.phone,
                    gender: profile?.gender || app.patient.gender,
                    dateOfBirth: profile?.dateOfBirth || app.patient.dateOfBirth,
                    type: 'registered',
                    lastVisit: app.date
                };
            } else if (app.guestDetails && app.guestDetails.phone) {
                patientPhone = app.guestDetails.phone;
                const profile = profilesMap.get(patientPhone);

                patientData = {
                    _id: profile ? profile._id.toString() : `guest_${app.guestDetails.phone}`,
                    name: profile?.name || app.guestDetails.name,
                    phone: app.guestDetails.phone,
                    gender: profile?.gender,
                    type: profile ? (profile.isGuest ? 'guest' : 'registered') : 'guest',
                    lastVisit: app.date
                };
            }

            if (patientPhone) {
                if (patientsMap.has(patientPhone)) {
                    const existing = patientsMap.get(patientPhone);
                    if (patientData.type === 'registered' && existing.type === 'guest') {
                        patientsMap.set(patientPhone, { ...patientData, lastVisit: new Date(existing.lastVisit) > new Date(patientData.lastVisit) ? existing.lastVisit : patientData.lastVisit });
                    } else {
                        if (new Date(patientData.lastVisit) > new Date(existing.lastVisit)) {
                            existing.lastVisit = patientData.lastVisit;
                            patientsMap.set(patientPhone, existing);
                        }
                    }
                } else {
                    patientsMap.set(patientPhone, patientData);
                }
            }
        });

        const patients = Array.from(patientsMap.values());
        res.json(patients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.searchMyPatients = async (req, res) => {
    try {


        const { query } = req.query;
        if (!query) return res.json([]);

        // 1. Search Registered Users (searching Name OR Phone)
        const users = await User.find({
            $or: [
                { phone: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ],
            role: 'patient'
        }).select('name phone email').limit(5);

        // 2. Search Previous Guests (from Appointments)
        const doctor = await Doctor.findOne({ user: req.user.id });
        const guestAppointments = await Appointment.find({
            doctor: doctor._id,
            $or: [
                { 'guestDetails.phone': { $regex: query, $options: 'i' } },
                { 'guestDetails.name': { $regex: query, $options: 'i' } }
            ]
        }).select('guestDetails').limit(10);

        // Map users to unified format
        const results = users.map(u => ({
            _id: u._id,
            name: u.name,
            phone: u.phone,
            type: 'user'
        }));

        // Map guests and deduplicate by phone
        const existingPhones = new Set(results.map(r => r.phone));

        guestAppointments.forEach(app => {
            if (app.guestDetails && app.guestDetails.phone) {
                if (!existingPhones.has(app.guestDetails.phone)) {
                    results.push({
                        _id: `guest_${app.guestDetails.phone}`,
                        name: app.guestDetails.name,
                        phone: app.guestDetails.phone,
                        type: 'guest'
                    });
                    existingPhones.add(app.guestDetails.phone);
                }
            }
        });

        res.json(results.slice(0, 5)); // Limit total results to 5
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getDoctorFinance = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.json({
                thisMonth: { total: 0, website: 0, direct: 0, attendedWebsite: 0, commission: 0, unpaidCommission: 0 },
                lastMonth: { total: 0, website: 0, attendedWebsite: 0, commission: 0, unpaidCommission: 0 },
                lifetime: { total: 0, website: 0, direct: 0, attendedWebsite: 0, commission: 0, unpaidCommission: 0 }
            });
        }


        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const appointments = await Appointment.find({ doctor: doctor._id });

        const stats = {
            thisMonth: {
                total: appointments.filter(a => new Date(a.date) >= startOfMonth).length,
                website: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'website').length,
                direct: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'direct').length,
                attendedWebsite: appointments.filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended').length,
                commission: appointments
                    .filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended')
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0),
                unpaidCommission: appointments
                    .filter(a => new Date(a.date) >= startOfMonth && a.source === 'website' && a.status === 'attended' && !a.commission?.paid)
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0)
            },
            lastMonth: {
                total: appointments.filter(a => new Date(a.date) >= startOfLastMonth && new Date(a.date) <= endOfLastMonth).length,
                website: appointments.filter(a => new Date(a.date) >= startOfLastMonth && new Date(a.date) <= endOfLastMonth && a.source === 'website').length,
                attendedWebsite: appointments.filter(a => new Date(a.date) >= startOfLastMonth && new Date(a.date) <= endOfLastMonth && a.source === 'website' && a.status === 'attended').length,
                commission: appointments
                    .filter(a => new Date(a.date) >= startOfLastMonth && new Date(a.date) <= endOfLastMonth && a.source === 'website' && a.status === 'attended')
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0),
                unpaidCommission: appointments
                    .filter(a => new Date(a.date) >= startOfLastMonth && new Date(a.date) <= endOfLastMonth && a.source === 'website' && a.status === 'attended' && !a.commission?.paid)
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0)
            },
            lifetime: {
                total: appointments.length,
                website: appointments.filter(a => a.source === 'website').length,
                direct: appointments.filter(a => a.source === 'direct').length,
                attendedWebsite: appointments.filter(a => a.source === 'website' && a.status === 'attended').length,
                commission: appointments
                    .filter(a => a.source === 'website' && a.status === 'attended')
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0),
                unpaidCommission: appointments
                    .filter(a => a.source === 'website' && a.status === 'attended' && !a.commission?.paid)
                    .reduce((acc, curr) => acc + (doctor.pricing?.consultationFee * 0.15 || 0), 0)
            }
        };

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
