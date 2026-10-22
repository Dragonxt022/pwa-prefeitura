import { infoStatus } from '../lib/format'

export function Badge({ tom = 'neutro', children }) {
  return <span className={`badge badge--${tom}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const info = infoStatus(status)
  return <Badge tom={info.tom}>{info.rotulo}</Badge>
}
