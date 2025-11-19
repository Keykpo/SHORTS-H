'use client';

import { useState } from 'react';
import { shareService } from '@/services/share.service';
import { useQuery } from '@tanstack/react-query';
import { FiX, FiCopy, FiCheck, FiFacebook, FiTwitter } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ShareModalProps {
  videoId?: string;
  playlistId?: string;
  onClose: () => void;
}

export default function ShareModal({ videoId, playlistId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const { data: shareData } = useQuery({
    queryKey: ['shareLink', videoId, playlistId],
    queryFn: async () => {
      if (videoId) {
        return await shareService.generateVideoShareLink(videoId);
      } else if (playlistId) {
        return await shareService.generatePlaylistShareLink(playlistId);
      }
      return null;
    },
    enabled: !!(videoId || playlistId),
  });

  const shareUrl = shareData?.shareUrl || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el enlace');
    }
  };

  const handleSharePlatform = async (platform: string) => {
    if (videoId) {
      await shareService.trackShare(videoId, platform);
    } else if (playlistId) {
      await shareService.trackShare(playlistId, platform);
    }

    let shareUrlPlatform = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const title = shareData?.video?.title || shareData?.playlist?.name || 'Mira esto en AnimeShorts';
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'twitter':
        shareUrlPlatform = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrlPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrlPlatform = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrlPlatform = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'reddit':
        shareUrlPlatform = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
    }

    if (shareUrlPlatform) {
      window.open(shareUrlPlatform, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-2xl font-bold text-white">Compartir</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Share URL */}
          <div className="mb-6">
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Enlace para compartir
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-5 h-5" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-5 h-5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="mb-6">
            <label className="block text-dark-300 text-sm font-medium mb-3">
              Compartir en redes sociales
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSharePlatform('twitter')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiTwitter className="w-5 h-5" />
                <span>Twitter</span>
              </button>

              <button
                onClick={() => handleSharePlatform('facebook')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiFacebook className="w-5 h-5" />
                <span>Facebook</span>
              </button>

              <button
                onClick={() => handleSharePlatform('whatsapp')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => handleSharePlatform('telegram')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                <span>Telegram</span>
              </button>

              <button
                onClick={() => handleSharePlatform('reddit')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF4500] text-white rounded-lg hover:opacity-90 transition-opacity col-span-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
                <span>Reddit</span>
              </button>
            </div>
          </div>

          {/* Preview Info */}
          {shareData && (
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-dark-400 text-xs mb-2">Vista previa:</p>
              <div className="flex items-start gap-3">
                {(shareData.video?.thumbnailUrl || shareData.playlist?.thumbnailUrl) && (
                  <img
                    src={shareData.video?.thumbnailUrl || shareData.playlist?.thumbnailUrl}
                    alt="Preview"
                    className="w-20 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {shareData.video?.title || shareData.playlist?.name}
                  </p>
                  <p className="text-dark-400 text-xs truncate">
                    {shareData.video?.description || shareData.playlist?.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
