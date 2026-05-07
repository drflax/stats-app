import { useEffect } from 'react'

export default function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  const bgColor = {
    success: 'border-l-4 border-handball-green',
    error: 'border-l-4 border-handball-red',
    info: 'border-l-4 border-handball-accent',
  }[type] || 'border-l-4 border-handball-accent'

  return (
    <div className={`fixed bottom-6 right-6 bg-handball-bg3 border border-handball-border2 rounded-lg shadow-xl p-3 text-sm max-w-xs z-50 animate-slide-up ${bgColor}`}>
      {msg}
    </div>
  )
}