const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Police']), async (req, res) => {
  const { caseId, reason, notes } = req.body;
  await prisma.case.update({
    where: { id: parseInt(caseId) },
    data: {
      status: 'Released',
      description: `Released for: ${reason}. Notes: ${notes}`,
    },
  });
  // The schema does not have a ReleaseRecord model.
  // This functionality needs to be re-evaluated.
  console.log(`Case ${caseId} marked as released.`);
  res.redirect(`/cases/${caseId}`);
});

module.exports = router;
