import prisma from './prisma'

export async function generateGardenReminders(gardenId: number) {
  try {
    // 1. Gather Context for this specific garden
    const crops = await prisma.crop.findMany({ where: { gardenId } })
    const lastCheckIn = await prisma.checkIn.findFirst({ 
      where: { gardenId },
      orderBy: { createdAt: 'desc' }
    })
    const reminders = await prisma.reminder.findMany({ 
      where: { gardenId, isDone: false } 
    })

    const context = {
      crops: crops.map((c) => c.name).join(', '),
      lastWatered: lastCheckIn ? lastCheckIn.createdAt : 'Never',
      existingReminders: reminders.map((r) => r.content).join(', ')
    }

    // 2. Call DeepSeek API
    let suggestions: string[] = []
    
    if (process.env.DEEPSEEK_API_KEY) {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are an expert gardener assistant. Based on this specific garden's crops and watering history, generate 1-3 urgent short tasks in Chinese. Return only the tasks separated by newlines."
            },
            {
              role: "user",
              content: `Crops: ${context.crops}. Last Watered: ${context.lastWatered}. Existing Tasks: ${context.existingReminders}.`
            }
          ]
        })
      })
      const data = await response.json()
      if (data.choices && data.choices[0]) {
        suggestions = data.choices[0].message.content.split('\n').filter((s: string) => s.trim().length > 0)
      }
    } else {
      suggestions = [`检查${crops[0]?.name || '作物'}的土壤`, '清理杂草']
    }

    // 3. Save reminders for this garden
    const firstUser = await prisma.user.findFirst({ where: { gardenId } })
    if (!firstUser) return []

    const createdReminders = []
    for (const suggestion of suggestions) {
      const cleanSuggestion = suggestion.replace(/^- /, '').trim()
      const isDuplicate = reminders.some((r) => r.content === cleanSuggestion)
      
      if (!isDuplicate) {
        const r = await prisma.reminder.create({
          data: {
            content: cleanSuggestion,
            userId: firstUser.id,
            gardenId
          }
        })
        createdReminders.push(r)
      }
    }

    return createdReminders
  } catch (error) {
    console.error(`Error for garden ${gardenId}:`, error)
    return []
  }
}

export async function runDailyJob() {
  console.log('Running daily AI analysis for all gardens...')
  try {
    const gardens = await prisma.garden.findMany()
    for (const garden of gardens) {
      await generateGardenReminders(garden.id)
    }
    console.log('Daily job completed.')
  } catch (error) {
    console.error('Daily job failed:', error)
  }
}
