import { NextResponse } from 'next/server';
import { readDB } from '../../../../lib/db.js';

// This route retrieves all articles from db.json

export async function GET() {
  try {
    const articles = await readDB();
    return NextResponse.json({ 
      items: articles,
      count: Array.isArray(articles) ? articles.length : 0
    });
  } catch (error) {
    console.error('Error reading articles:', error);
    return NextResponse.json({ 
      error: 'Failed to read articles',
      message: error.message 
    }, { status: 500 });
  }
}
