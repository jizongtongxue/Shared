import { runDailyJob } from './lib/ai-scheduler'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron')
    
    console.log('Registering daily cron job...')
    
    // Schedule task to run at 8:00 AM every day (Asia/Shanghai time)
    // Format: Minute Hour DayMonth Month DayWeek
    cron.schedule('0 8 * * *', async () => {
      console.log('Triggering daily AI analysis...')
      await runDailyJob()
    }, {
      timezone: "Asia/Shanghai"
    })
    
    console.log('Daily cron job scheduled for 08:00 AM (Asia/Shanghai).')
  }
}
