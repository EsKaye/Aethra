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

// Directory where generated ICS files live for calendar import.
const EVENTS_DIR = path.join(__dirname, 'events');
if (!fs.existsSync(EVENTS_DIR)) fs.mkdirSync(EVENTS_DIR, { recursive: true });

/**
 * Parse reminder text, schedule callback, and persist ICS event.
 * @param {string} text natural language command e.g. "remind me tomorrow at 5pm to hydrate".
 * @returns {{id: string, title: string, date: Date}|null}
 */
function scheduleReminder(text) {
  const parsed = chrono.parse(text);
  if (!parsed.length) return null;
  const date = parsed[0].start.date();
  const title = text.replace(/remind me/i, '').trim() || 'Reminder';
  const id = `reminder-${Date.now()}`;

  // Schedule a simple console log when reminder triggers.
  schedule.scheduleJob(id, date, () => {
    console.log(`🔔 Reminder triggered: ${title} @ ${date.toISOString()}`);
  });

  // Export ICS event for calendar integration.
  const { error, value } = createEvent({
    title,
    start: [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    ],
    duration: { minutes: 5 }
  });
  if (!error) {
    fs.writeFileSync(path.join(EVENTS_DIR, `${id}.ics`), value);
  }

  return { id, title, date };
}

/**
 * Transcribe audio and hand off to reminder scheduler.
 * @param {Buffer} audioBuffer raw PCM or WAV data.
 * @returns {Promise<{id: string, title: string, date: Date}|null>}
 */
async function processWhisper(audioBuffer) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set; skipping transcription.');
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey });

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
      return scheduleReminder(transcript);
    }

    return null;
  } catch (err) {
    console.error('Whisper transcription failed:', err.message);
    return null;
  }
}

module.exports = { processWhisper, scheduleReminder };

