/**
 * Centralized factories for constructing mocks of external services.
 * Keeping them here avoids repetition across test suites.
 */

// Mock OpenAI client returning a predetermined transcript
function mockOpenAI(transcript = '') {
  return {
    audio: {
      transcriptions: {
        create: async () => ({ text: transcript })
      }
    }
  };
}

// Stub for ICS calendar event generation
function mockCreateEvent(value = 'FAKE_ICS') {
  return () => ({ error: null, value });
}

module.exports = { mockOpenAI, mockCreateEvent };
