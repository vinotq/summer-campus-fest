import 'dotenv/config';
import crypto from 'crypto';

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('base64url');
const key = crypto.scryptSync(plain, salt, 32, { N: 16384, r: 8, p: 1 });
const hash = `scrypt:${salt}:${key.toString('base64url')}`;

console.log(hash);
console.log('\nДобавьте в .env:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
