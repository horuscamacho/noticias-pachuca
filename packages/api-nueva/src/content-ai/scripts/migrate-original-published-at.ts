import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIContentGeneration } from '../schemas/ai-content-generation.schema';

/**
 * 🔄 Script de Migración: originalPublishedAt
 *
 * Migra el campo publishedAt de ExtractedNoticia a originalPublishedAt
 * en AIContentGeneration para optimizar ordenamiento.
 *
 * Uso:
 * yarn ts-node src/content-ai/scripts/migrate-original-published-at.ts
 */

async function migrate() {
  console.log('🚀 Iniciando migración de originalPublishedAt...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const aiContentModel = app.get<Model<AIContentGeneration>>(
      getModelToken(AIContentGeneration.name)
    );

    // Buscar contenidos generados que tienen originalContentId pero no tienen originalPublishedAt
    const contentsToMigrate = await aiContentModel
      .find({
        originalContentId: { $exists: true, $ne: null },
        originalPublishedAt: { $exists: false },
      })
      .populate('originalContentId', 'publishedAt')
      .exec();

    console.log(`📊 Encontrados ${contentsToMigrate.length} contenidos para migrar\n`);

    if (contentsToMigrate.length === 0) {
      console.log('✅ No hay contenidos que migrar. La base de datos está actualizada.');
      await app.close();
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const content of contentsToMigrate) {
      try {
        const originalContent = content.originalContentId as unknown as { publishedAt?: Date };

        if (originalContent?.publishedAt) {
          await aiContentModel.updateOne(
            { _id: content._id },
            { $set: { originalPublishedAt: originalContent.publishedAt } }
          );
          updated++;

          if (updated % 100 === 0) {
            console.log(`   Procesados: ${updated}/${contentsToMigrate.length}...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`   ❌ Error migrando ${content._id}: ${(error as Error).message}`);
        errors++;
      }
    }

    console.log('\n✅ Migración completa:');
    console.log(`   - Actualizados: ${updated}`);
    console.log(`   - Sin publishedAt (omitidos): ${skipped}`);
    console.log(`   - Errores: ${errors}`);
    console.log(`   - Total procesados: ${contentsToMigrate.length}\n`);

    if (updated > 0) {
      console.log('💡 Recomendación: Ejecuta db.aicontentgenerations.reIndex() en MongoDB para optimizar índices.\n');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falló:', error);
    process.exit(1);
  });
