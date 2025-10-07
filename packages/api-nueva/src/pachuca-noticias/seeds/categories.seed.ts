#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import { Category } from '../schemas/category.schema';

/**
 * 🌱 Seed de Categorías Iniciales
 * Crea las categorías base del sistema
 *
 * Ejecutar: ts-node src/pachuca-noticias/seeds/categories.seed.ts
 */

const INITIAL_CATEGORIES = [
  {
    slug: 'politica',
    name: 'Política',
    description: 'Noticias sobre política local, estatal y nacional en Pachuca e Hidalgo',
    color: '#FF0000',
    icon: 'IconNews',
    order: 1,
    seoTitle: 'Noticias de Política en Pachuca e Hidalgo - Noticias Pachuca',
    seoDescription: 'Las últimas noticias políticas de Pachuca, Hidalgo y México. Análisis, opiniones y cobertura completa.',
    seoKeywords: 'política pachuca, política hidalgo, gobierno pachuca, política méxico',
  },
  {
    slug: 'deportes',
    name: 'Deportes',
    description: 'Cobertura deportiva: fútbol, Tuzos del Pachuca, y más deportes locales',
    color: '#00C853',
    icon: 'IconBallFootball',
    order: 2,
    seoTitle: 'Deportes en Pachuca - Tuzos del Pachuca y Más - Noticias Pachuca',
    seoDescription: 'Últimas noticias deportivas de Pachuca. Tuzos del Pachuca, Liga MX, deportes locales y más.',
    seoKeywords: 'deportes pachuca, tuzos pachuca, fútbol pachuca, liga mx',
  },
  {
    slug: 'cultura',
    name: 'Cultura',
    description: 'Eventos culturales, arte, música, teatro y tradiciones de Pachuca e Hidalgo',
    color: '#9333EA',
    icon: 'IconPalette',
    order: 3,
    seoTitle: 'Cultura en Pachuca e Hidalgo - Eventos y Tradiciones',
    seoDescription: 'Descubre la cultura de Pachuca: eventos, arte, música, teatro y tradiciones hidalguenses.',
    seoKeywords: 'cultura pachuca, eventos pachuca, arte hidalgo, tradiciones pachuca',
  },
  {
    slug: 'economia',
    name: 'Economía',
    description: 'Economía local, negocios, empleo y desarrollo económico en la región',
    color: '#FFB22C',
    icon: 'IconCoin',
    order: 4,
    seoTitle: 'Economía y Negocios en Pachuca e Hidalgo - Noticias Pachuca',
    seoDescription: 'Noticias de economía, negocios, empleo y desarrollo económico en Pachuca e Hidalgo.',
    seoKeywords: 'economía pachuca, negocios hidalgo, empleo pachuca, economía hidalgo',
  },
  {
    slug: 'seguridad',
    name: 'Seguridad',
    description: 'Noticias de seguridad pública, justicia y prevención del delito',
    color: '#6B7280',
    icon: 'IconShield',
    order: 5,
    seoTitle: 'Seguridad en Pachuca e Hidalgo - Noticias de Seguridad Pública',
    seoDescription: 'Información sobre seguridad pública, justicia y prevención del delito en Pachuca e Hidalgo.',
    seoKeywords: 'seguridad pachuca, seguridad hidalgo, policía pachuca, justicia hidalgo',
  },
  {
    slug: 'salud',
    name: 'Salud',
    description: 'Salud pública, servicios médicos, prevención y bienestar en Pachuca',
    color: '#3B82F6',
    icon: 'IconHeartbeat',
    order: 6,
    seoTitle: 'Salud en Pachuca e Hidalgo - Servicios Médicos y Bienestar',
    seoDescription: 'Noticias de salud pública, servicios médicos, prevención y bienestar en Pachuca e Hidalgo.',
    seoKeywords: 'salud pachuca, salud hidalgo, servicios médicos pachuca, hospitales pachuca',
  },
  {
    slug: 'educacion',
    name: 'Educación',
    description: 'Educación, universidades, escuelas y desarrollo académico en la región',
    color: '#F59E0B',
    icon: 'IconSchool',
    order: 7,
    seoTitle: 'Educación en Pachuca e Hidalgo - Universidades y Escuelas',
    seoDescription: 'Noticias educativas: UAEH, universidades, escuelas y desarrollo académico en Pachuca e Hidalgo.',
    seoKeywords: 'educación pachuca, uaeh, universidades hidalgo, escuelas pachuca',
  },
  {
    slug: 'tecnologia',
    name: 'Tecnología',
    description: 'Innovación, tecnología, startups y transformación digital',
    color: '#8B5CF6',
    icon: 'IconDeviceDesktop',
    order: 8,
    seoTitle: 'Tecnología e Innovación en Pachuca - Noticias Pachuca',
    seoDescription: 'Noticias de tecnología, innovación, startups y transformación digital en Pachuca e Hidalgo.',
    seoKeywords: 'tecnología pachuca, innovación hidalgo, startups pachuca, tech hidalgo',
  },
];

async function seedCategories() {
  console.log('🌱 Iniciando seed de categorías...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));

  try {
    // Verificar si ya existen categorías
    const existingCount = await categoryModel.countDocuments();

    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} categorías en la base de datos.`);
      console.log('¿Deseas continuar? Esto actualizará las categorías existentes.');
      console.log('Presiona Ctrl+C para cancelar o Enter para continuar...');

      // En un seed real, podrías pedir confirmación. Por ahora solo continuamos.
    }

    let created = 0;
    let updated = 0;

    for (const categoryData of INITIAL_CATEGORIES) {
      const existing = await categoryModel.findOne({ slug: categoryData.slug });

      if (existing) {
        // Actualizar
        await categoryModel.updateOne(
          { slug: categoryData.slug },
          { $set: categoryData }
        );
        console.log(`✏️  Actualizada: ${categoryData.name} (${categoryData.slug})`);
        updated++;
      } else {
        // Crear
        await categoryModel.create({
          ...categoryData,
          isActive: true,
          count: 0,
          totalViews: 0,
        });
        console.log(`✅ Creada: ${categoryData.name} (${categoryData.slug})`);
        created++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`  - Categorías creadas: ${created}`);
    console.log(`  - Categorías actualizadas: ${updated}`);
    console.log(`  - Total: ${INITIAL_CATEGORIES.length}`);
    console.log('\n✅ Seed completado exitosamente!');

  } catch (error) {
    console.error('❌ Error al ejecutar seed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Ejecutar seed
seedCategories()
  .then(() => {
    console.log('🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
