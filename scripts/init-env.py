"""Generate ignored local credentials. Never overwrite an existing .env."""
from pathlib import Path
import secrets
p = Path('.env')
if p.exists():
    raise SystemExit('.env już istnieje; nie nadpisano.')
s = Path('.env.example').read_text()
values = {name: secrets.token_hex(24) for name in ['POSTGRES_PASSWORD','JWT_SECRET','INSIGHTS_KEY','SEED_ADMIN_PASSWORD','MYSQL_ROOT_PASSWORD','MYSQL_PASSWORD','WP_ADMIN_PASSWORD']}
values['DATABASE_URL'] = f"postgresql://nordhaus:{values['POSTGRES_PASSWORD']}@localhost:5432/nordhaus?schema=public"
for name, value in values.items():
    s = s.replace(f'{name}=\n', f'{name}={value}\n')
p.write_text(s)
p.chmod(0o600)
print('Utworzono .env z losowymi hasłami. Hasło administratora: pole SEED_ADMIN_PASSWORD w .env.')
