/// Last-write-wins conflict resolution.
///
/// Returns `true` if the remote record should replace the local one.
/// Server wins ties (remote >= local).
bool shouldAcceptRemote(DateTime localModified, DateTime remoteModified) {
  return !remoteModified.isBefore(localModified);
}
