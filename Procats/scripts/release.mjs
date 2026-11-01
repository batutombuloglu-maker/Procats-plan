import { readFile, access, mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = JSON.parse(await readFile(path.join(root, 'publisher.json'), 'utf8'));
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const androidConfig = await readFile(path.join(root, 'android/app/build.gradle'), 'utf8');
const androidVersion = androidConfig.match(/\bversionName\s+["']([^"']+)["']/)?.[1];
if (version !== androidVersion || publisher.version !== version) {
  throw new Error('The package.json, publisher.json and Android version names must match before release.');
}
if (!publisher.displayName?.trim() || !/^\S+@\S+\.\S+$/.test(publisher.supportEmail || '')) {
  throw new Error('Fill the real publisher name and support email in publisher.json before creating a publication build.');
}

const signingVariables = ['PROCATS_KEYSTORE_FILE', 'PROCATS_KEYSTORE_PASSWORD', 'PROCATS_KEY_ALIAS', 'PROCATS_KEY_PASSWORD'];
const suppliedVariables = signingVariables.filter(name => process.env[name]);
if (suppliedVariables.length && suppliedVariables.length !== signingVariables.length) {
  throw new Error('All four PROCATS signing environment variables are required when using environment signing.');
}
if (suppliedVariables.length) {
  await access(process.env.PROCATS_KEYSTORE_FILE).catch(() => {
    throw new Error('The private upload keystore is not accessible.');
  });
} else {
  await access(path.join(root, 'signing/keystore.properties')).catch(() => {
    throw new Error('Place your private signing folder beside package.json. Do not commit it.');
  });
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw new Error(`Unable to start the required build tool: ${command}`, { cause: result.error });
  if (result.status !== 0) process.exit(result.status || 1);
}

run(process.execPath, ['scripts/build.mjs']);
run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
if (process.platform === 'win32') {
  run('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat :app:assembleRelease :app:bundleRelease :wear:assembleRelease :wear:bundleRelease --no-daemon'], path.join(root, 'android'));
} else {
  run('bash', ['gradlew', ':app:assembleRelease', ':app:bundleRelease', ':wear:assembleRelease', ':wear:bundleRelease', '--no-daemon'], path.join(root, 'android'));
}

await mkdir(path.join(root, 'artifacts'), { recursive: true });
for (const [source, name] of [
  ['apk/release/app-release.apk', 'Android.apk'],
  ['bundle/release/app-release.aab', 'PlayStore.aab'],
]) {
  await copyFile(path.join(root, 'android/app/build/outputs', source), path.join(root, 'artifacts', `Procats-${version}-${name}`));
}
for (const [source,name] of [['apk/release/wear-release.apk','WearOS.apk'],['bundle/release/wear-release.aab','WearOS-PlayStore.aab']]) {
  await copyFile(path.join(root,'android/wear/build/outputs',source),path.join(root,'artifacts',`Procats-${version}-${name}`));
}
console.log(`Created signed Procats ${version} phone and Wear OS APK/AAB files in artifacts/. Nothing was deployed.`);
