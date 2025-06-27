import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabaseClient";



export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Bus')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching buses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error, data: bus } = await supabase
      .from('Bus')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating bus:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(bus);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...update } = body;

    const { error, data: bus } = await supabase
      .from('Bus')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bus:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(bus);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const { error } = await supabase
      .from('Bus')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bus:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
