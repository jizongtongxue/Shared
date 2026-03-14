import prisma from './prisma'

export async function generateGlobalReminders() {
  try {
    // 1. Gather Context (Global)
    const crops = await prisma.crop.findMany()
    const lastCheckIn = await prisma.checkIn.findFirst({ 
      orderBy: { createdAt: 'desc' }
    })
    const reminders = await prisma.reminder.findMany({ 
      where: { isDone: false } 
    })

    const context = {
      crops: crops.map((c) => c.name).join(', '),
      lastWatered: lastCheckIn ? lastCheckIn.createdAt : 'Never',
      existingReminders: reminders.map((r) => r.content).join(', ')
    }

    // 2. Call DeepSeek API (Simulated if no key)
    let suggestions: string[] = []
    
    if (process.env.DEEPSEEK_API_KEY) {
      // Real API Call Implementation
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
              content: "You are an expert gardener assistant. Based on the shared garden's crops and watering history, generate 1-3 urgent short tasks/reminders in Chinese. Return only the tasks separated by newlines. No other text."
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
      // Mock Response for Demo
      suggestions = [
        `检查${context.crops.split(',')[0] || '作物'}的土壤湿度`,
        '清理周边的杂草',
        '如果天气干燥，请额外浇水'
      ]
    }

    // 3. Save new reminders (Global)
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) return []

    const createdReminders = []
    for (const suggestion of suggestions) {
      const cleanSuggestion = suggestion.replace(/^- /, '').trim()
      const isDuplicate = reminders.some((r) => r.content === cleanSuggestion)
      
      if (!isDuplicate) {
        const r = await prisma.reminder.create({
          data: {
            content: cleanSuggestion,
            userId: firstUser.id // Link to first user as a placeholder for global
          }
        })
        createdReminders.push(r)
      }
    }

    return createdReminders
  } catch (error) {
    console.error(`Error generating global reminders:`, error)
    return []
  }
}

export async function runDailyJob() {
  console.log('Running daily global AI analysis job...')
  try {
    await generateGlobalReminders()
    console.log('Daily global job completed.')
  } catch (error) {
    console.error('Daily global job failed:', error)
  }
}
