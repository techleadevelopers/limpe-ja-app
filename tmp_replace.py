from pathlib import Path
path = Path('components/client/explore/home/RecomendacaoCard.tsx')
text = path.read_text(encoding='utf-8')
old = "    const diffDays = Math.round((nextStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));\n    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SA!b'];\n    let dayLabel: string;\n    if (diffDays === 0) dayLabel = 'Hoje';\n    else if (diffDays === 1) dayLabel = 'AmanhAL';\n    else dayLabel = days[nextDate.getDay()] || '???';\n"
new = "    const diffDays = Math.round((nextStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));\n    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];\n    const dayLabel = days[nextDate.getDay()] || 'Dia';\n"
if old not in text:
    raise SystemExit('pattern not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
