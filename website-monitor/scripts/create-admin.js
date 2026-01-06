const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password for "123456":', hashedPassword);
}

createAdminUser();