'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { FiX, FiMail, FiLock, FiUser, FiCalendar } from 'react-icons/fi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  agreedToTerms: boolean;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  if (!isOpen) return null;

  const handleLogin = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(data);
      setUser(response.user);
      toast.success('¡Bienvenido de vuelta!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Verify age (must be 18+)
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (age < 18 || (age === 18 && monthDiff < 0)) {
      toast.error('Debes tener al menos 18 años para registrarte');
      return;
    }

    try {
      setIsLoading(true);
      const { confirmPassword, ...registerData } = data;
      const response = await AuthService.register(registerData);
      setUser(response.user);
      toast.success('¡Cuenta creada exitosamente!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="email"
                    {...loginForm.register('email', { required: true })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    {...loginForm.register('password', { required: true })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="text"
                    {...registerForm.register('username', {
                      required: true,
                      minLength: 3,
                      maxLength: 20,
                      pattern: /^[a-zA-Z0-9_]+$/
                    })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="usuario123"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="email"
                    {...registerForm.register('email', { required: true })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Fecha de Nacimiento (debes tener 18+ años)
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="date"
                    {...registerForm.register('birthDate', { required: true })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    {...registerForm.register('password', {
                      required: true,
                      minLength: 8
                    })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    {...registerForm.register('confirmPassword', { required: true })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...registerForm.register('agreedToTerms', { required: true })}
                  className="mt-1 w-4 h-4 rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm text-dark-300">
                  Acepto los{' '}
                  <a href="/terms" className="text-primary-400 hover:underline" target="_blank">
                    Términos de Servicio
                  </a>{' '}
                  y confirmo que tengo al menos 18 años
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-dark-400 text-sm">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-primary-400 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
