import crypto from 'crypto';

function generateRequestId() {
  return crypto.randomUUID();
}

export { generateRequestId }