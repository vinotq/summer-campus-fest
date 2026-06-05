export function emitTopUpdate(io, top) {
  io.to('dashboard').emit('top:update', { top });
}
