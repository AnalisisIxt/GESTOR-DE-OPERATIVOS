
import React, { useState } from 'react';
import { Shield, Key, Save, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { removeAccents } from '../utils';

interface UserProfileProps {
  user: User;
  updatePassword: (p: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, updatePassword }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('LAS CONTRASEÑAS NO COINCIDEN');
      return;
    }
    if (newPass.length < 4) {
      alert('LA CONTRASEÑA DEBE TENER AL MENOS 4 CARACTERES');
      return;
    }
    updatePassword(newPass);
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 uppercase">
      <header className="flex flex-col items-center text-center uppercase">
        <div className="p-4 bg-blue-600/10 rounded-3xl mb-4">
          <Shield className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-3xl font-black uppercase">MI CONTRASEÑA</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase">{removeAccents(user.fullName)}</p>
        <span className="mt-2 text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded uppercase tracking-widest">
          {user.role}
        </span>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 uppercase">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 uppercase">
          <Key className="w-5 h-5 text-blue-500" />
          <h3 className="font-black text-lg uppercase">ACTUALIZAR CREDENCIALES</h3>
        </div>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 uppercase">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <p className="text-[11px] text-yellow-400 font-medium uppercase">
            UNA VEZ QUE CAMBIEN LA CONTRASEÑA, GUARDELA YA QUE SOLO EL USUARIO PODRA RECUPERARLA.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 uppercase">
          <label className="block uppercase">
            <span className="text-xs text-slate-500 uppercase font-black tracking-widest uppercase">NUEVA CONTRASEÑA</span>
            <input 
              type="password" 
              required
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
          </label>
          <label className="block uppercase">
            <span className="text-xs text-slate-500 uppercase font-black tracking-widest uppercase">CONFIRMAR CONTRASEÑA</span>
            <input 
              type="password" 
              required
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
            />
          </label>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] uppercase"
          >
            <Save className="w-5 h-5" />
            ACTUALIZAR CONTRASEÑA
          </button>
        </form>
      </section>

      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl uppercase">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 text-center uppercase">DETALLES TECNICOS</p>
        <div className="space-y-1 text-xs text-center uppercase">
          <p className="text-slate-400 uppercase">USUARIO: <span className="text-white font-mono uppercase">@{user.username}</span></p>
          <p className="text-slate-400 uppercase">ACCESO: <span className="text-white uppercase">{removeAccents(user.assignedRegion || 'MUNICIPIO COMPLETO')}</span></p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
