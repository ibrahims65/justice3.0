const prisma = require('../lib/prisma');
const { generateCaseNumber } = require('../utils/caseNumber');

const policeMetricsService = require('../services/policeMetricsService');

exports.getPoliceDashboard = async (req, res, next) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser || !sessionUser.id) {
            // req.flash('error', 'Please log in to view the dashboard');
            return res.redirect('/login');
        }

        const userId = sessionUser.id;

        const metrics = await policeMetricsService.getDashboardMetrics(userId);

        console.log('--- Prisma Object Keys ---');
        console.log(Object.keys(prisma));
        const recentBookings = await prisma.booking.findMany({
            where: { arrestingOfficerId: userId },
            orderBy: { bookingDate: 'desc' },
            take: 5,
            include: { person: true, case: true },
        });

        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const expiringCustody = await prisma.booking.findMany({
            where: {
                arrestingOfficerId: userId,
                custodyExpiresAt: {
                    gte: now,
                    lte: twentyFourHoursFromNow,
                },
            },
            include: { person: true },
        });

        res.render('police/police_dashboard', {
            user: sessionUser,
            metrics,
            recentBookings,
            expiringCustody,
            req: req,
        });
    } catch (err) {
        next(err);
    }
};

exports.getCaseList = async (req, res, next) => {
    try {
        const cases = await prisma.case.findMany({
            where: { booking: { arrestingOfficerId: req.session.user.id } },
            include: { booking: true },
        });
        res.render('police/case-list', { cases, user: req.session.user, req });
    } catch (err) {
        next(err);
    }
};

exports.getPersonList = async (req, res, next) => {
    try {
        const people = await prisma.person.findMany({
            where: {
                bookings: { some: { arrestingOfficerId: req.session.user.id } },
            },
        });
        res.render('police/person-list', { people, user: req.session.user, req });
    } catch (err) {
        next(err);
    }
};

exports.getManagementData = async (req, res) => {
    try {
        if (!req.session.user) {
            // req.flash('error', 'You must be logged in to view this page.');
            return res.redirect('/login');
        }
        const officerId = req.session.user.id;
        const cases = await prisma.case.findMany({
            where: {
                booking: {
                    arrestingOfficerId: officerId,
                },
            },
            include: {
                booking: true,
            },
        });

        const people = await prisma.person.findMany({
            where: {
                bookings: {
                    some: {
                        arrestingOfficerId: officerId,
                    },
                },
            },
        });

        res.render('police/management', {
            user: req.session.user,
            cases,
            people,
            req: req,
        });
    } catch (err) {
        console.error('Management data error:', err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getNewCaseStep1 = (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { step: 1 };
    res.render('police/case/step1', { user: req.user, req: req });
};

exports.postNewCaseStep1 = (req, res) => {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    req.session.caseData = { ...req.session.caseData, ...req.body, photoUrl, step: 2 };
    res.redirect('/police/cases/new/step2');
};

exports.getNewCaseStep2 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    const policeStations = await prisma.policeStation.findMany();
    res.render('police/case/step2', {
        user: req.user,
        caseData: req.session.caseData,
        policeStations,
        req: req,
    });
};

exports.postNewCaseStep2 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { ...req.session.caseData, ...req.body, step: 3 };
    res.redirect('/police/cases/new/step3');
};

exports.getNewCaseStep3 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    const { name, email, dob, caseNumber, status, policeStationId } = req.session.caseData;
    const policeStation = await prisma.policeStation.findUnique({ where: { id: parseInt(policeStationId) } });
    res.render('police/case/step3', {
        user: req.user,
        person: { name, email, dob },
        caseDetails: { caseNumber, status },
        policeStation,
        req: req,
    });
};

