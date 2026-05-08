import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
    Vimeo: any;
    __tagthrPlayer?: {
      play: () => void;
      pause: () => void;
      seekTo: (seconds: number) => void;
    };
  }
}

interface VideoPlayerProps {
  url: string;
  onStateChange?: (state: { playing: boolean; time: number }) => void;
  onSeek?: (time: number) => void;
  isHost?: boolean;
  onVolumeChange?: (volume: number) => void;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => Promise<number>;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ url, onStateChange, onSeek, isHost = false, onVolumeChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const platformRef = useRef<'youtube' | 'vimeo' | 'direct' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const lastSeekTimeRef = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (platformRef.current === 'youtube' && playerRef.current?.playVideo) {
          playerRef.current.playVideo();
        } else if (platformRef.current === 'vimeo' && playerRef.current?.play) {
          playerRef.current.play();
        } else if (platformRef.current === 'direct') {
          const video = containerRef.current?.querySelector('video');
          video?.play();
        }
      },
      pause: () => {
        if (platformRef.current === 'youtube' && playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        } else if (platformRef.current === 'vimeo' && playerRef.current?.pause) {
          playerRef.current.pause();
        } else if (platformRef.current === 'direct') {
          const video = containerRef.current?.querySelector('video');
          video?.pause();
        }
      },
      seekTo: (seconds: number) => {
        if (platformRef.current === 'youtube' && playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, true);
        } else if (platformRef.current === 'vimeo' && playerRef.current?.setCurrentTime) {
          playerRef.current.setCurrentTime(seconds);
        } else if (platformRef.current === 'direct') {
          const video = containerRef.current?.querySelector('video') as HTMLVideoElement;
          if (video) video.currentTime = seconds;
        }
      },
      getCurrentTime: async () => {
        if (platformRef.current === 'youtube' && playerRef.current?.getCurrentTime) {
          return playerRef.current.getCurrentTime();
        } else if (platformRef.current === 'vimeo' && playerRef.current?.getCurrentTime) {
          return await playerRef.current.getCurrentTime();
        } else if (platformRef.current === 'direct') {
          const video = containerRef.current?.querySelector('video') as HTMLVideoElement;
          return video?.currentTime || 0;
        }
        return 0;
      }
    }));

    useEffect(() => {
      if (!containerRef.current || !url) return;

      setError(null);
      const platform = detectPlatform(url);
      platformRef.current = platform;

      if (platform === 'youtube') {
        loadYouTubeAPI(() => initYouTube(url));
      } else if (platform === 'vimeo') {
        loadVimeoAPI(() => initVimeo(url));
      } else {
        setError('Unsupported video platform. Please use YouTube or Vimeo.');
      }

      return () => {
        if (playerRef.current) {
          try {
            if (platformRef.current === 'youtube' && playerRef.current.destroy) {
              playerRef.current.destroy();
            } else if (platformRef.current === 'vimeo' && playerRef.current.destroy) {
              playerRef.current.destroy();
            }
          } catch (e) {
            console.error('Error destroying player:', e);
          }
          playerRef.current = null;
        }
      };
    }, [url]);

    // Expose controls globally for real-time sync
    useEffect(() => {
      if (!playerRef.current) return;

      window.__tagthrPlayer = {
        play: () => {
          if (playerRef.current?.playVideo) playerRef.current.playVideo();
          else if (playerRef.current?.play) playerRef.current.play();
        },
        pause: () => {
          if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
          else if (playerRef.current?.pause) playerRef.current.pause();
        },
        seekTo: (seconds: number) => {
          if (playerRef.current?.seekTo) playerRef.current.seekTo(seconds, true);
          else if (playerRef.current?.setCurrentTime) playerRef.current.setCurrentTime(seconds);
        }
      };

      return () => {
        delete window.__tagthrPlayer;
      };
    }, [playerRef.current]);

    const detectPlatform = (url: string): 'youtube' | 'vimeo' | 'direct' => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      if (url.includes('vimeo.com')) return 'vimeo';
      return 'direct';
    };

    const loadYouTubeAPI = (callback: () => void) => {
      if (window.YT && window.YT.Player) {
        callback();
        return;
      }

      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        window.onYouTubeIframeAPIReady = callback;
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = callback;
    };

    const initYouTube = (videoUrl: string) => {
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        setError('Invalid YouTube URL. Please check the link.');
        return;
      }
      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';
      const playerDiv = document.createElement('div');
      containerRef.current.appendChild(playerDiv);

      try {
        playerRef.current = new window.YT.Player(playerDiv, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            controls: isHost ? 1 : 0,
            disablekb: isHost ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            fs: 1, // Allow fullscreen for both host and participants
            iv_load_policy: 3, // Hide video annotations
            autoplay: 0 // Don't auto-play initially
          },
          events: {
            onReady: () => {
              console.log('YouTube player ready');
              setError(null);
            },
            onError: (event: any) => {
              console.error('YouTube error:', event.data);
              const errorMessages: { [key: number]: string } = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found or private',
                101: 'Video embedding disabled by owner',
                150: 'Video embedding disabled by owner'
              };
              setError(errorMessages[event.data] || 'YouTube player error. Please check the video URL.');
            },
            onStateChange: (event: any) => {
              const playing = event.data === window.YT.PlayerState.PLAYING;
              const time = playerRef.current?.getCurrentTime() || 0;
              
              // Detect seeking: when user changes position significantly
              const seekDifference = Math.abs(time - lastSeekTimeRef.current);
              if (seekDifference > 0.5) {
                lastSeekTimeRef.current = time;
                // Only trigger onSeek for actual seeks, not natural playback
                if (onSeek && playing === true && isHost) {
                  console.log('🎬 Host seeking to:', time);
                  onSeek(time);
                }
              }
              
              onStateChange?.({ playing, time });
            }
          }
        });
      } catch (err) {
        console.error('Error initializing YouTube player:', err);
        setError('Failed to load YouTube player');
      }
    };

    const extractYouTubeId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/,
        /youtube\.com\/embed\/([^?#]+)/,
        /youtube\.com\/v\/([^?#]+)/,
        /youtube\.com\/shorts\/([^?#]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      return null;
    };

    const loadVimeoAPI = (callback: () => void) => {
      if (window.Vimeo) {
        callback();
        return;
      }

      if (document.querySelector('script[src*="player.vimeo.com"]')) {
        const checkVimeo = setInterval(() => {
          if (window.Vimeo) {
            clearInterval(checkVimeo);
            callback();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = callback;
      script.onerror = () => setError('Failed to load Vimeo player');
      document.head.appendChild(script);
    };

    const initVimeo = (videoUrl: string) => {
      const videoId = extractVimeoId(videoUrl);
      if (!videoId) {
        setError('Invalid Vimeo URL. Please check the link.');
        return;
      }
      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';
      const iframe = document.createElement('iframe');
      // Build Vimeo URL with appropriate parameters
      const vimeoUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
      
      // For participants: hide controls and show only fullscreen
      if (!isHost) {
        vimeoUrl.searchParams.set('h', videoId);
        vimeoUrl.searchParams.set('controls', '0');
        vimeoUrl.searchParams.set('title', '0');
        vimeoUrl.searchParams.set('byline', '0');
        vimeoUrl.searchParams.set('portrait', '0');
        vimeoUrl.searchParams.set('badge', '0');
        vimeoUrl.searchParams.set('autopause', '1');
        vimeoUrl.searchParams.set('autoplay', '1');
      }
      
      iframe.src = vimeoUrl.toString();
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      containerRef.current.appendChild(iframe);

      if (window.Vimeo) {
        try {
          playerRef.current = new window.Vimeo.Player(iframe);

          playerRef.current.ready().then(() => {
            console.log('Vimeo player ready');
            setError(null);
          }).catch((err: any) => {
            console.error('Vimeo error:', err);
            setError('Failed to load Vimeo video');
          });

          if (isHost) {
            playerRef.current.on('play', async () => {
              const time = await playerRef.current.getCurrentTime();
              onStateChange?.({ playing: true, time });
            });

            playerRef.current.on('pause', async () => {
              const time = await playerRef.current.getCurrentTime();
              onStateChange?.({ playing: false, time });
            });

            // Track seeking for Vimeo (only on actual seek events)
            playerRef.current.on('seeking', async () => {
              const time = await playerRef.current.getCurrentTime();
              console.log('🎬 Host seeking to:', time);
              onSeek?.(time);
            });

            // Track volume changes
            playerRef.current.on('volumechange', async () => {
              const volume = await playerRef.current.getVolume();
              onVolumeChange?.(volume);
            });
          } else {
            // Participant: listen to play/pause but not seek controls
            playerRef.current.on('play', async () => {
              const time = await playerRef.current.getCurrentTime();
              onStateChange?.({ playing: true, time });
            });

            playerRef.current.on('pause', async () => {
              const time = await playerRef.current.getCurrentTime();
              onStateChange?.({ playing: false, time });
            });
          }
        } catch (err) {
          console.error('Error initializing Vimeo player:', err);
          setError('Failed to initialize Vimeo player');
        }
      }
    };

    const extractVimeoId = (url: string): string | null => {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : null;
    };

    if (error) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-center space-y-2 p-6">
            <div className="text-[#EF4444] text-lg font-semibold">{error}</div>
            <p className="text-[#9CA3AF] text-sm">Please try a different video URL</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-black">
        <div ref={containerRef} className="w-full h-full bg-black" />
        {/* Overlay to block participant controls */}
        {!isHost && (
          <div
            className="absolute inset-0 z-10"
            style={{
              cursor: 'default',
              pointerEvents: 'auto',
              // Transparent but blocks clicks
            }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              // Prevent any mouse interaction
              if (!isHost) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDoubleClick={(e) => {
              // Prevent double-click to play/pause
              if (!isHost) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
