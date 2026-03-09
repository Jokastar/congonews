import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { getEmbedding } from '../../../../lib/embeddings.js';

async function generateEmbedding(content) {
  try {
    return await getEmbedding(content);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export async function POST() {
  try {
    // Step 1: Fetch records without embeddings from both tables
    const [{ data: articleRows, error: e1 }, { data: tweetRows, error: e2 }] = await Promise.all([
      supabase.from('articles').select('*').is('embedding', null),
      supabase.from('tweets').select('*').is('embedding', null),
    ]);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);

    const allWithout = [
      ...(articleRows ?? []).map(r => ({ ...r, _table: 'articles' })),
      ...(tweetRows ?? []).map(r => ({ ...r, _table: 'tweets' })),
    ];

    if (allWithout.length === 0) {
      return NextResponse.json({ message: 'All records already have embeddings', enrichedCount: 0 });
    }

    // Step 2: Generate and save embeddings one by one
    let enrichedCount = 0;
    for (const record of allWithout) {
      const { _table, ...row } = record;
      const textToEmbed = [
        row.title,
        row.description,
        row.content?.full_text || row.content || ''
      ].filter(Boolean).join('\n\n');

      const embedding = await generateEmbedding(textToEmbed);
      if (!embedding) continue;

      const { error: updateError } = await supabase
        .from(_table)
        .update({ embedding })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update embedding for ${row.id}:`, updateError.message);
        continue;
      }

      enrichedCount++;
      console.log(`Generated embedding for: ${row.title || row.id}`);
    }

    return NextResponse.json({
      message: `Successfully generated embeddings for ${enrichedCount} records`,
      enrichedCount,
      totalWithout: allWithout.length,
      skipped: allWithout.length - enrichedCount,
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate embeddings',
      message: error.message
    }, { status: 500 });
  }
}
