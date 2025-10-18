import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site, SiteDocument } from '../pachuca-noticias/schemas/site.schema';
import { PublishedNoticia, PublishedNoticiaDocument } from '../pachuca-noticias/schemas/published-noticia.schema';
import { Category, CategoryDocument } from '../pachuca-noticias/schemas/category.schema';

/**
 * 🔄 Script de migración a multi-tenant
 *
 * Asigna todas las noticias y categorías existentes al sitio principal
 *
 * Ejecutar con: npm run migrate:multitenant
 */
async function migrateToMultitenant() {
  console.log('🔄 Iniciando migración a multi-tenant...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const siteModel = app.get<Model<SiteDocument>>(getModelToken(Site.name));
  const noticiaModel = app.get<Model<PublishedNoticiaDocument>>(getModelToken(PublishedNoticia.name));
  const categoryModel = app.get<Model<CategoryDocument>>(getModelToken(Category.name));

  try {
    // ========================================
    // 1. VERIFICAR SITIO PRINCIPAL
    // ========================================

    console.log('\n📍 Paso 1: Verificando sitio principal...');

    const mainSite = await siteModel.findOne({ isMainSite: true });

    if (!mainSite) {
      console.error('❌ ERROR: No se encontró el sitio principal.');
      console.log('   Ejecuta primero: npm run seed:sites');
      await app.close();
      process.exit(1);
    }

    console.log('✅ Sitio principal encontrado:');
    console.log('   ID:', mainSite._id);
    console.log('   Domain:', mainSite.domain);
    console.log('   Name:', mainSite.name);

    // ========================================
    // 2. MIGRAR NOTICIAS
    // ========================================

    console.log('\n📰 Paso 2: Migrando noticias...');

    // Contar noticias sin sitio asignado
    const noticiasWithoutSite = await noticiaModel.countDocuments({
      $or: [
        { sites: { $exists: false } },
        { sites: { $size: 0 } }
      ]
    });

    console.log(`   Noticias sin sitio: ${noticiasWithoutSite}`);

    if (noticiasWithoutSite > 0) {
      // Actualizar todas las noticias que no tienen sitio
      const noticiaResult = await noticiaModel.updateMany(
        {
          $or: [
            { sites: { $exists: false } },
            { sites: { $size: 0 } }
          ]
        },
        {
          $set: { sites: [mainSite._id] }
        }
      );

      console.log(`✅ ${noticiaResult.modifiedCount} noticias asignadas al sitio principal`);

      // Actualizar contador de noticias en el sitio
      const totalNoticias = await noticiaModel.countDocuments({
        sites: mainSite._id,
        status: 'published'
      });

      await siteModel.updateOne(
        { _id: mainSite._id },
        { $set: { totalNoticias } }
      );

      console.log(`   Total noticias en sitio: ${totalNoticias}`);
    } else {
      console.log('✅ Todas las noticias ya tienen sitio asignado');
    }

    // ========================================
    // 3. MIGRAR CATEGORÍAS
    // ========================================

    console.log('\n🏷️  Paso 3: Migrando categorías...');

    // Contar categorías sin sitio asignado
    const categoriesWithoutSite = await categoryModel.countDocuments({
      $or: [
        { sites: { $exists: false } },
        { sites: { $size: 0 } }
      ]
    });

    console.log(`   Categorías sin sitio: ${categoriesWithoutSite}`);

    if (categoriesWithoutSite > 0) {
      // Actualizar todas las categorías que no tienen sitio
      const categoryResult = await categoryModel.updateMany(
        {
          $or: [
            { sites: { $exists: false } },
            { sites: { $size: 0 } }
          ]
        },
        {
          $set: { sites: [mainSite._id] }
        }
      );

      console.log(`✅ ${categoryResult.modifiedCount} categorías asignadas al sitio principal`);
    } else {
      console.log('✅ Todas las categorías ya tienen sitio asignado');
    }

    // ========================================
    // 4. RESUMEN FINAL
    // ========================================

    console.log('\n📊 Resumen de migración:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalNoticiasInSite = await noticiaModel.countDocuments({ sites: mainSite._id });
    const totalCategoriasInSite = await categoryModel.countDocuments({ sites: mainSite._id });

    console.log(`   Sitio: ${mainSite.name} (${mainSite.domain})`);
    console.log(`   Noticias: ${totalNoticiasInSite}`);
    console.log(`   Categorías: ${totalCategoriasInSite}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Ejecutar migración
migrateToMultitenant()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en script:', error);
    process.exit(1);
  });
