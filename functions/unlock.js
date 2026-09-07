const encoder = new TextEncoder();
const redirectUrl = 'https://yeezy.com';

async function digest(value) {
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoder.encode(value))
  );
}

function equalBytes(left, right) {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] || 0) ^ (right[index] || 0);
  }

  return difference === 0;
}

export async function onRequestPost(context) {
  const password = (await context.request.formData()).get('password');
  const configuredPassword = context.env.DND_ACCESS_PASSWORD;

  if (typeof configuredPassword !== 'string' || !configuredPassword) {
    return Response.json(
      { message: 'Password access is not configured.' },
      { status: 500 }
    );
  }

  const [submittedDigest, configuredDigest] = await Promise.all([
    digest(typeof password === 'string' ? password : ''),
    digest(configuredPassword),
  ]);

  if (!equalBytes(submittedDigest, configuredDigest)) {
    return Response.json({ message: 'Incorrect password.' }, { status: 401 });
  }

  return Response.json({ redirectUrl });
}
