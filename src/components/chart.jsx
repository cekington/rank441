import { useState } from 'react'
import chartData from '../usersData.json'

export default function Chart2D() {
  const { columns, users } = chartData

  const [sortKey, setSortKey] = useState('score')
  const [sortOrder, setSortOrder] = useState('desc')
  const [search, setSearch] = useState('')

  // 1. 永远只根据段位分 (score) 锁定计算固定排名
  const rankedUsers = [...users]
    .sort((a, b) => b.score - a.score)
    .map((user, idx, arr) => {
      const rank =
        idx > 0 && user.score === arr[idx - 1].score
          ? arr[idx - 1].rank
          : idx + 1
      return { ...user, rank }
    })

  // 2. 点击表头切换排序
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      // 用户名和“平均顺位”默认从小到大排（升序），其他指标默认从大到小排（降序）
      setSortOrder(key === 'name' || key === 'avgRank' ? 'asc' : 'desc')
    }
  }

  // 3. 格式化各个日麻字段的显示样式
  const formatCellValue = (key, value) => {
    if (value === undefined || value === null) return '-'
    if (key === 'avgRank') {
      return Number(value).toFixed(2) // 平均顺位保留 2 位小数，如 2.45
    }
    if (key === 'firstRate' || key === 'noFourRate') {
      return `${Number(value).toFixed(2)}%` // 一位率、避四率显示为百分比，如 25.00%
    }
    return value
  }

  // 4. 过滤并按当前选中的列排序
  const displayUsers = rankedUsers
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB
    })

  return (
    <div style={{ width: '100%' }}>
      {/* 顶部搜索框 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <input
          type="text"
          placeholder="搜索雀士 ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.95rem',
            width: '220px',
          }}
        />
      </div>

      {/* 2D 数据表格 */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            backgroundColor: '#fff',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', width: '70px', color: '#475569' }}>排名</th>
              <th
                style={{
                  padding: '14px 16px',
                  color: '#475569',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}
              >
                雀士
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortKey === col.key ? '#2563eb' : '#475569',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}{' '}
                  {sortKey === col.key ? (sortOrder === 'desc' ? '↓' : '↑') : '↕'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayUsers.map((user, index) => (
              <tr
                key={user.name}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                }}
              >
                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#64748b' }}>
                  #{user.rank}
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontWeight: '600',
                    color: sortKey === 'name' ? '#2563eb' : '#0f172a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '14px 16px',
                      color: sortKey === col.key ? '#2563eb' : '#334155',
                      fontWeight: sortKey === col.key ? '600' : 'normal',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCellValue(col.key, user[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}