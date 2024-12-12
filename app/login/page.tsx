'use client'

import AcmeLogo from '@/app/ui/acme-logo';
import LoginForm from '@/app/ui/login-form';
import { useEffect } from 'react';
 
export default function LoginPage() {

    const generateHash = async (password) => {
        try {
          const response = await fetch('/api/hash-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
          });
      
          const data = await response.json();
          if (response.ok) {
            console.log('Hash generado:', data.hash);
            return data.hash;
          } else {
            console.error('Error:', data.error);
          }
        } catch (error) {
          console.error('Error al generar el hash:', error);
        }
      };

      useEffect(()=>{
        generateHash('123456');
      },[])


  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}