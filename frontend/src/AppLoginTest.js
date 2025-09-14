import React from 'react';
import Login from './pages/Login';

export default function AppLoginTest(){
  console.log('AppLoginTest tipo Login =', typeof Login, Login && Object.keys(Login));
  return (
    <div style={{padding:32}}>
      <h3>Teste Isolado Login</h3>
      <Login />
    </div>
  );
}