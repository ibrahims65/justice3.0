require('dotenv').config();
const { exec } = require('child_process');

exec('npx prisma migrate dev --name add-notes-to-action-history', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