exports.postNewCaseConfirm = async (req, res, next) => {
    try {
        const { name, email, dob, status, policeStationId, phone, address, photoUrl, charges, officerNotes, custodyExpiresAt } = req.session.caseData;

        // --- Refactored Query Start ---
        // 1. Fetch Police Station
        const policeStation = await prisma.policeStation.findUnique({
            where: { id: parseInt(policeStationId) },
        });
        if (!policeStation) throw new Error('Police station not found');

        // 2. Fetch City
        const city = await prisma.city.findUnique({
            where: { id: policeStation.cityId },
        });
        if (!city) throw new Error('City not found');

        // 3. Fetch District
        const district = await prisma.district.findUnique({
            where: { id: city.districtId },
        });
        if (!district) throw new Error('District not found');

        // 4. Fetch Region
        const region = await prisma.region.findUnique({
            where: { id: district.regionId },
        });
        if (!region) throw new Error('Region not found');
        // --- Refactored Query End ---

        const caseNumber = generateCaseNumber(region.name, city.name);

        // --- Find or Create Person Logic ---
        const person = await prisma.person.upsert({
            where: { email: email },
            update: {
                name,
                dob: new Date(dob),
                phone,
                address,
                photoUrl,
            },
            create: {
                name,
                email,
                dob: new Date(dob),
                phone,
                address,
                photoUrl,
            },
        });
        // --- End Find or Create Person Logic ---
    const booking = await prisma.booking.create({
        data: {
            personId: person.id,
            policeStationId: parseInt(policeStationId),
            bookingDate: new Date(),
            status: 'Open',
            arrestingOfficerId: req.session.user.id,
            charges,
            officerNotes,
            custodyExpiresAt: custodyExpiresAt ? new Date(custodyExpiresAt) : null,
        },
    });
    const createdCase = await prisma.case.create({
        data: {
            bookingId: booking.id,
            caseNumber,
            status,
        },
    });
    await prisma.booking.update({
        where: { id: booking.id },
        data: {
            case: {
                connect: { id: createdCase.id },
            },
        },
    });
    delete req.session.caseData;
    res.redirect('/police/management');
    } catch (error) {
        next(error);
    }
};

// --- Remand Request Handlers ---
exports.getNewRemandRequest = async (req, res, next) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(req.params.bookingId) },
            include: { person: true },
        });
        res.render('police/new-remand', { booking, user: req.session.user, req });
    } catch (error) {
        next(error);
    }
};

exports.postNewRemandRequest = async (req, res, next) => {
    try {
        const {
            decisionType,
            decisionDate,
            bailAmount,
            bailConditions,
            remandStart,
            remandEnd,
            reason,
            requestedDays,
            courtApproval,
            nextHearingDate
        } = req.body;

        let remandDuration = null;
        if (remandStart && remandEnd) {
            const start = new Date(remandStart);
            const end = new Date(remandEnd);
            const diffTime = Math.abs(end - start);
            remandDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        await prisma.remandRequest.create({
            data: {
                bookingId: parseInt(req.params.bookingId),
                requestedBy: req.session.user.username,
                reason,
                requestedDays: parseInt(requestedDays),
                status: 'pending',
                decisionDate: new Date(decisionDate),
                bailAmount: bailAmount ? parseFloat(bailAmount) : null,
                bailConditions,
                remandStart: remandStart ? new Date(remandStart) : null,
                remandEnd: remandEnd ? new Date(remandEnd) : null,
                courtApproval: courtApproval === 'on',
                nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
                remandDuration,
            },
        });

        // Placeholder for audit log
        console.log(`Remand/Bail request created for booking ${req.params.bookingId} by ${req.session.user.username}`);

        // req.flash('success', 'Remand/Bail request submitted successfully.');
        res.redirect('/police');
    } catch (error) {
        next(error);
    }
};

exports.listBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                person: true,
                case: true,
            },
            orderBy: {
                bookingDate: 'desc',
            },
        });
        res.render('police/bookings', {
            user: req.user,
            bookings,
            req: req,
        });
    } catch (err) {
        console.error('Error listing bookings:', err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getPerson = async (req, res) => {
    const person = await prisma.person.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            bookings: {
                include: {
                    case: true,
                },
            },
        },
    });
    res.render('police/person', { person, user: req.user, req: req });
};

exports.getBooking = async (req, res) => {
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            person: true,
            case: true,
            policeStation: true,
        },
    });
    res.render('police/booking', { booking, user: req.user, req: req });
};

exports.getEditBooking = async (req, res) => {
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            person: true,
            case: true,
            policeStation: true,
        },
    });
    const policeStations = await prisma.policeStation.findMany();
    res.render('police/edit-booking', { booking, policeStations, user: req.user, req: req });
};

exports.postEditBooking = async (req, res) => {
    const { caseNumber, status, policeStationId } = req.body;
    await prisma.case.update({
        where: { id: parseInt(req.params.id) },
        data: {
            caseNumber,
            status,
        },
    });
    await prisma.booking.update({
        where: { id: parseInt(req.params.id) },
        data: {
            policeStationId: parseInt(policeStationId),
        },
    });
    res.redirect(`/police/bookings/${req.params.id}`);
};

