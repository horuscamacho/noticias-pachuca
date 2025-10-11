/**
 * 🧹 Script para eliminar ExtractedNoticias en estado 'pending'
 *
 * Uso: npx ts-node scripts/cleanup-pending-extractions.ts
 */

import { connect, connection } from 'mongoose';

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://admin:password123@localhost:27017/noticias_pachuca?authSource=admin';

async function cleanupPendingExtractions() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const db = connection.db!;
    const extractedNoticiasCollection = db.collection('extractednoticias');

    // Contar cuántos hay en pending
    const pendingCount = await extractedNoticiasCollection.countDocuments({
      status: 'pending'
    });

    console.log(`\n📊 ExtractedNoticias en estado 'pending': ${pendingCount}`);

    if (pendingCount === 0) {
      console.log('✅ No hay nada que limpiar');
      await connection.close();
      return;
    }

    // Mostrar algunos ejemplos
    console.log('\n📄 Ejemplos de documentos pending:');
    const examples = await extractedNoticiasCollection
      .find({ status: 'pending' })
      .limit(5)
      .toArray();

    examples.forEach((doc, idx) => {
      console.log(`\n${idx + 1}. URL: ${doc.sourceUrl}`);
      console.log(`   Title: ${doc.title || '(vacío)'}`);
      console.log(`   Content: ${doc.content ? doc.content.substring(0, 50) + '...' : '(vacío)'}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Created: ${doc.createdAt}`);
    });

    // Eliminar todos los pending
    console.log('\n🗑️  Eliminando ExtractedNoticias pending...');
    const result = await extractedNoticiasCollection.deleteMany({
      status: 'pending'
    });

    console.log(`✅ Eliminados ${result.deletedCount} documentos`);

    // Verificar
    const remainingPending = await extractedNoticiasCollection.countDocuments({
      status: 'pending'
    });

    console.log(`\n📊 ExtractedNoticias pending restantes: ${remainingPending}`);

    await connection.close();
    console.log('\n✅ Script completado');

  } catch (error) {
    console.error('❌ Error:', error);
    await connection.close();
    process.exit(1);
  }
}

// Ejecutar
cleanupPendingExtractions();
