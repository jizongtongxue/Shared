export function formatDateTime(isoLike: string, opts?: { dateOnly?: boolean; withSeconds?: boolean }) {
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return isoLike
  const s = d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false })
  if (opts?.dateOnly) return s.slice(0, 10)
  if (opts?.withSeconds) return s
  return s.slice(0, 16)
}

