const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'guild.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}), 'utf-8');
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : {};
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getServerMembers(discordGuildId) {
  const data = loadData();
  const guildData = data[discordGuildId] || {};
  const { _guild, ...members } = guildData;
  return members;
}

function getMember(discordGuildId, userId) {
  const members = getServerMembers(discordGuildId);
  return members[userId] || null;
}

function registerMember(discordGuildId, userId, username) {
  const data = loadData();
  if (!data[discordGuildId]) data[discordGuildId] = {};
  if (data[discordGuildId][userId]) {
    return { created: false, member: data[discordGuildId][userId] };
  }
  data[discordGuildId][userId] = {
    username,
    classId: null,
    registeredAt: new Date().toISOString(),
    rolledAt: null,
  };
  saveData(data);
  return { created: true, member: data[discordGuildId][userId] };
}

function setMemberClass(discordGuildId, userId, classId) {
  const data = loadData();
  if (!data[discordGuildId] || !data[discordGuildId][userId]) return null;
  data[discordGuildId][userId].classId = classId;
  data[discordGuildId][userId].rolledAt = new Date().toISOString();
  saveData(data);
  return data[discordGuildId][userId];
}

function addSaveCheckin(discordGuildId, userId, snapshot) {
  const data = loadData();
  if (!data[discordGuildId] || !data[discordGuildId][userId]) return null;
  const member = data[discordGuildId][userId];
  if (!Array.isArray(member.saveHistory)) member.saveHistory = [];

  const previous = member.saveHistory[member.saveHistory.length - 1] || null;
  const entry = { ...snapshot, checkedInAt: new Date().toISOString() };
  member.saveHistory.push(entry);

  let identityMismatch = false;
  if (!member.boundCharacter) {
    member.boundCharacter = { characterName: snapshot.characterName, steamId: snapshot.steamId };
  } else if (
    member.boundCharacter.steamId !== snapshot.steamId ||
    member.boundCharacter.characterName !== snapshot.characterName
  ) {
    identityMismatch = true;
  }

  saveData(data);
  return { previous, current: entry, boundCharacter: member.boundCharacter, identityMismatch };
}

function getAllCheckedInMembers(discordGuildId) {
  const members = getServerMembers(discordGuildId);
  return Object.entries(members)
    .filter(([, m]) => Array.isArray(m.saveHistory) && m.saveHistory.length > 0)
    .map(([userId, m]) => ({
      userId,
      username: m.username,
      classId: m.classId,
      boundCharacter: m.boundCharacter,
      latest: m.saveHistory[m.saveHistory.length - 1],
    }));
}

function setGuildCheckpoint(discordGuildId, expectedBosses) {
  const data = loadData();
  if (!data[discordGuildId]) data[discordGuildId] = {};
  if (!data[discordGuildId]._guild) data[discordGuildId]._guild = {};
  data[discordGuildId]._guild.checkpointBosses = expectedBosses;
  data[discordGuildId]._guild.checkpointSetAt = new Date().toISOString();
  saveData(data);
  return data[discordGuildId]._guild;
}

function getGuildCheckpoint(discordGuildId) {
  const data = loadData();
  return data[discordGuildId]?._guild?.checkpointBosses ?? null;
}

function setAllowedChannel(discordGuildId, channelId) {
  const data = loadData();
  if (!data[discordGuildId]) data[discordGuildId] = {};
  if (!data[discordGuildId]._guild) data[discordGuildId]._guild = {};
  data[discordGuildId]._guild.allowedChannelId = channelId;
  saveData(data);
  return channelId;
}

function getAllowedChannel(discordGuildId) {
  const data = loadData();
  return data[discordGuildId]?._guild?.allowedChannelId ?? null;
}

function removeMember(discordGuildId, userId) {
  const data = loadData();
  if (!data[discordGuildId] || !data[discordGuildId][userId]) return false;
  delete data[discordGuildId][userId];
  saveData(data);
  return true;
}

function startSession(discordGuildId, participants, startedBy) {
  const data = loadData();
  if (!data[discordGuildId]) data[discordGuildId] = {};
  if (!data[discordGuildId]._guild) data[discordGuildId]._guild = {};
  if (!Array.isArray(data[discordGuildId]._guild.sessions)) data[discordGuildId]._guild.sessions = [];

  const sessions = data[discordGuildId]._guild.sessions;
  const session = {
    id: sessions.length + 1,
    startedAt: new Date().toISOString(),
    startedBy,
    participants,
    targetStageId: null,
    stageChosenBy: null,
    stageChosenAt: null,
  };
  sessions.push(session);
  saveData(data);
  return session;
}

function setSessionStage(discordGuildId, sessionId, stageId, chosenBy) {
  const data = loadData();
  const sessions = data[discordGuildId]?._guild?.sessions;
  if (!sessions) return null;
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  session.targetStageId = stageId;
  session.stageChosenBy = chosenBy;
  session.stageChosenAt = new Date().toISOString();
  saveData(data);
  return session;
}

function getSessions(discordGuildId) {
  const data = loadData();
  return data[discordGuildId]?._guild?.sessions ?? [];
}

module.exports = {
  getServerMembers,
  getMember,
  registerMember,
  setMemberClass,
  addSaveCheckin,
  getAllCheckedInMembers,
  setGuildCheckpoint,
  getGuildCheckpoint,
  removeMember,
  startSession,
  setSessionStage,
  getSessions,
  setAllowedChannel,
  getAllowedChannel,
};
