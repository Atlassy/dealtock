
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Resend } from 'resend';
import { render } from 'npm:@react-email/render';
import MagicLinkEmail from './MagicLinkEmail.tsx';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface WebhookPayload {
  type: 'EMAIL_ACTION';
  record: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      locale?: 'fr' | 'ar' | 'en';
    };
  };
  data: {
    email_action_type: 'magiclink' | 'recovery' | 'signup' | 'invite';
    redirect_to: string;
    supabase_url: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables.');
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { data, record } = payload;
    const user = record;
    const { email_action_type, redirect_to, supabase_url } = data;
    const user_email = user.email;
    const locale = user.raw_user_meta_data?.locale || 'fr';

    const resend = new Resend(RESEND_API_KEY);

    const subjectMapping = {
      fr: {
        magiclink: 'Votre lien de connexion magique Dealtock',
        recovery: 'Réinitialisation de votre mot de passe Dealtock',
        signup: 'Bienvenue sur Dealtock ! Confirmez votre e-mail',
        invite: 'Vous avez été invité à rejoindre Dealtock',
      },
      en: {
        magiclink: 'Your Dealtock Magic Link',
        recovery: 'Reset Your Dealtock Password',
        signup: 'Welcome to Dealtock! Confirm Your Email',
        invite: 'You have been invited to join Dealtock',
      },
      ar: {
        magiclink: 'رابط الدخول السحري الخاص بك في Dealtock',
        recovery: 'إعادة تعيين كلمة المرور الخاصة بك في Dealtock',
        signup: 'مرحبًا بك في Dealtock! قم بتأكيد بريدك الإلكتروني',
        invite: 'لقد تمت دعوتك للانضمام إلى Dealtock',
      },
    };

    const subject = subjectMapping[locale][email_action_type] || subjectMapping.en[email_action_type];

    const reactElement = MagicLinkEmail({
      email_action_type,
      supabase_url,
      redirect_to,
      user_email,
      locale,
    });

    const emailHtml = render(reactElement);

    await resend.emails.send({
      from: 'Dealtock <support@dealtock.pro>',
      to: [user_email],
      subject: subject,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
