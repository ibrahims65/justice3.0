// const express = require('express');
// const router = express.Router();
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();
// const { checkRole } = require('../middleware/auth');

// router.post('/', checkRole(['Police']), async (req, res) => {
//   const { caseId, details } = req.body;
//   try {
//     await prisma.searchWarrant.create({
//       data: {
//         caseId: parseInt(caseId),
//         details,
//         status: 'Requested',
//       },
//     });
//     await prisma.actionHistory.create({
//       data: {
//         action: 'Search Warrant Requested',
//         caseId: parseInt(caseId),
//         userId: req.session.userId,
//       },
//     });
//     res.redirect(`/cases/${caseId}`);
//   } catch (error) {
//     res.redirect(`/cases/${caseId}`);
//   }
// });

// router.post('/:id/approve', checkRole(['Court']), async (req, res) => {
//   const warrantId = parseInt(req.params.id);
//   const warrant = await prisma.searchWarrant.findUnique({ where: { id: warrantId } });
//   await prisma.searchWarrant.update({
//     where: { id: warrantId },
//     data: { status: 'Approved' },
//   });
//   await prisma.actionHistory.create({
//     data: {
//       action: 'Search Warrant Approved',
//       caseId: warrant.caseId,
//       userId: req.session.userId,
//     },
//   });
//   res.redirect(`/cases/${warrant.caseId}`);
// });

// router.post('/:id/reject', checkRole(['Court']), async (req, res) => {
//     const warrantId = parseInt(req.params.id);
//     const warrant = await prisma.searchWarrant.findUnique({ where: { id: warrantId } });
//     await prisma.searchWarrant.update({
//         where: { id: warrantId },
//         data: { status: 'Rejected' },
//     });
//     await prisma.actionHistory.create({
//         data: {
//             action: 'Search Warrant Rejected',
//             caseId: warrant.caseId,
//             userId: req.session.userId,
//         },
//     });
//     res.redirect(`/cases/${warrant.caseId}`);
// });

// module.exports = router;
