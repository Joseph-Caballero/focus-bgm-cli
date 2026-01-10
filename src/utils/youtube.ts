import { spawn } from 'child_process';

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

export function stripStartTimeParam(url: string): string {
  return url.replace(/[?&](?:t|start)=\d+s?$/i, '');
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

export async function getStreamURL(url: string): Promise<string> {
  return new Promise((resolve) => {
    const args = [
      url,
      '-f', 'bestaudio',
      '-g',
      '--no-check-certificates',
      '--prefer-free-formats',
      '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=android',
    ];

    const subprocess = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';

    subprocess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    subprocess.on('error', () => resolve(url));
    subprocess.on('exit', (code: number | null) => {
      if (code === 0) {
        const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (lines.length > 0) {
          resolve(lines[0]);
          return;
        }
      }
      resolve(url);
    });
  });
}

export function formatVolume(level: number): string {
  const bars = Math.floor(level / 5);
  const filled = '█'.repeat(bars);
  const empty = '░'.repeat(20 - bars);
  return `${filled}${empty}`;
}

export function formatProgress(progress: number): string {
  const bars = Math.floor(progress / 5);
  const filled = '█'.repeat(bars);
  const empty = '░'.repeat(20 - bars);
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

export function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200);
  
  return sanitized.length > 0 ? sanitized : 'audio';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
