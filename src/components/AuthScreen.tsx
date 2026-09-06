import { supabase } from '../data/supabase';

export function AuthScreen() {
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <main className="auth-screen">
      <div className="auth-screen__panel">
        <p className="eyebrow">Pizarra</p>
        <h1>Tu espacio para avanzar.</h1>
        <p>Inicia sesión para guardar tus objetivos, hitos y reportes en Supabase.</p>
        <button type="button" className="button button--primary" onClick={() => void handleGoogleSignIn()}>
          Continuar con Google
        </button>
      </div>
    </main>
  );
}
