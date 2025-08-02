const { generateCaseNumber } = require('../utils/caseNumber');

const policeMetricsService = require('../services/policeMetricsService');

exports.getPoliceDashboard = async (req, res, next) => {
    const prisma = require('../lib/prisma');
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
        const recentArrests = await prisma.arrestEvent.findMany({
            where: { officerId: userId },
            orderBy: { arrestedAt: 'desc' },
            take: 5,
            include: { case: true },
        });

        // There is no equivalent for "expiring custody" in the ArrestEvent model.
        const expiringCustody = [];

        res.render('police/police_dashboard', {
            user: sessionUser,
            metrics,
            recentBookings: recentArrests, // Use recentArrests here
            expiringCustody,
            req: req,
        });
    } catch (err) {
        next(err);
    }
};

exports.getCaseList = async (req, res, next) => {
    const prisma = require('../lib/prisma');
    try {
        const userId = req.session.user.id;
        const arrestEvents = await prisma.arrestEvent.findMany({
            where: { officerId: userId },
            include: { case: true },
        });

        const cases = arrestEvents.map((a) => a.case).filter(Boolean);

        res.render('police/case-list', { cases, user: req.session.user, req });
    } catch (err) {
        next(err);
    }
};

// The Person model does not exist in the schema. This function is removed.
// exports.getPersonList = async (req, res, next) => { ... }

exports.getManagementData = async (req, res) => {
    const prisma = require('../lib/prisma');
    try {
        if (!req.session.user) {
            // req.flash('error', 'You must be logged in to view this page.');
            return res.redirect('/login');
        }
        const officerId = req.session.user.id;

        const arrests = await prisma.arrestEvent.findMany({
            where: { officerId: officerId },
            include: {
                case: true,
            },
        });

        const cases = arrests.map(a => a.case).filter(Boolean);
        // The Person model does not exist.
        const people = [];


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
    // const prisma = require('../lib/prisma'); // No longer needed
    console.log('Session caseData:', req.session.caseData);
    // const policeStations = await prisma.policeStation.findMany(); // Model does not exist
    res.render('police/case/step2', {
        user: req.user,
        caseData: req.session.caseData,
        policeStations: [], // Pass empty array as model does not exist
        req: req,
    });
};

exports.postNewCaseStep2 = async (req, res) => {
    console.log('Session caseData:', req.session.caseData);
    req.session.caseData = { ...req.session.caseData, ...req.body, step: 3 };
    res.redirect('/police/cases/new/step3');
};

exports.getNewCaseStep3 = async (req, res) => {
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const arrestEvent = await prisma.arrestEvent.create({
        data: {
            case: {
                create: {
                    title: `Case for ${person.name}`,
                    description: officerNotes,
                    status: 'Open',
                }
            },
            officerId: req.session.user.id,
            arrestedAt: new Date(),
            location: policeStation.name,
            arrestType: 'On-site',
            notes: officerNotes,
        },
        include: {
            case: true
        }
    });
    delete req.session.caseData;
    res.redirect('/police/management');
    } catch (error) {
        next(error);
    }
};

// --- Remand Request Handlers ---
exports.getNewRemandRequest = async (req, res, next) => {
    const prisma = require('../lib/prisma');
    try {
        const arrestEvent = await prisma.arrestEvent.findUnique({
            where: { id: parseInt(req.params.arrestId) },
            include: { case: true },
        });
        res.render('police/new-remand', { arrestEvent, user: req.session.user, req });
    } catch (error) {
        next(error);
    }
};

exports.postNewRemandRequest = async (req, res, next) => {
    const prisma = require('../lib/prisma');
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

        await prisma.bailRemand.create({
            data: {
                caseId: parseInt(req.params.caseId),
                decisionType: decisionType,
                decisionDate: new Date(decisionDate),
                bailAmount: bailAmount ? parseFloat(bailAmount) : null,
                bailConditions: bailConditions,
                remandStartDate: new Date(remandStart),
                remandEndDate: new Date(remandEnd),
                courtApprovalFlag: courtApproval === 'on',
                approvedBy: req.session.user.username,
                approvalDate: new Date(),
                nextHearingDate: new Date(nextHearingDate),
                duration: remandDuration
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
    const prisma = require('../lib/prisma');
    try {
        const arrestEvents = await prisma.arrestEvent.findMany({
            include: {
                case: true,
            },
            orderBy: {
                arrestedAt: 'desc',
            },
        });
        res.render('police/bookings', {
            user: req.user,
            bookings: arrestEvents, // Keep view variable name for now
            req: req,
        });
    } catch (err) {
        console.error('Error listing bookings:', err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getPerson = async (req, res) => {
    const prisma = require('../lib/prisma');
    const person = await prisma.person.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            arrests: {
                include: {
                    case: true,
                },
            },
        },
    });
    res.render('police/person', { person, user: req.user, req: req });
};

exports.getArrestEvent = async (req, res) => {
    const prisma = require('../lib/prisma');
    const arrestEvent = await prisma.arrestEvent.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            case: true,
        },
    });
    res.render('police/booking', { booking: arrestEvent, user: req.user, req: req });
};

exports.getEditArrestEvent = async (req, res) => {
    const prisma = require('../lib/prisma');
    const arrestEvent = await prisma.arrestEvent.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            case: true,
        },
    });
    res.render('police/edit-booking', { booking: arrestEvent, user: req.user, req: req });
};

exports.postEditArrestEvent = async (req, res) => {
    const prisma = require('../lib/prisma');
    const { title, status, location } = req.body;
    await prisma.case.update({
        where: { id: parseInt(req.params.id) },
        data: {
            title,
            status,
        },
    });
    await prisma.arrestEvent.update({
        where: { id: parseInt(req.params.id) },
        data: {
            location: location,
        },
    });
    res.redirect(`/police/bookings/${req.params.id}`);
};

exports.search = async (req, res) => {
    const prisma = require('../lib/prisma');
    const { q } = req.query;
    const cases = await prisma.case.findMany({
        where: {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ],
        },
    });
    res.render('police/search-results', { cases, user: req.user, req: req });
};

exports.printPersonRecord = async (req, res) => {
    const prisma = require('../lib/prisma');
    // The Person model does not exist in the schema.
    // This function needs to be re-evaluated.
    console.log(`Request to print record for person ${req.params.id}, but Person model does not exist.`);
    res.send("This feature is temporarily disabled.");
};

exports.getNewPerson = (req, res) => {
    res.render('police/new-person', { user: req.user, req: req });
};

exports.postNewPerson = async (req, res) => {
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
    try {
        const caseData = await prisma.case.findUnique({ where: { id: parseInt(req.params.caseId) }, include: { booking: { include: { person: { include: { affiliations: true } } } } } });
        res.json(caseData.booking.person.affiliations);
    } catch (error) {
        next(error);
    }
};

exports.postAffiliations = async (req, res, next) => {
    const prisma = require('../lib/prisma');
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
    const prisma = require('../lib/prisma');
    try {
        const caseId = parseInt(req.params.caseId);
        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                evidences: true,
                investigations: true,
                victims: true,
                witnesses: true,
                courtEvents: true,
                arrests: true,
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
