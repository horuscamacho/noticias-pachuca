import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site, SiteDocument } from '../schemas/site.schema';

/**
 * 🌱 Seed para crear el sitio principal: Noticias Pachuca
 *
 * Ejecutar con: npm run seed:sites
 */
async function seedSites() {
  console.log('🌱 Iniciando seed de Sites...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const siteModel = app.get<Model<SiteDocument>>(getModelToken(Site.name));

  try {
    // Verificar si ya existe el sitio principal
    const existingMainSite = await siteModel.findOne({ isMainSite: true });

    if (existingMainSite) {
      console.log('✅ Sitio principal ya existe:', existingMainSite.domain);
      console.log('   Saltando seed...');
      await app.close();
      return;
    }

    // Crear sitio principal: Noticias Pachuca (SCHEMA SIMPLIFICADO)
    const mainSite = await siteModel.create({
      domain: 'noticiaspachuca.com',
      slug: 'noticiaspachuca',
      name: 'Noticias Pachuca',
      description: 'El portal de noticias más completo de Pachuca y su región',

      // Redes sociales (inicialmente vacío, se configurará en FASE 13)
      socialMedia: {},

      // Estado
      isActive: true,
      isMainSite: true,

      // Stats iniciales (auto-generadas)
      totalNoticias: 0,
      totalViews: 0,
      totalSocialPosts: 0,
    });

    console.log('✅ Sitio principal creado exitosamente:');
    console.log('   Domain:', mainSite.domain);
    console.log('   Name:', mainSite.name);
    console.log('   ID:', mainSite._id);
    console.log('   isMainSite:', mainSite.isMainSite);

  } catch (error) {
    console.error('❌ Error al crear seed de Sites:', error);
    throw error;
  } finally {
    await app.close();
  }

  console.log('🌱 Seed de Sites completado');
}

// Ejecutar seed
seedSites()
  .then(() => {
    console.log('✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en script:', error);
    process.exit(1);
  });
