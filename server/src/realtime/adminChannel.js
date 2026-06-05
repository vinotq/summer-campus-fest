// Emitters for the admin room — called from sessionFlow and routes.
// io is injected via setIo in sessionFlow; these helpers are direct wrappers for clarity.
// All payloads match 05-realtime.md contracts.

export function emitPlayersNew(io, sessionData) {
  io.to('admin').emit('players:new', { session: sessionData });
}

export function emitPlayersUpdate(io, data) {
  io.to('admin').emit('players:update', data);
}

export function emitPlayersFinished(io, data) {
  io.to('admin').emit('players:finished', data);
}

export function emitPlayersVisibility(io, sessionId, hiddenFromDashboard) {
  io.to('admin').emit('players:visibility', { sessionId, hiddenFromDashboard });
}

export function emitQuestionsChanged(io, kind, questionId) {
  io.to('admin').emit('questions:changed', { kind, questionId });
}

export function emitPlayersSnapshot(socket, sessions) {
  socket.emit('players:snapshot', { sessions });
}
