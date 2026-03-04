import { NextResponse } from 'next/server';
import { readDB, writeDB } from '../../../../lib/db.js';
import { getEmbedding } from '../../../../lib/embeddings.js';

// This route generates embeddings for articles that don't have them yet
// It reads articles from db.json, generates embeddings, and saves them back

async function generateArticleEmbedding(content) {
  try {
    const embedding = await getEmbedding(content);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export async function POST() {
  try {
    // Step 1: Read all articles from db.json
    const articles = await readDB();
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ 
        message: 'No articles to enrich',
        enrichedCount: 0,
        totalArticles: 0
      });
    }

    // Step 2: Filter articles without embeddings
    const articlesToEnrich = articles.filter(article => !article.embedding);
    
    if (articlesToEnrich.length === 0) {
      return NextResponse.json({ 
        message: 'All articles already have embeddings',
        enrichedCount: 0,
        totalArticles: articles.length
      });
    }

    // Step 3: Generate embeddings for articles missing them
    let enrichedCount = 0;
    for (const article of articlesToEnrich) {
      // Step 3a: Prepare text for embedding (title + description + content)
      const textToEmbed = [
        article.title,
        article.description,
        article.content?.full_text || article.content || ''
      ].filter(Boolean).join('\n\n');

      // Step 3b: Generate embedding via Gemini API
      const embedding = await generateArticleEmbedding(textToEmbed);
      
      if (embedding) {
        article.embedding = embedding;
        enrichedCount++;
        console.log(`Generated embedding for: ${article.title || article.id}`);
      }
    }

    // Step 4: Save updated articles with embeddings back to db.json
    await writeDB(articles);

    return NextResponse.json({ 
      message: `Successfully generated embeddings for ${enrichedCount} articles`,
      enrichedCount,
      totalArticles: articles.length,
      skipped: articlesToEnrich.length - enrichedCount
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate embeddings',
      message: error.message 
    }, { status: 500 });
  }
}
