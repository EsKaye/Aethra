/**
 * Voice Note Module
 * Transcribes audio via OpenAI Whisper, parses natural-language reminders,
 * schedules them, and exports calendar events so the Solar Khan never forgets.
 */

const OpenAI = require('openai');
const { Readable } = require('stream');
const chrono = require('chrono-node');
const schedule = require('node-schedule');
const { createEvent } = require('ics');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Directory where generated ICS files live for calendar import.
const EVENTS_DIR = path.join(__dirname, 'events');
if (!fs.existsSync(EVENTS_DIR)) fs.mkdirSync(EVENTS_DIR, { recursive: true });

/**
 * Parse reminder text, schedule callback, and persist ICS event.
 * Allows a time multiplier so long-term reminders can be simulated quickly
 * during tests or demos. Multiplier can be set via CLI (--time-multiplier),
 * config file, or SCHEDULER_TIME_MULTIPLIER env var.
 *
 * @param {string} text natural language command e.g. "remind me tomorrow at 5pm to hydrate".
 * @param {{createEvent?: Function, timeMultiplier?: number}} [opts]
 * @returns {{id: string, title: string, date: Date}|null}
 */
function scheduleReminder(text, opts = {}) {
  const parsed = chrono.parse(text);
  if (!parsed.length) return null;

  const originalDate = parsed[0].start.date();
  const title = text.replace(/remind me/i, '').trim() || 'Reminder';
  const id = `reminder-${Date.now()}`;

  // Collapse long delays so tests don't wait eons.
  const multiplier = Number(opts.timeMultiplier ?? config.timeMultiplier) || 1;
  const now = Date.now();
  const scheduledDate =
    multiplier > 1
      ? new Date(now + (originalDate.getTime() - now) / multiplier)
      : originalDate;

  // Schedule a simple console log when the reminder triggers.
  schedule.scheduleJob(id, scheduledDate, () => {
    console.log(`🔔 Reminder triggered: ${title} @ ${scheduledDate.toISOString()}`);
  });

  // Export ICS event for calendar integration.
  const create = opts.createEvent || createEvent;
  const { error, value } = create({
    title,
    start: [
      scheduledDate.getFullYear(),
      scheduledDate.getMonth() + 1,
      scheduledDate.getDate(),
      scheduledDate.getHours(),
      scheduledDate.getMinutes()
    ],
    duration: { minutes: 5 }
  });
  if (!error) {
    fs.writeFileSync(path.join(EVENTS_DIR, `${id}.ics`), value);
  }

  return { id, title, date: scheduledDate };
}

/**
 * Transcribe audio and hand off to reminder scheduler.
 * @param {Buffer} audioBuffer raw PCM or WAV data.
 * @returns {Promise<{id: string, title: string, date: Date}|null>}
 */
async function processWhisper(audioBuffer, deps = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !deps.openAIClient) {
    console.warn('OPENAI_API_KEY not set; skipping transcription.');
    return null;
  }

  try {
    const openai = deps.openAIClient || new OpenAI({ apiKey });
    const scheduleFn = deps.scheduleReminder || scheduleReminder;

    // Wrap buffer in Readable stream; OpenAI expects a stream with a path.
    const stream = Readable.from(audioBuffer);
    stream.path = 'whisper.wav';

    const result = await openai.audio.transcriptions.create({
      file: stream,
      model: 'whisper-1'
    });

    const transcript = result.text || '';
    console.log('📝 Whisper transcribed:', transcript);

    if (transcript.toLowerCase().includes('remind me')) {
      return scheduleFn(transcript, deps);
    }

    return null;
  } catch (err) {
    console.error('Whisper transcription failed:', err.message);
    return null;
  }
}

module.exports = { processWhisper, scheduleReminder };

