const fs = require('fs');
const path = require('path');

const rootPkgPath = path.join(__dirname, '..', 'package.json');
const buildPkgPath = path.join(__dirname, '..', 'release', 'app', 'package.json');

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const buildPkg = JSON.parse(fs.readFileSync(buildPkgPath, 'utf8'));

buildPkg.version = rootPkg.version;


fs.writeFileSync(buildPkgPath, JSON.stringify(buildPkg, null, 2));

