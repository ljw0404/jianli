import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function loadEnv(path = '.env') {
  if (!existsSync(path)) throw new Error(`Missing ${path}. Copy .env.example to .env first.`);
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnv();
const env = process.env;
const required = ['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_KEY_PATH', 'DEPLOY_DIR', 'DEPLOY_APP_PORT', 'CERTBOARD_URL', 'CERTBOARD_TOKEN', 'CERTBOARD_DOMAIN_ID', 'CERTBOARD_SUBDOMAIN'];
for (const name of required) if (!env[name]) throw new Error(`Missing ${name} in .env`);

const sshPort = env.DEPLOY_SSH_PORT || '22';
const target = `${env.DEPLOY_USER}@${env.DEPLOY_HOST}`;
const sshArgs = ['-i', env.DEPLOY_KEY_PATH, '-p', sshPort, target];
function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

console.log('Building project...');
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);

console.log(`Uploading project to ${target}:${env.DEPLOY_DIR}...`);
run('ssh', [...sshArgs, `mkdir -p '${env.DEPLOY_DIR}'`]);
run('scp', ['-i', env.DEPLOY_KEY_PATH, '-P', sshPort, '-r', 'src', 'data.json', 'package.json', 'package-lock.json', 'index.html', 'favicon.svg', `${target}:${env.DEPLOY_DIR}/`]);

const remote = [
  `cd '${env.DEPLOY_DIR}'`,
  'npm ci',
  'npm run build',
  `pm2 delete jianli 2>/dev/null || true`,
  `pm2 serve '${env.DEPLOY_DIR}/dist' ${env.DEPLOY_APP_PORT} --name jianli --spa`,
  'pm2 save',
  `curl -fsS http://127.0.0.1:${env.DEPLOY_APP_PORT}/ >/dev/null`,
].join(' && ');
run('ssh', [...sshArgs, remote]);

const apiRoot = env.CERTBOARD_URL.replace(/\/$/, '');
const headers = { Authorization: `Bearer ${env.CERTBOARD_TOKEN}` };
const listResponse = await fetch(`${apiRoot}/api/domains/${env.CERTBOARD_DOMAIN_ID}/subdomains`, { headers });
if (!listResponse.ok) throw new Error(`CertBoard list failed: HTTP ${listResponse.status}`);
const subdomains = await listResponse.json();
const existing = subdomains.find((item) => item.subdomain === env.CERTBOARD_SUBDOMAIN);
if (existing) {
  if (String(existing.port) !== String(env.DEPLOY_APP_PORT)) {
    throw new Error(`Subdomain ${env.CERTBOARD_SUBDOMAIN} already exists on port ${existing.port}; update it in the panel first.`);
  }
  console.log(`Subdomain ${existing.fullDomain} already exists on port ${existing.port}.`);
} else {
  const response = await fetch(`${apiRoot}/api/domains/${env.CERTBOARD_DOMAIN_ID}/subdomains`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subdomain: env.CERTBOARD_SUBDOMAIN, port: Number(env.DEPLOY_APP_PORT) }),
  });
  if (!response.ok) throw new Error(`CertBoard create failed: HTTP ${response.status} ${await response.text()}`);
  console.log(`Created ${env.CERTBOARD_SUBDOMAIN} on port ${env.DEPLOY_APP_PORT}.`);
}

console.log('Deployment complete.');
