// Maps a fear category id to the short, natural-language phrase used to make
// otherwise-generic questions topic-specific — e.g. turning "How anxious do
// you feel right now?" into "How anxious do you feel right now about public
// speaking?", or filling in the "{topic}" placeholder inside a GAD-7 item's
// text. Falls back to the category's own display name (lowercased) for any
// category not listed here, so a researcher-added category still works
// without needing a code change.
const FEAR_TOPIC_PHRASES = {
  spiders: 'spiders',
  heights: 'heights or roller coasters',
  dogs: 'dogs',
  public_speaking: 'public speaking',
  flying: 'flying',
  college_admissions: 'applying for a job',
  test_anxiety: 'taking tests',
};

export function getFearTopicPhrase(categoryId, categoryName) {
  if (categoryId && FEAR_TOPIC_PHRASES[categoryId]) return FEAR_TOPIC_PHRASES[categoryId];
  if (categoryName) return categoryName.toLowerCase();
  return 'this fear';
}

// Replaces every "{topic}" placeholder in a string with the resolved topic
// phrase — used for GAD-7 item text, which is stored with the placeholder
// still in it (see server/src/db/index.js).
export function fillTopicPlaceholder(text, categoryId, categoryName) {
  const topic = getFearTopicPhrase(categoryId, categoryName);
  return (text || '').split('{topic}').join(topic);
}
