const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg'];

function listAudioFiles() {
  if (!fs.existsSync(AUDIO_DIR)) return [];
  return fs
    .readdirSync(AUDIO_DIR)
    .filter((file) => AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()));
}

function findAudioFile(baseName) {
  for (const ext of AUDIO_EXTENSIONS) {
    const filePath = path.join(AUDIO_DIR, baseName + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function getAudioPath(fileName) {
  const filePath = path.join(AUDIO_DIR, fileName);
  if (!filePath.startsWith(AUDIO_DIR)) return null; // evita path traversal
  return fs.existsSync(filePath) ? filePath : null;
}

module.exports = { AUDIO_DIR, listAudioFiles, findAudioFile, getAudioPath };
