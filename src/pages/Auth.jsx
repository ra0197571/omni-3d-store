import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) await login(email, pass);
      else await signup(email, pass, name);
      navigate('/'); // Login ke baad home par bhej dein
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} 
        className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-md w-full border-b-8 border-primary">
        
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 text-center">
          {isLogin ? "Welcome Back" : "Join OMNI-3D"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Full Name" className="w-full p-5 bg-slate-100 rounded-2xl outline-none" 
            onChange={(e)=>setName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email Address" className="w-full p-5 bg-slate-100 rounded-2xl outline-none" 
          onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-5 bg-slate-100 rounded-2xl outline-none" 
          onChange={(e)=>setPass(e.target.value)} required />
          
          <button className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
            {isLogin ? "Login to Account" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-slate-400 cursor-pointer" onClick={()=>setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign Up" : "Already a member? Login"}
        </p>
      </motion.div>
    </div>
  );
}