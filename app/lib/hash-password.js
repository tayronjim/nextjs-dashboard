import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      return res.status(200).json({ hash });
    } catch (error) {
      console.error('Error generating hash:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
