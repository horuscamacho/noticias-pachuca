#!/usr/bin/env node
/**
 * Script para crear usuarios en la base de datos
 *
 * Uso:
 * node scripts/create-user.js
 *
 * Nota: Asegúrate de tener las variables de entorno configuradas
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuración del usuario a crear
const USER_DATA = {
  email: 'test-local@example.com', // Cambiar en producción
  username: 'testlocal', // Cambiar en producción
  password: 'Fernanda.1986!',
  firstName: 'Sinhue',
  lastName: 'Camacho',
  role: 'super_admin', // super_admin, admin, moderator, user
};

// Configuración de MongoDB desde variables de entorno
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pachuca-noticias';
const BCRYPT_ROUNDS = 12;

async function createUser() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log(`   URI: ${MONGO_URI.replace(/:[^:@]+@/, ':***@')}`); // Ocultar password en logs

    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Verificar si el usuario ya existe
    console.log(`🔍 Verificando si el usuario existe...`);
    console.log(`   Email: ${USER_DATA.email}`);
    console.log(`   Username: ${USER_DATA.username}`);

    const existingUser = await usersCollection.findOne({
      $or: [
        { email: USER_DATA.email.toLowerCase() },
        { username: USER_DATA.username }
      ]
    });

    if (existingUser) {
      console.log('\n❌ ERROR: El usuario ya existe');
      console.log('   Email:', existingUser.email);
      console.log('   Username:', existingUser.username);
      console.log('   Created:', existingUser.createdAt);
      console.log('\n💡 Si quieres crear un usuario diferente, modifica el script.');
      process.exit(1);
    }

    console.log('✅ Usuario no existe, procediendo a crear...\n');

    // Hash del password
    console.log('🔐 Hasheando password...');
    const hashedPassword = await bcrypt.hash(USER_DATA.password, BCRYPT_ROUNDS);
    console.log(`✅ Password hasheado con ${BCRYPT_ROUNDS} rounds\n`);

    // Crear el documento del usuario
    const newUser = {
      email: USER_DATA.email.toLowerCase(),
      username: USER_DATA.username,
      password: hashedPassword,
      firstName: USER_DATA.firstName,
      lastName: USER_DATA.lastName,
      avatar: null,
      phone: null,
      dateOfBirth: null,
      isActive: true,
      emailVerified: true, // Auto-verificado para admin
      emailVerifiedAt: new Date(),
      role: USER_DATA.role,
      subscriptionStatus: 'inactive',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
        marketing: true,
        updates: true,
        security: true,
      },
      interests: [],
      lastLoginAt: null,
      lastActiveAt: null,
      loginCount: 0,
      lastLoginIP: null,
      lastLoginUserAgent: null,
      privacySettings: {
        profilePublic: false,
        showEmail: false,
        allowComments: true,
        allowFollowers: true,
      },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insertar usuario
    console.log('💾 Creando usuario en la base de datos...');
    const result = await usersCollection.insertOne(newUser);

    console.log('\n✅ ¡Usuario creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 INFORMACIÓN DEL USUARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID:         ${result.insertedId}`);
    console.log(`   Email:      ${newUser.email}`);
    console.log(`   Username:   ${newUser.username}`);
    console.log(`   Nombre:     ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Role:       ${newUser.role}`);
    console.log(`   Password:   ${USER_DATA.password}`);
    console.log(`   Verificado: ${newUser.emailVerified ? 'Sí' : 'No'}`);
    console.log(`   Activo:     ${newUser.isActive ? 'Sí' : 'No'}`);
    console.log(`   Creado:     ${newUser.createdAt.toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Ahora puedes iniciar sesión con estas credenciales\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 11000) {
      console.error('   Este error generalmente significa que el email o username ya existe.');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
createUser();
