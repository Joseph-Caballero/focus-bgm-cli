export function isValidYouTubeURL(url: string): boolean {
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

export function extractVideoID(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function getVideoTitle(url: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
      return 'Unknown Title';
    }
    const data = await response.json() as { title?: string };
    return data.title || 'Unknown Title';
  } catch (error) {
    return 'Unknown Title';
  }
}

export function formatVolume(level: number): string {
  const bars = Math.floor(level / 10);
  const filled = '█'.repeat(bars);
  const empty = '░'.repeat(10 - bars);
  return `${filled}${empty}`;
}

export function truncateURL(url: string | null, maxLength: number = 50): string {
  if (!url) return '(empty)';
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

export function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
