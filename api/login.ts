type Battalion = '2 Raj' | '10 Raj';

const ANO_ACCOUNTS: Record<string, { full_name: string; battalion: Battalion; password: string }> = {
  '2raj': {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  ano2raj: {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  '2 raj': {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  admin: {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  '10raj': {
    full_name: 'Lt. DS Chouhan',
    battalion: '10 Raj',
    password: 'admin123',
  },
  ano10raj: {
    full_name: 'Lt. DS Chouhan',
    battalion: '10 Raj',
    password: 'admin123',
  },
  '10 raj': {
    full_name: 'Lt. DS Chouhan',
    battalion: '10 Raj',
    password: 'admin123',
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }

  const rawUser = String(body?.username ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const selectedBattalion = body?.battalion as Battalion | undefined;

  const account = ANO_ACCOUNTS[rawUser];
  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (
    selectedBattalion &&
    (selectedBattalion === '2 Raj' || selectedBattalion === '10 Raj') &&
    account.battalion !== selectedBattalion
  ) {
    return res.status(403).json({
      error: `This ANO login belongs to ${account.battalion} Bn NCC. Please select ${account.battalion} to sign in.`,
    });
  }

  return res.status(200).json({
    authenticated: true,
    admin: {
      username: rawUser,
      full_name: account.full_name,
      battalion: account.battalion,
    },
  });
}