exports.search = async (req, res) => {
    const { q } = req.query;
    const cases = await prisma.case.findMany({
        where: {
            OR: [
                { caseNumber: { contains: q, mode: 'insensitive' } },
                { booking: { person: { name: { contains: q, mode: 'insensitive' } } } },
            ],
        },
        include: {
            booking: {
                include: {
                    person: true,
                },
            },
        },
    });
    res.render('police/search-results', { cases, user: req.user, req: req });
};

exports.printPersonRecord = async (req, res) => {
    const person = await prisma.person.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            bookings: {
                include: {
                    case: true,
                    policeStation: true,
                },
            },
        },
    });
    res.render('police/print-record', { person, layout: 'layouts/print' });
};

exports.getNewPerson = (req, res) => {
    res.render('police/new-person', { user: req.user, req: req });
};

exports.postNewPerson = async (req, res) => {
    const { name, email, dob } = req.body;
    const person = await prisma.person.create({
        data: {
            name,
            email,
            dob: new Date(dob),
        },
    });
    res.redirect('/police/management');
};

// --- Case Detail Module Handlers ---

// Evidence
exports.getEvidenceList = async (req, res, next) => {
    try {
        const evidence = await prisma.evidence.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(evidence);
    } catch (error) {
        next(error);
    }
};

