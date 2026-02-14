
import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Allowing exact case matching for username and password
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('USUARIO O CONTRASEÑA INCORRECTOS');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 uppercase">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300 uppercase">
        <div className="flex flex-col items-center text-center uppercase">
          <div className="p-4 bg-blue-600/10 rounded-2xl mb-4">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase">IXTAPALUCA</h2>
          <p className="text-slate-400 mt-2 font-medium uppercase">CONTROL DE OPERATIVOS POLICIALES</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 uppercase">
          <div className="space-y-4 uppercase">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="USUARIO"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-white"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="CONTRASEÑA"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold uppercase">{error}</p>}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] uppercase">
            INICIAR SESION
          </button>
        </form>

        <div className="text-center pt-4 uppercase">
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest uppercase">SEGURIDAD PUBLICA MUNICIPAL</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
