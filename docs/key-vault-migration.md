# Key Vault Migration Plan

Do not create Key Vault automatically while cost is a concern. Use this as a migration checklist.

## Why

Today the app can run with Container App secrets and local `.env` files. Key Vault is useful later for central secret rotation, audit logs, and safer CI/CD.

## Migration Steps

1. Create one Key Vault manually only after budget alerts are enabled.
2. Add secrets:
   - `MONGO-URI`
   - `JWT-SECRET`
   - `PAYOS-CLIENT-ID`
   - `PAYOS-API-KEY`
   - `PAYOS-CHECKSUM-KEY`
   - `R2-ENDPOINT`
   - `R2-ACCESS-KEY`
   - `R2-SECRET-KEY`
   - `R2-PUBLIC-URL`
3. Give the Container App managed identity `Key Vault Secrets User`.
4. Replace Container App secrets with Key Vault references.
5. Rotate the MongoDB Atlas password and update only Key Vault.

## Local Development

Keep local `.env` for development. Never commit `.env`.
