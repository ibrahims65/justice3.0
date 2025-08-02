const prisma = require('../lib/prisma');

/**
 * Renders the police dashboard.
 */
exports.getDashboard = async (req, res, next) => {
    try {
        const user = req.user;
        // Basic check for user existence
        if (!user || !user.id) {
            return res.redirect('/login');
        }

        // In a real application, you would fetch real metrics.
        const metrics = { totalCases: 0, openCases: 0, activeRemands: 0, pendingEvidence: 0 };
        const recentArrests = [];
        const expiringCustody = [];

        res.render('police/dashboard', {
            user: user,
            metrics,
            recentBookings: recentArrests, // The view expects recentBookings
            expiringCustody,
            req: req,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Renders the list of cases assigned to the current officer.
 */
exports.getCaseList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const arrestEvents = await prisma.arrestEvent.findMany({
            where: { officerId: userId },
            include: { case: true },
        });

        const cases = arrestEvents.map((a) => a.case).filter(Boolean);
        res.render('police/case-list', { cases, user: req.user, req });
    } catch (err) {
        next(err);
    }
};

/**
 * Renders the form to create a new case.
 */
exports.getNewCaseForm = (req, res) => {
    res.render('police/new-case', { title: 'New Case', user: req.user });
};

/**
 * Handles the creation of a new Case, including the associated Person and ArrestEvent.
 */
exports.createCase = async (req, res) => {
    const { title, description, location, notes, personName, dob, email } = req.body;
    const officerId = req.user.id;

    try {
        const newCase = await prisma.case.create({
            data: {
                title,
                description,
                status: 'Open',
                arrests: {
                    create: {
                        officerId,
                        location,
                        notes,
                        person: {
                            create: {
                                name: personName,
                                dob: new Date(dob),
                                email,
                            }
                        }
                    }
                }
            },
            include: {
                arrests: true,
            }
        });

        res.redirect(`/police/cases/${newCase.id}`);
    } catch (error) {
        console.error(error);
        res.redirect('/police/cases/new');
    }
};

/**
 * Renders the detail page for a specific case.
 */
exports.getCaseDetail = async (req, res) => {
    const caseRecord = await prisma.case.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            arrests: { include: { person: true } },
            evidences: true,
        }
    });
    res.render('police/case-detail', { title: `Case #${caseRecord.id}`, caseRecord, user: req.user });
};

/**
 * Handles the submission of new evidence for a case.
 */
exports.addEvidence = async (req, res) => {
    const { type, description } = req.body;
    const caseId = parseInt(req.params.id);

    try {
        await prisma.evidence.create({
            data: {
                caseId,
                type,
                description,
            }
        });
        res.redirect(`/police/cases/${caseId}`);
    } catch (error) {
        console.error(error);
        res.redirect(`/police/cases/${caseId}`);
    }
};
