import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { classifyRequestUrgency } from '@/lib/ai-service';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { description, suggestedUrgency } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const urgency = await classifyRequestUrgency(description, suggestedUrgency || 'STANDARD');

    return NextResponse.json({ success: true, urgency });
  } catch (error) {
    console.error('API urgency classification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
