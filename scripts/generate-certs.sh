#!/bin/bash

# Generate Self-Signed SSL Certificates for Development
# This creates localhost certificates for testing HTTPS

CERT_DIR="examples/certs"
mkdir -p "$CERT_DIR"

echo "🔐 Generating self-signed SSL certificates for localhost..."

openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' \
  -keyout "$CERT_DIR/localhost-key.pem" \
  -out "$CERT_DIR/localhost-cert.pem" \
  -days 365

if [ $? -eq 0 ]; then
  echo "✅ Certificates generated successfully!"
  echo "   Key:  $CERT_DIR/localhost-key.pem"
  echo "   Cert: $CERT_DIR/localhost-cert.pem"
  echo ""
  echo "⚠️  Note: These are self-signed certificates for development only."
  echo "   Browsers will show a security warning - this is normal."
  echo ""
  echo "🚀 You can now run the HTTPS example:"
  echo "   node examples/https-server.js"
else
  echo "❌ Failed to generate certificates"
  exit 1
fi
