'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentService } from '@/services/comment.service';
import { useAuthStore } from '@/store/useAuthStore';
import { FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => CommentService.getComments(videoId, { page: 1, limit: 50 }),
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      CommentService.createComment({
        videoId,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      setCommentText('');
      toast.success('Comentario publicado');
    },
    onError: () => {
      toast.error('Error al publicar comentario');
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      CommentService.createComment({
        videoId,
        content,
        parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      setReplyText('');
      setReplyingTo(null);
      toast.success('Respuesta publicada');
    },
    onError: () => {
      toast.error('Error al publicar respuesta');
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => CommentService.toggleLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para comentar');
      return;
    }
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para responder');
      return;
    }
    if (replyText.trim()) {
      createReplyMutation.mutate({ parentId, content: replyText });
    }
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const commentDate = new Date(date);
    const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return commentDate.toLocaleDateString();
  };

  const CommentItem = ({ comment, isReply = false }: { comment: any; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3 mb-4">
        <img
          src={comment.user.avatarUrl || '/default-avatar.png'}
          alt={comment.user.username}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-dark-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-sm">
                {comment.user.username}
              </span>
              <span className="text-dark-400 text-xs">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isPinned && (
                <span className="bg-primary-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                  Fijado
                </span>
              )}
            </div>
            <p className="text-white text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2 px-3">
            <button
              onClick={() => likeCommentMutation.mutate(comment.id)}
              disabled={!isAuthenticated}
              className="flex items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
            >
              <FiHeart className="w-4 h-4" />
              <span className="text-xs">{comment.likesCount}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                disabled={!isAuthenticated}
                className="flex items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span className="text-xs">Responder</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => handleSubmitReply(e, comment.id)}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta..."
                className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-400 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <FiMessageCircle className="w-5 h-5" />
        Comentarios ({comments?.length || 0})
      </h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <img
              src={user?.avatarUrl || '/default-avatar.png'}
              alt={user?.username}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Añade un comentario..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentText.trim() || createCommentMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createCommentMutation.isPending ? 'Publicando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-dark-700 rounded-lg text-center">
          <p className="text-dark-400 text-sm">
            Inicia sesión para dejar un comentario
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-dark-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-20 bg-dark-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment: any) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FiMessageCircle className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400">No hay comentarios aún</p>
          <p className="text-dark-500 text-sm">Sé el primero en comentar</p>
        </div>
      )}
    </div>
  );
}
