import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { ChannelIndex } from '../audio/types';

export class DownloadManager {
  private channelId: ChannelIndex;
  private downloadDir: string;

  constructor(channelId: ChannelIndex) {
    this.channelId = channelId;
    this.downloadDir = this.getDownloadsDir();
    
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  async download(url: string, title: string, onProgress: (progress: number) => void): Promise<{ filePath: string; fileSize: number }> {
    const sanitizedTitle = this.sanitizeFilename(title);
    const outputPath = path.join(this.downloadDir, sanitizedTitle + '.%(ext)s');
    

    
    const args = [
      url,
      '-x', '--audio-format', 'best',
      '--no-check-certificates',
      '--prefer-free-formats',
      '-o', outputPath,
      '--no-overwrites',
      '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=android',
    ];

    const subprocess = spawn('yt-dlp', args);

    let stderrBuffer = '';

    subprocess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderrBuffer += chunk;
      if (chunk.includes('[download]') && chunk.includes('%')) {
        const progress = this.parseProgressFromStderr(chunk);
        if (progress !== null) {
          onProgress(progress);
        }
      }
    });

    subprocess.stdout?.on('data', (data) => {
      const stdoutBuffer = data.toString();
      const progress = this.parseProgressFromStderr(stdoutBuffer);
      if (progress !== null && progress > 0) {
        onProgress(progress);
      }
    });

    return new Promise((resolve, reject) => {
      let lastProgress = 0;
      let downloadedFilePath = '';
      
      const progressUpdateInterval = setInterval(() => {
        const progress = this.parseProgressFromStderr(stderrBuffer);
        if (progress !== null && progress !== lastProgress) {
          onProgress(progress);
          lastProgress = progress;
        }
      }, 500);

      subprocess.on('error', (error: Error) => {
        clearInterval(progressUpdateInterval);
        console.log(`[DownloadManager] Subprocess error: ${error.message}`);
        reject(new Error(`Download error: ${error.message}`));
      });

      subprocess.on('exit', (code: number | null, signal: any) => {
        clearInterval(progressUpdateInterval);
        
        if (code === 0) {
          try {
            const files = fs.readdirSync(this.downloadDir);
            
            const audioFiles = files.filter(f => f.startsWith(sanitizedTitle) && (f.endsWith('.webm') || f.endsWith('.mp3') || f.endsWith('.m4a')));
            
            if (audioFiles.length > 0) {
              const fullPath = path.join(this.downloadDir, audioFiles[0]);
              const stats = fs.statSync(fullPath);
              resolve({
                filePath: fullPath,
                fileSize: stats.size,
              });
            } else {
              reject(new Error('Downloaded file not found'));
            }
          } catch (error) {
            reject(new Error(`Failed to verify download: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        } else {
          const errorDetails = code === 1 
            ? 'Generic error - Try again'
            : code === 2 
              ? 'YouTube blocked download (HTTP 403) - Try again or use different video'
              : code === 3 
                ? 'File system error - Check disk space and permissions'
                : `Download failed (code: ${code})`;
          
          reject(new Error(errorDetails));
        }
      });
    });
  }

  private parseProgressFromStderr(stderr: any): number | null {
    if (!stderr) return null;
    
    const stderrStr = stderr.toString();
    
    const downloadMatch = stderrStr.match(/\[download\]\s+(\d+\.?\d*)%/);
    if (downloadMatch) {
      return parseFloat(downloadMatch[1]);
    }
    
    return null;
  }

  cancel(): void {
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }

  getDownloadsDir(): string {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.focus-bgm', 'downloads-channel-' + this.channelId);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    return configDir;
  }

  sanitizeFilename(title: string): string {
    const sanitized = title
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
    
    return sanitized.length > 0 ? sanitized : 'audio';
  }
}
