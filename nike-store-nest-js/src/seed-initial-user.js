const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile();

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nike-store';
  const dbName = process.env.MONGO_DB_NAME || 'nike-store';
  const username = process.env.INIT_USER_USERNAME;
  const password = process.env.INIT_USER_PASSWORD;
  const email = process.env.INIT_USER_EMAIL;
  const roleName = process.env.INIT_USER_ROLE || 'admin';
  const fullName = process.env.INIT_USER_FULL_NAME || username;

  if (!username || !password || !email) {
    throw new Error(
      'Missing INIT_USER_USERNAME, INIT_USER_PASSWORD, or INIT_USER_EMAIL.',
    );
  }

  await mongoose.connect(mongoUri, { dbName });

  const roleCollection = mongoose.connection.collection('role');
  const usersCollection = mongoose.connection.collection('users');

  const defaultRoles = [
    {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: ['*'],
      active: true,
    },
    {
      name: 'user',
      description: 'Regular user',
      permissions: ['read:products', 'create:orders'],
      active: true,
    },
    {
      name: 'manager',
      description: 'Manager with limited admin access',
      permissions: ['read:*', 'write:products', 'write:orders'],
      active: true,
    },
  ];

  for (const role of defaultRoles) {
    await roleCollection.updateOne(
      { name: role.name },
      { $setOnInsert: { ...role, createdAt: new Date() } },
      { upsert: true },
    );
  }

  const role = await roleCollection.findOne({ name: roleName });
  if (!role) {
    throw new Error(`Role "${roleName}" not found.`);
  }

  const existingUser = await usersCollection.findOne({
    $or: [{ username }, { email }],
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const userPayload = {
    username,
    password: hashedPassword,
    email,
    roleId: role._id,
    age: 18,
    phone: '',
    fullName,
    addresses: [],
    isVerified: true,
    active: true,
  };

  if (existingUser) {
    await usersCollection.updateOne(
      { _id: existingUser._id },
      {
        $set: userPayload,
        $unset: {
          verificationToken: '',
          verificationTokenExpires: '',
        },
      },
    );
    console.log(`Updated verified ${roleName} user "${username}".`);
  } else {
    await usersCollection.insertOne({
      ...userPayload,
      createdAt: new Date(),
    });
    console.log(`Created verified ${roleName} user "${username}".`);
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
