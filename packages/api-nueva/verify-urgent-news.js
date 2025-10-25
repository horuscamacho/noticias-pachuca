#!/usr/bin/env node

/**
 * URGENT NEWS VERIFICATION SCRIPT
 *
 * This script checks the database to verify:
 * 1. How many urgent news exist (isUrgent: true)
 * 2. What their titles are
 * 3. Their publication status
 */

const { MongoClient } = require('mongodb');

async function verifyUrgentNews() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/noticias-pachuca';

  console.log('\n========================================');
  console.log('URGENT NEWS DATABASE VERIFICATION');
  console.log('========================================\n');

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const publishedCollection = db.collection('publishednoticias');

    // Check total published news
    const totalPublished = await publishedCollection.countDocuments({ status: 'published' });
    console.log(`\n📊 Total published news: ${totalPublished}`);

    // Check urgent news
    const urgentNews = await publishedCollection.find({
      status: 'published',
      isUrgent: true
    }).toArray();

    console.log(`\n🚨 Urgent news count: ${urgentNews.length}`);

    if (urgentNews.length > 0) {
      console.log('\n📰 URGENT NEWS FOUND:');
      console.log('-----------------------------------');
      urgentNews.forEach((news, index) => {
        console.log(`\n${index + 1}. ${news.title}`);
        console.log(`   ID: ${news._id}`);
        console.log(`   Slug: ${news.slug}`);
        console.log(`   Category: ${news.category}`);
        console.log(`   isUrgent: ${news.isUrgent}`);
        console.log(`   publishedAt: ${news.publishedAt}`);
      });
    } else {
      console.log('\n⚠️  NO URGENT NEWS FOUND IN DATABASE!');
      console.log('   This means there are no documents with isUrgent: true');
      console.log('   You need to create urgent news first.');
    }

    // Check if isUrgent field exists on any documents
    const withIsUrgentField = await publishedCollection.countDocuments({
      status: 'published',
      isUrgent: { $exists: true }
    });

    const withIsUrgentTrue = await publishedCollection.countDocuments({
      status: 'published',
      isUrgent: true
    });

    const withIsUrgentFalse = await publishedCollection.countDocuments({
      status: 'published',
      isUrgent: false
    });

    console.log('\n📈 FIELD STATISTICS:');
    console.log(`   Documents with isUrgent field: ${withIsUrgentField}`);
    console.log(`   Documents with isUrgent = true: ${withIsUrgentTrue}`);
    console.log(`   Documents with isUrgent = false: ${withIsUrgentFalse}`);
    console.log(`   Documents without isUrgent field: ${totalPublished - withIsUrgentField}`);

    // Sample search to verify text index
    console.log('\n🔍 Testing text search...');
    const searchResults = await publishedCollection.find({
      status: 'published',
      $text: { $search: 'pachuca' }
    }).limit(5).toArray();

    console.log(`   Found ${searchResults.length} results for "pachuca"`);
    if (searchResults.length > 0) {
      console.log('   Sample results:');
      searchResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title.substring(0, 60)}... (isUrgent: ${result.isUrgent})`);
      });
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

verifyUrgentNews();
