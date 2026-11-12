import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_PATH = path.join(__dirname, 'src', 'usersData.json')

const PT_LIST = [30, 10, -10, -30]

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = (question) => new Promise((resolve) => rl.question(question, resolve))

async function main() {
  console.log('\n🀄 Rank 441 · 四麻战绩自动结算录入工具（支持同分平分顺位点）\n')

  if (!fs.existsSync(DATA_PATH)) {
    console.error('❌ 找不到数据文件:', DATA_PATH)
    process.exit(1)
  }

  const rawContent = fs.readFileSync(DATA_PATH, 'utf-8')
  const data = JSON.parse(rawContent)

  console.log('当前已有雀士:', data.users.map((u) => u.name).join(', ') || '暂无')
  console.log('请依次输入本局 4 位雀士的 ID 和终局点数（顺序随意）：\n')

  const rawEntries = []

  for (let i = 0; i < 4; i++) {
    const name = (await ask(`👉 玩家 ${i + 1} 雀士 ID: `)).trim()
    if (!name) {
      console.log('❌ 雀士 ID 不能为空，已退出。')
      rl.close()
      return
    }

    const gameScore = Number(await ask('   终局点数 (如 32500): '))
    if (isNaN(gameScore)) {
      console.log('❌ 点数必须是数字，已退出。')
      rl.close()
      return
    }

    rawEntries.push({ name, gameScore })
  }
  // 按点数从高到低排序并计算同分平分顺位与段位分
  const sorted = [...rawEntries].sort((a, b) => b.gameScore - a.gameScore)
  const rankedEntries = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1].gameScore === sorted[i].gameScore) j++

    const tieCount = j - i + 1
    let sumPt = 0, sumRank = 0
    for (let k = i; k <= j; k++) {
      sumPt += PT_LIST[k]
      sumRank += k + 1
    }

    const avgUma = sumPt / tieCount
    const avgRank = Number((sumRank / tieCount).toFixed(2))
    const isFirst = i === 0 && tieCount < 4 ? Number((1 / tieCount).toFixed(4)) : 0
    const isNoFour = j < 3 ? 1 : tieCount === 4 ? 0.75 : Number(((tieCount - 1) / tieCount).toFixed(4))

    for (let k = i; k <= j; k++) {
      // 核心公式：(终局点数 - 25000) / 1000 + 顺位分
      const basePt = (sorted[k].gameScore - 25000) / 1000
      const totalPtDelta = Number((basePt + avgUma).toFixed(2))

      rankedEntries.push({
        ...sorted[k],
        rank: avgRank,
        ptDelta: totalPtDelta,
        isFirst,
        isNoFour,
      })
    }
    i = j + 1
  }
  // 核对总点数并展示结果
  const totalPoints = rankedEntries.reduce((sum, item) => sum + item.gameScore, 0)
  console.log('\n📋 自动结算结果核对（同分已自动平分）：')
  if (totalPoints !== 100000) {
    console.log(`⚠️  注意：四人总点数为 ${totalPoints}（标准四麻为 100000）`)
  }

  rankedEntries.forEach((e) => {
    const ptStr = e.ptDelta >= 0 ? `+${e.ptDelta}` : `${e.ptDelta}`
    console.log(`   第 ${e.rank} 位: ${e.name} | 点数: ${e.gameScore} | 段位分: ${ptStr}`)
  })

  const confirm = (await ask('\n确认写入数据文件？(y/n): ')).trim().toLowerCase()
  if (confirm !== 'y') {
    console.log('已取消写入。')
    rl.close()
    return
  }

  // 更新每位玩家的累计战绩
  rankedEntries.forEach((entry) => {
    const idx = data.users.findIndex((u) => u.name.toLowerCase() === entry.name.toLowerCase())

    if (idx > -1) {
      const u = data.users[idx]
      const oldCount = Number(u.count) || 0
      const newCount = oldCount + 1

      data.users[idx] = {
        ...u,
        score: Number(((Number(u.score) || 0) + entry.ptDelta).toFixed(2)),
        count: newCount,
        avgRank: Number((((Number(u.avgRank) || 0) * oldCount + entry.rank) / newCount).toFixed(2)),
        firstRate: Number(((((Number(u.firstRate) || 0) / 100) * oldCount + entry.isFirst) / newCount * 100).toFixed(2)),
        noFourRate: Number(((((Number(u.noFourRate) || 0) / 100) * oldCount + entry.isNoFour) / newCount * 100).toFixed(2)),
      }
    } else {
      data.users.push({
        name: entry.name,
        score: entry.ptDelta,
        count: 1,
        avgRank: entry.rank,
        firstRate: Number((entry.isFirst * 100).toFixed(2)),
        noFourRate: Number((entry.isNoFour * 100).toFixed(2)),
      })
    }
  })

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log('\n✅ 成功更新 src/data/usersData.json！')

  const deploy = (await ask('是否立即发布更新到 GitHub Pages？(y/n): ')).trim().toLowerCase()
  if (deploy === 'y') {
    console.log('\n🚀 正在执行 npm run deploy...\n')
    try {
      execSync('npm run deploy', { stdio: 'inherit' })
      console.log('\n🎉 线上排行榜已成功更新！')
    } catch {
      console.error('\n❌ 自动部署失败，请手动在终端运行 npm run deploy')
    }
  }

  rl.close()
}

main()