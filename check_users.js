const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(r => {
  console.log(JSON.stringify(r.map(u => ({id: u.id, email: u.email, role: u.role})), null, 2));
  return p.$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
