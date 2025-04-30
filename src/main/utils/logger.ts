import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const logFile = path.join(app.getPath('userData'), 'app.log');

export function log(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}
