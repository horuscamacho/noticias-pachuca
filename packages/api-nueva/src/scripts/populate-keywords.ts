/**
 * 🔑 Script para poblar keywords en noticias extraídas existentes
 *
 * Extrae keywords del título y contenido usando análisis de frecuencia
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../noticias/schemas/extracted-noticia.schema';

// Palabras comunes en español a ignorar (stop words)
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'en', 'por', 'para', 'con', 'sin',
  'sobre', 'entre', 'hasta', 'desde', 'hacia', 'contra',
  'y', 'o', 'pero', 'si', 'no', 'que', 'como', 'cuando',
  'donde', 'quien', 'cual', 'este', 'ese', 'aquel',
  'esta', 'esa', 'aquella', 'estos', 'esos', 'aquellos',
  'ser', 'estar', 'haber', 'tener', 'hacer', 'ir', 'poder',
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde',
  'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante',
  'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras',
  'versus', 'vía', 'más', 'menos', 'muy', 'tan', 'tanto',
]);

/**
 * Extrae keywords de un texto usando análisis de frecuencia
 */
function extractKeywords(text: string, maxKeywords = 10): string[] {
  if (!text) return [];

  // Limpiar y normalizar texto
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s]/g, ' ') // Remover puntuación
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();

  // Dividir en palabras
  const words = normalized.split(' ');

  // Contar frecuencia de palabras (ignorando stop words y palabras cortas)
  const wordFreq = new Map<string, number>();

  for (const word of words) {
    // Ignorar palabras cortas, números y stop words
    if (word.length < 4 || STOP_WORDS.has(word) || /^\d+$/.test(word)) {
      continue;
    }

    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Ordenar por frecuencia y tomar las top N
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return sortedWords;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Obtener el modelo directamente del contexto
  const extractedNoticiaModel = app.get<Model<ExtractedNoticiaDocument>>('ExtractedNoticiaModel');

  console.log('🔑 Iniciando población de keywords...\n');

  try {
    // Obtener todas las noticias extraídas sin keywords
    const noticias = await extractedNoticiaModel
      .find({
        status: 'extracted',
        $or: [
          { keywords: { $exists: false } },
          { keywords: { $size: 0 } },
        ],
      })
      .limit(1000) // Procesar en batches de 1000
      .exec();

    console.log(`📊 Encontradas ${noticias.length} noticias sin keywords\n`);

    let updated = 0;
    let skipped = 0;

    for (const noticia of noticias) {
      // Combinar título y contenido
      const text = `${noticia.title || ''} ${noticia.content || ''}`;

      // Extraer keywords
      const keywords = extractKeywords(text, 10);

      if (keywords.length > 0) {
        // Actualizar documento
        await extractedNoticiaModel.updateOne(
          { _id: noticia._id },
          { $set: { keywords } }
        );

        updated++;
        console.log(`✅ ${noticia.title?.substring(0, 50)}... → [${keywords.slice(0, 5).join(', ')}]`);
      } else {
        skipped++;
        console.log(`⏭️  ${noticia.title?.substring(0, 50)}... → Sin keywords`);
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Actualizadas: ${updated}`);
    console.log(`   - Omitidas: ${skipped}`);
    console.log(`   - Total: ${noticias.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
