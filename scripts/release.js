const standardVersion = require('standard-version');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// args: --patch, --minor, --major
const args = process.argv.slice(2);
let releaseAs = null;

if (args.includes('--minor')) releaseAs = 'minor';
else if (args.includes('--major')) releaseAs = 'major';
else if (args.includes('--patch')) releaseAs = 'patch';

(async () => {
  await standardVersion({
    noVerify: true,
    infile: 'CHANGELOG.md',
    releaseAs,
  });

  const rootPkgPath = path.join(__dirname, '..', 'package.json');
  const buildPkgPath = path.join(__dirname, '..', 'release', 'app', 'package.json');

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  const buildPkg = JSON.parse(fs.readFileSync(buildPkgPath, 'utf8'));
  buildPkg.version = rootPkg.version;
  fs.writeFileSync(buildPkgPath, JSON.stringify(buildPkg, null, 2));

  execSync('git add release/app/package.json');
  execSync('git commit --amend --no-edit');

  console.log(`✅ version ${rootPkg.version} successgfully`);
})();
