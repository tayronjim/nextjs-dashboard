import bcrypt from 'bcrypt';

export async function POST(req) {
  const { password } = await req.json();

  if (!password) {
    return new Response(JSON.stringify({ error: 'Password is required' }), { status: 400 });
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    return new Response(JSON.stringify({ hash }), { status: 200 });
  } catch (error) {
    console.error('Error generating hash:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