exports.postEvidence = async (req, res, next) => {
    try {
        const { evidenceType, description, storageLocation, chainOfCustodyStatus, evidenceValue, notes } = req.body;
        await prisma.evidence.create({
            data: {
                caseId: parseInt(req.params.caseId),
                evidenceType,
                description,
                storageLocation,
                chainOfCustodyStatus,
                evidenceValue: evidenceValue ? parseFloat(evidenceValue) : null,
                notes,
                fileUrl: '', // Placeholder for now
                receivedFrom: req.session.user.username,
                dateReceived: new Date(),
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=evidence`);
    } catch (error) {
        next(error);
    }
};

// Investigations
exports.getInvestigationsList = async (req, res, next) => {
    try {
        const investigations = await prisma.investigation.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(investigations);
    } catch (error) {
        next(error);
    }
};

exports.postInvestigations = async (req, res, next) => {
    try {
        const { investigatorName, investigatorBadgeNumber, investigatorRank, details, startDate, endDate, status } = req.body;
        await prisma.investigation.create({
            data: {
                caseId: parseInt(req.params.caseId),
                investigatorName,
                investigatorBadgeNumber,
                investigatorRank,
                details,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status,
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=investigations`);
    } catch (error) {
        next(error);
    }
};

// Victims
exports.getVictimsList = async (req, res, next) => {
    try {
        const victims = await prisma.victim.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(victims);
    } catch (error) {
        next(error);
    }
};

exports.postVictims = async (req, res, next) => {
    try {
        const { name, dob, gender, nationality, address, contact, statement } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
        await prisma.victim.create({
            data: {
                caseId: parseInt(req.params.caseId),
                name,
                dob: new Date(dob),
                gender,
                nationality,
                address,
                phone: contact, // Assuming contact is phone for now
                statement,
                photoUrl,
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=victims`);
    } catch (error) {
        next(error);
    }
};

// Witnesses
exports.getWitnessesList = async (req, res, next) => {
    try {
        const witnesses = await prisma.witness.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(witnesses);
    } catch (error) {
        next(error);
    }
};

exports.postWitnesses = async (req, res, next) => {
    try {
        const { name, statement, relationshipToCase, dateInterviewed, isAnonymous } = req.body;
        await prisma.witness.create({
            data: {
                caseId: parseInt(req.params.caseId),
                name,
                statement,
                relationshipToCase,
                dateInterviewed: dateInterviewed ? new Date(dateInterviewed) : null,
                isAnonymous: isAnonymous === 'on', // Checkbox value is 'on' if checked
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=witnesses`);
    } catch (error) {
        next(error);
    }
};

// Hearings
exports.getHearingsList = async (req, res, next) => {
    try {
        const hearings = await prisma.hearing.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(hearings);
    } catch (error) {
        next(error);
    }
};

exports.postHearings = async (req, res, next) => {
    try {
        const { hearingDate, verdict, courtId } = req.body;
        await prisma.hearing.create({
            data: {
                caseId: parseInt(req.params.caseId),
                hearingDate: new Date(hearingDate),
                verdict,
                courtId: parseInt(courtId),
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view`);
    } catch (error) {
        next(error);
    }
};

// Warrants
exports.getWarrantsList = async (req, res, next) => {
    try {
        const warrants = await prisma.warrant.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(warrants);
    } catch (error) {
        next(error);
    }
};

exports.postWarrants = async (req, res, next) => {
    try {
        const { status, details, expiresAt } = req.body;
        await prisma.warrant.create({
            data: {
                caseId: parseInt(req.params.caseId),
                status,
                details,
                expiresAt: new Date(expiresAt),
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view`);
    } catch (error) {
        next(error);
    }
};

const caseModules = {
    evidence: { label: 'Evidence', icon: 'fa-box' },
    investigations: { label: 'Investigations', icon: 'fa-search' },
    victims: { label: 'Victims', icon: 'fa-user-shield' },
    witnesses: { label: 'Witnesses', icon: 'fa-users' },
    hearings: { label: 'Hearings', icon: 'fa-gavel' },
    warrants: { label: 'Warrants', icon: 'fa-file-alt' },
    charges: { label: 'Charges', icon: 'fa-file-invoice-dollar' },
    affiliations: { label: 'Affiliations', icon: 'fa-sitemap' },
    legalReps: { label: 'Legal Representation', icon: 'fa-balance-scale' },
};

exports.getLegalRepsList = async (req, res, next) => {
    try {
        const legalReps = await prisma.legalRepresentation.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(legalReps);
    } catch (error) {
        next(error);
    }
};

exports.postLegalReps = async (req, res, next) => {
    try {
        const { lawyerName, firm, roleType, contactInfo, startDate, endDate, documentType, caseOutcome } = req.body;
        const documentUpload = req.file ? `/uploads/${req.file.filename}` : null;
        await prisma.legalRepresentation.create({
            data: {
                caseId: parseInt(req.params.caseId),
                lawyerName,
                firm,
                roleType,
                contactInfo,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                documentUpload,
                documentType,
                caseOutcome,
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=legalReps`);
    } catch (error) {
        next(error);
    }
};

exports.getChargesList = async (req, res, next) => {
    try {
        const charges = await prisma.charge.findMany({
            where: { caseId: parseInt(req.params.caseId) },
        });
        res.json(charges);
    } catch (error) {
        next(error);
    }
};

exports.postCharges = async (req, res, next) => {
    try {
        const { statute, section, description, allegedDate, countNumber, degree } = req.body;
        await prisma.charge.create({
            data: {
                caseId: parseInt(req.params.caseId),
                statute,
                section,
                description,
                allegedDate: allegedDate ? new Date(allegedDate) : null,
                countNumber: countNumber ? parseInt(countNumber) : null,
                degree,
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=charges`);
    } catch (error) {
        next(error);
    }
};

exports.getAffiliationsList = async (req, res, next) => {
    try {
        const caseData = await prisma.case.findUnique({ where: { id: parseInt(req.params.caseId) }, include: { booking: { include: { person: { include: { affiliations: true } } } } } });
        res.json(caseData.booking.person.affiliations);
    } catch (error) {
        next(error);
    }
};

exports.postAffiliations = async (req, res, next) => {
    try {
        const { organization, role, startDate, endDate, evidenceLink, status } = req.body;
        const caseData = await prisma.case.findUnique({ where: { id: parseInt(req.params.caseId) }, include: { booking: true } });
        await prisma.affiliation.create({
            data: {
                personId: caseData.booking.personId,
                organization,
                role,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                evidenceLink,
                status,
            },
        });
        res.redirect(`/police/cases/${req.params.caseId}/view?module=affiliations`);
    } catch (error) {
        next(error);
    }
};

exports.getCaseDetail = async (req, res, next) => {
    try {
        const caseId = parseInt(req.params.caseId);
        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                evidence: true,
                investigations: true,
                victims: true,
                witnesses: true,
                hearings: true,
                warrants: true,
                booking: {
                    include: {
                        person: true,
                    },
                },
            },
        });

        if (!caseData) {
            return res.status(404).send('Case not found');
        }

        const counts = Object.keys(caseModules).reduce((acc, mod) => {
            acc[mod] = caseData[mod] ? caseData[mod].length : 0;
            return acc;
        }, {});

        const labels = Object.keys(caseModules).reduce((acc, mod) => {
            acc[mod] = caseModules[mod].label;
            return acc;
        }, {});

        const icons = Object.keys(caseModules).reduce((acc, mod) => {
            acc[mod] = caseModules[mod].icon;
            return acc;
        }, {});

        res.render('police/case-detail', {
            caseData: caseData,
            counts,
            labels,
            icons,
            user: req.session.user,
            req,
            module: req.query.module || 'evidence', // Default to evidence
        });
    } catch (error) {
        next(error);
    }
};
