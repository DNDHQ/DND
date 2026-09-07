const form = document.querySelector('.access-form');
const message = document.querySelector('.access-message');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  const password = form.elements.password;

  button.disabled = true;
  message.textContent = '';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    const result = await response.json();

    if (response.ok) {
      window.location.assign(result.redirectUrl);
      return;
    }

    message.textContent = result.message || 'Unable to verify the password.';
    password.select();
  } catch {
    message.textContent = 'Unable to connect. Please try again.';
  } finally {
    button.disabled = false;
  }
});
